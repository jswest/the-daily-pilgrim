import { getDatabase, initializeDatabase } from '../db/connection.js';
import { floydSteinbergDither, getImageDimensions, validateImage } from './dithering.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export class ImageProcessor {
    constructor(options = {}) {
        this.options = {
            maxRetries: 3,
            retryDelay: 5000, // 5 seconds
            batchSize: 5,
            pollInterval: 10000, // 10 seconds
            ...options
        };
        
        this.db = null;
        this.isRunning = false;
        this.currentJobs = new Set();
    }

    async initialize() {
        try {
            initializeDatabase();
            this.db = getDatabase();
            console.log('Image processor initialized');
        } catch (error) {
            console.error('Failed to initialize image processor:', error);
            throw error;
        }
    }

    /**
     * Get next batch of images to process
     */
    getNextBatch() {
        try {
            const query = `
                SELECT * FROM images 
                WHERE processing_status IN ('pending', 'failed') 
                AND processing_attempts < ?
                ORDER BY 
                    CASE WHEN processing_status = 'pending' THEN 0 ELSE 1 END,
                    created_at ASC
                LIMIT ?
            `;
            
            return this.db.prepare(query).all(this.options.maxRetries, this.options.batchSize);
        } catch (error) {
            console.error('Error getting next batch:', error);
            return [];
        }
    }

    /**
     * Update image processing status
     */
    updateImageStatus(imageId, status, data = {}) {
        try {
            const updates = [`processing_status = ?`, `updated_at = CURRENT_TIMESTAMP`];
            const values = [status];
            
            if (status === 'processing') {
                updates.push(`processing_started_at = CURRENT_TIMESTAMP`);
                updates.push(`processing_attempts = processing_attempts + 1`);
            }
            
            if (status === 'completed') {
                updates.push(`processing_completed_at = CURRENT_TIMESTAMP`);
                updates.push(`is_processed = 1`);
                
                if (data.processedPath) {
                    updates.push(`processed_path = ?`);
                    values.push(data.processedPath);
                }
                
                if (data.width && data.height) {
                    updates.push(`width = ?`, `height = ?`);
                    values.push(data.width, data.height);
                }
            }
            
            if (status === 'failed' && data.error) {
                updates.push(`processing_error = ?`);
                values.push(data.error);
            }
            
            values.push(imageId);
            
            const query = `UPDATE images SET ${updates.join(', ')} WHERE id = ?`;
            this.db.prepare(query).run(...values);
            
        } catch (error) {
            console.error('Error updating image status:', error);
        }
    }

    /**
     * Process a single image
     */
    async processImage(image) {
        const imageId = image.id;
        
        try {
            console.log(`Processing image ${imageId}: ${image.filename}`);
            
            // Mark as processing
            this.updateImageStatus(imageId, 'processing');
            
            // Check if original file exists
            const originalPath = join(process.cwd(), image.original_path);
            if (!existsSync(originalPath)) {
                throw new Error(`Original file not found: ${image.original_path}`);
            }
            
            // Read original file
            const originalBuffer = readFileSync(originalPath);
            
            // Validate image
            if (!await validateImage(originalBuffer)) {
                throw new Error('Invalid or unsupported image format');
            }
            
            // Get original dimensions if not already stored
            let { width, height } = image;
            if (!width || !height) {
                const dimensions = await getImageDimensions(originalBuffer);
                width = dimensions.width;
                height = dimensions.height;
            }
            
            // Process with Floyd-Steinberg dithering
            const processedBuffer = await floydSteinbergDither(originalBuffer, {
                format: 'png',
                maxWidth: 1200,
                maxHeight: 1200
            });
            
            // Generate processed filename
            const extension = 'png'; // Always save as PNG for 1-bit
            const processedFilename = `${imageId}_processed.${extension}`;
            const processedPath = join(process.cwd(), 'src', 'images', processedFilename);
            
            // Save processed file
            writeFileSync(processedPath, processedBuffer);
            
            // Update database
            this.updateImageStatus(imageId, 'completed', {
                processedPath: `src/images/${processedFilename}`,
                width,
                height
            });
            
            console.log(`Successfully processed image ${imageId}`);
            
        } catch (error) {
            console.error(`Error processing image ${imageId}:`, error);
            
            this.updateImageStatus(imageId, 'failed', {
                error: error.message
            });
            
            throw error;
        }
    }

    /**
     * Process a batch of images
     */
    async processBatch() {
        const batch = this.getNextBatch();
        
        if (batch.length === 0) {
            return 0;
        }
        
        console.log(`Processing batch of ${batch.length} images`);
        
        const promises = batch.map(async (image) => {
            if (this.currentJobs.has(image.id)) {
                return; // Skip if already processing
            }
            
            this.currentJobs.add(image.id);
            
            try {
                await this.processImage(image);
            } catch (error) {
                // Error already logged in processImage
            } finally {
                this.currentJobs.delete(image.id);
            }
        });
        
        await Promise.allSettled(promises);
        return batch.length;
    }

    /**
     * Start the background worker
     */
    async start() {
        if (this.isRunning) {
            console.log('Worker is already running');
            return;
        }
        
        if (!this.db) {
            await this.initialize();
        }
        
        this.isRunning = true;
        console.log('Starting image processing worker...');
        
        while (this.isRunning) {
            try {
                const processedCount = await this.processBatch();
                
                if (processedCount === 0) {
                    // No work to do, wait before next poll
                    await this.sleep(this.options.pollInterval);
                } else {
                    // Processed some images, check for more immediately
                    await this.sleep(1000);
                }
                
            } catch (error) {
                console.error('Error in worker loop:', error);
                await this.sleep(this.options.retryDelay);
            }
        }
        
        console.log('Image processing worker stopped');
    }

    /**
     * Stop the background worker
     */
    stop() {
        console.log('Stopping image processing worker...');
        this.isRunning = false;
    }

    /**
     * Process a specific image by ID
     */
    async processImageById(imageId) {
        if (!this.db) {
            await this.initialize();
        }
        
        const image = this.db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
        
        if (!image) {
            throw new Error(`Image with ID ${imageId} not found`);
        }
        
        await this.processImage(image);
    }

    /**
     * Get processing queue status
     */
    getQueueStatus() {
        if (!this.db) {
            throw new Error('Worker not initialized');
        }
        
        const statusQuery = `
            SELECT 
                processing_status,
                COUNT(*) as count
            FROM images 
            GROUP BY processing_status
        `;
        
        const results = this.db.prepare(statusQuery).all();
        
        const status = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0
        };
        
        results.forEach(row => {
            status[row.processing_status] = row.count;
        });
        
        return {
            ...status,
            currentJobs: this.currentJobs.size,
            isRunning: this.isRunning
        };
    }

    /**
     * Reset failed images to pending status
     */
    resetFailedImages() {
        if (!this.db) {
            throw new Error('Worker not initialized');
        }
        
        const result = this.db.prepare(`
            UPDATE images 
            SET processing_status = 'pending', 
                processing_error = NULL,
                processing_attempts = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE processing_status = 'failed'
        `).run();
        
        return result.changes;
    }

    /**
     * Utility function for delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();