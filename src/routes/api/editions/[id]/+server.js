import { json } from '@sveltejs/kit';
import { EditionModel } from '$lib/db/models/editions.js';
import { initializeDatabase } from '$lib/db/connection.js';

// Initialize database on server startup
initializeDatabase();
const editionModel = new EditionModel();

export async function GET({ params }) {
    try {
        const id = parseInt(params.id);
        const edition = await editionModel.getById(id);

        if (!edition) {
            return json({ error: 'Edition not found' }, { status: 404 });
        }

        return json(edition);
    } catch (error) {
        console.error('Error fetching edition:', error);
        return json({ error: error.message }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    try {
        const id = parseInt(params.id);
        const { editionData, contentItems } = await request.json();

        const edition = await editionModel.updateById(id, editionData, contentItems);
        return json(edition);
    } catch (error) {
        console.error('Error updating edition:', error);
        return json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const id = parseInt(params.id);
        const result = await editionModel.deleteById(id);
        return json({ success: true, result });
    } catch (error) {
        console.error('Error deleting edition:', error);
        return json({ error: error.message }, { status: 500 });
    }
}