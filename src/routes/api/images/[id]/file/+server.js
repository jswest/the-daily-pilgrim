import { error } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ImageModel } from '$lib/db/models/images.js';
import { initializeDatabase } from '$lib/db/connection.js';

let imageModel;

function ensureDatabase() {
    if (!imageModel) {
        try {
            initializeDatabase();
            imageModel = new ImageModel();
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }
    return imageModel;
}

function getMimeType(extension) {
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
    };
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

export async function GET({ params, url }) {
    try {
        const model = ensureDatabase();
        const imageId = parseInt(params.id);
        
        if (isNaN(imageId)) {
            throw error(400, 'Invalid image ID');
        }
        
        // Get image from database to verify it exists
        const image = await model.getById(imageId);
        if (!image) {
            throw error(404, 'Image not found');
        }
        
        // Determine which version to serve (prefer processed if available, unless original explicitly requested)
        const forceOriginal = url.searchParams.get('original') === 'true';
        const imagePath = !forceOriginal && image.processedPath && image.isProcessed
            ? image.processedPath 
            : image.originalPath;
        
        // Convert relative path to absolute path
        const absolutePath = join(process.cwd(), imagePath);
        
        // Check if file exists
        if (!existsSync(absolutePath)) {
            throw error(404, 'Image file not found on disk');
        }
        
        // Read the file
        const fileBuffer = readFileSync(absolutePath);
        
        // Get file extension from the original filename or path
        const extension = image.filename.split('.').pop() || 'jpg';
        const mimeType = getMimeType(extension);
        
        // Return the image with appropriate headers
        return new Response(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
                'ETag': `"${image.id}-${image.updated_at}"`, // ETag for caching
                'Content-Disposition': `inline; filename="${image.filename}"`
            }
        });
        
    } catch (err) {
        console.error('Error serving image:', err);
        
        if (err.status) {
            throw err; // Re-throw SvelteKit errors
        }
        
        throw error(500, 'Failed to serve image');
    }
}