import { json } from '@sveltejs/kit';
import { PoemModel } from '$lib/db/models/poems.js';
import { initializeDatabase } from '$lib/db/connection.js';

let poemModel;

function ensureDatabase() {
    if (!poemModel) {
        try {
            initializeDatabase();
            poemModel = new PoemModel();
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }
    return poemModel;
}

export async function GET({ params }) {
    try {
        const model = ensureDatabase();
        const poemId = parseInt(params.id);
        
        if (isNaN(poemId)) {
            return json({ error: 'Invalid poem ID' }, { status: 400 });
        }
        
        const poem = model.getById(poemId);
        
        if (!poem) {
            return json({ error: 'Poem not found' }, { status: 404 });
        }
        
        return json(poem);
    } catch (error) {
        console.error('Error fetching poem:', error);
        return json({ error: 'Failed to fetch poem' }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    try {
        const model = ensureDatabase();
        const poemId = parseInt(params.id);
        
        if (isNaN(poemId)) {
            return json({ error: 'Invalid poem ID' }, { status: 400 });
        }
        
        const { title, body, authorIds } = await request.json();
        
        if (!title || !body) {
            return json({ error: 'Title and body are required' }, { status: 400 });
        }
        
        const poemData = { title, body };
        const poem = model.updateById(poemId, poemData, authorIds || []);
        
        if (!poem) {
            return json({ error: 'Poem not found' }, { status: 404 });
        }
        
        return json(poem);
    } catch (error) {
        console.error('Error updating poem:', error);
        return json({ error: 'Failed to update poem' }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const model = ensureDatabase();
        const poemId = parseInt(params.id);
        
        if (isNaN(poemId)) {
            return json({ error: 'Invalid poem ID' }, { status: 400 });
        }
        
        const result = model.deleteById(poemId);
        
        if (result.changes === 0) {
            return json({ error: 'Poem not found' }, { status: 404 });
        }
        
        return json({ message: 'Poem deleted successfully' });
    } catch (error) {
        console.error('Error deleting poem:', error);
        return json({ error: 'Failed to delete poem' }, { status: 500 });
    }
}