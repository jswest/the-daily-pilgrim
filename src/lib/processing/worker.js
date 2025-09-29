import { getDatabase } from '../db/connection.js';
import { images } from "../db/schema.js";
import { floydSteinbergDither, getImageDimensions, validateImage } from './dithering.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { eq, or, and, lt, asc, desc, count } from 'drizzle-orm';

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
    async getNextBatch() {
        try {
            const pendingImages = await this.db.query.images.findMany({
                where: and(
                    or(
                        eq(images.processingStatus, 'pending'),
                        eq(images.processingStatus, 'failed')
                    ),
                    lt(images.processingAttempts, this.options.maxRetries)
                ),
                orderBy: [asc(images.createdAt)],
                limit: this.options.batchSize
            });

            return pendingImages;
        } catch (error) {
            console.error('Error getting next batch:', error);
            return [];
        }
    }

    /**
     * Update image processing status
     */
    async updateImageStatus(imageId, status, data = {}) {
        try {
            const updateData = {
                processingStatus: status,
                updatedAt: new Date().toISOString()
            };

            if (status === 'processing') {
                updateData.processingStartedAt = new Date().toISOString();
                // For incrementing attempts, we need to fetch current value first
                const currentImage = await this.db.query.images.findFirst({
                    where: eq(images.id, imageId),
                    columns: { processingAttempts: true }
                });
                updateData.processingAttempts = (currentImage?.processingAttempts || 0) + 1;
            }

            if (status === 'completed') {
                updateData.processingCompletedAt = new Date().toISOString();
                updateData.isProcessed = true;

                if (data.processedPath) {
                    updateData.processedPath = data.processedPath;
                }

                if (data.width && data.height) {
                    updateData.width = data.width;
                    updateData.height = data.height;
                }
            }

            if (status === 'failed' && data.error) {
                updateData.processingError = data.error;
            }

            await this.db
                .update(images)
                .set(updateData)
                .where(eq(images.id, imageId));

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
            await this.updateImageStatus(imageId, 'processing');

            // Check if original file exists
            const originalPath = join(process.cwd(), image.originalPath);
            if (!existsSync(originalPath)) {
                throw new Error(`Original file not found: ${image.originalPath}`);
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
            await this.updateImageStatus(imageId, 'completed', {
                processedPath: `src/images/${processedFilename}`,
                width,
                height
            });

            console.log(`Successfully processed image ${imageId}`);

        } catch (error) {
            console.error(`Error processing image ${imageId}:`, error);

            await this.updateImageStatus(imageId, 'failed', {
                error: error.message
            });
            
            throw error;
        }
    }

    /**
     * Process a batch of images
     */
    async processBatch() {
        const batch = await this.getNextBatch();
        
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

        const image = await this.db.query.images.findFirst({
            where: eq(images.id, imageId)
        });

        if (!image) {
            throw new Error(`Image with ID ${imageId} not found`);
        }

        await this.processImage(image);
    }

    /**
     * Get processing queue status
     */
    async getQueueStatus() {
        if (!this.db) {
            throw new Error('Worker not initialized');
        }

        // Get counts for each status
        const statusCounts = await Promise.all([
            this.db.select({ count: count() }).from(images).where(eq(images.processingStatus, 'pending')),
            this.db.select({ count: count() }).from(images).where(eq(images.processingStatus, 'processing')),
            this.db.select({ count: count() }).from(images).where(eq(images.processingStatus, 'completed')),
            this.db.select({ count: count() }).from(images).where(eq(images.processingStatus, 'failed'))
        ]);

        return {
            pending: statusCounts[0][0]?.count || 0,
            processing: statusCounts[1][0]?.count || 0,
            completed: statusCounts[2][0]?.count || 0,
            failed: statusCounts[3][0]?.count || 0,
            currentJobs: this.currentJobs.size,
            isRunning: this.isRunning
        };
    }

    /**
     * Reset failed images to pending status
     */
    async resetFailedImages() {
        if (!this.db) {
            throw new Error('Worker not initialized');
        }

        const result = await this.db
            .update(images)
            .set({
                processingStatus: 'pending',
                processingError: null,
                processingAttempts: 0,
                updatedAt: new Date().toISOString()
            })
            .where(eq(images.processingStatus, 'failed'));

        return result.rowsAffected || 0;
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