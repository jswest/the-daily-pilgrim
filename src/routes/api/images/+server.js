import { json } from '@sveltejs/kit';
import { ImageModel } from '$lib/db/models/images.js';
import { initializeDatabase } from '$lib/db/connection.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

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

export async function GET() {
    try {
        const model = ensureDatabase();
        const images = await model.getAll();
        return json(images);
    } catch (error) {
        console.error('Error fetching images:', error);
        return json({ error: 'Failed to fetch images' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const model = ensureDatabase();
        const formData = await request.formData();
        
        const file = formData.get('file');
        const caption = formData.get('caption') || null;
        const imageType = formData.get('imageType') || 'inline';
        const authorIds = JSON.parse(formData.get('authorIds') || '[]');
        
        if (!file || file.size === 0) {
            return json({ error: 'No file provided' }, { status: 400 });
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return json({ error: 'Invalid file type. Please upload an image.' }, { status: 400 });
        }
        
        // Get file extension
        const extension = file.name.split('.').pop().toLowerCase();
        
        // Create image record first to get ID
        const imageData = {
            filename: file.name,
            original_path: '', // Will be updated after we get the ID
            caption,
            image_type: imageType,
            width: null, // TODO: Extract from image
            height: null, // TODO: Extract from image
            is_processed: false
        };
        
        const image = await model.create(imageData, authorIds);
        
        // Save file with image ID as filename
        const filename = `${image.id}.${extension}`;
        const filePath = join(process.cwd(), 'src', 'images', filename);
        
        const buffer = Buffer.from(await file.arrayBuffer());
        writeFileSync(filePath, buffer);
        
        // Update the image record with the correct paths
        const updatedImageData = {
            ...imageData,
            original_path: `src/images/${filename}`,
            processed_path: null // Will be set when image is processed
        };
        
        const finalImage = await model.updateById(image.id, updatedImageData, authorIds);
        
        return json(finalImage);
    } catch (error) {
        console.error('Error uploading image:', error);
        return json({ error: 'Failed to upload image' }, { status: 500 });
    }
}