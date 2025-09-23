import { json } from '@sveltejs/kit';
import { EditionModel } from '$lib/db/models/editions.js';
import { initializeDatabase } from '$lib/db/connection.js';

// Initialize database on server startup
initializeDatabase();
const editionModel = new EditionModel();

export async function GET() {
    try {
        const editions = await editionModel.getAll();
        return json(editions);
    } catch (error) {
        console.error('Error fetching editions:', error);
        return json({ error: error.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const { editionData, contentItems } = await request.json();

        const edition = await editionModel.create(editionData, contentItems);
        return json(edition);
    } catch (error) {
        console.error('Error creating edition:', error);
        return json({ error: error.message }, { status: 500 });
    }
}