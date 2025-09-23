import { error } from '@sveltejs/kit';
import { getDatabase, initializeDatabase } from '$lib/db/connection.js';

export async function load({ params }) {
    try {
        initializeDatabase();
        const database = getDatabase();
        const imageId = params.id;

        // Get the image
        const image = database.prepare(`
            SELECT id, filename, original_path, processed_path, caption, image_type, 
                   width, height, is_processed, processing_status, created_at, updated_at
            FROM images 
            WHERE id = ?
        `).get(imageId);

        if (!image) {
            throw error(404, 'Image not found');
        }

        // Get the image's authors
        const authors = database.prepare(`
            SELECT a.id, a.name, a.bio, ia.role
            FROM authors a
            JOIN image_authors ia ON a.id = ia.author_id
            WHERE ia.image_id = ?
            ORDER BY a.name
        `).all(imageId);

        // Add authors to image
        image.authors = authors;

        return {
            image,
            imageId
        };
    } catch (err) {
        console.error('Error loading image for edit:', err);
        
        if (err.status === 404) {
            throw err;
        }
        
        throw error(500, 'Failed to load image');
    }
}