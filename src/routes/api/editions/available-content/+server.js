import { json } from '@sveltejs/kit';
import { EditionModel } from '$lib/db/models/editions.js';
import { initializeDatabase } from '$lib/db/connection.js';

// Initialize database on server startup
initializeDatabase();
const editionModel = new EditionModel();

export async function GET() {
    try {
        const availableContent = await editionModel.getAvailableContent();
        return json(availableContent);
    } catch (error) {
        console.error('Error fetching available content:', error);
        return json({ error: error.message }, { status: 500 });
    }
}