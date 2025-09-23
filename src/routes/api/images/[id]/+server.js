import { json } from '@sveltejs/kit';
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

export async function GET({ params }) {
    try {
        const model = ensureDatabase();
        const imageId = parseInt(params.id);
        
        if (isNaN(imageId)) {
            return json({ error: 'Invalid image ID' }, { status: 400 });
        }
        
        const image = model.getById(imageId);
        
        if (!image) {
            return json({ error: 'Image not found' }, { status: 404 });
        }
        
        return json(image);
    } catch (error) {
        console.error('Error fetching image:', error);
        return json({ error: 'Failed to fetch image' }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    try {
        const model = ensureDatabase();
        const imageId = parseInt(params.id);
        
        if (isNaN(imageId)) {
            return json({ error: 'Invalid image ID' }, { status: 400 });
        }
        
        const { caption, image_type, authorIds } = await request.json();
        
        if (!image_type) {
            return json({ error: 'Image type is required' }, { status: 400 });
        }
        
        // Get existing image to preserve file paths
        const existingImage = model.getById(imageId);
        if (!existingImage) {
            return json({ error: 'Image not found' }, { status: 404 });
        }
        
        const imageData = {
            filename: existingImage.filename,
            original_path: existingImage.original_path,
            processed_path: existingImage.processed_path,
            caption,
            image_type,
            width: existingImage.width,
            height: existingImage.height,
            is_processed: existingImage.is_processed
        };
        
        // Convert authorIds to the format expected by ImageModel
        const authorsWithRoles = (authorIds || []).map(authorId => ({ 
            authorId, 
            role: 'photographer' // Default role, could be made configurable later
        }));
        
        const image = model.updateById(imageId, imageData, authorsWithRoles);
        
        return json(image);
    } catch (error) {
        console.error('Error updating image:', error);
        return json({ error: 'Failed to update image' }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const model = ensureDatabase();
        const imageId = parseInt(params.id);
        
        if (isNaN(imageId)) {
            return json({ error: 'Invalid image ID' }, { status: 400 });
        }
        
        const result = model.deleteById(imageId);
        
        if (result.changes === 0) {
            return json({ error: 'Image not found' }, { status: 404 });
        }
        
        return json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        return json({ error: 'Failed to delete image' }, { status: 500 });
    }
}