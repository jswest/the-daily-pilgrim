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

export async function GET() {
    try {
        const model = ensureDatabase();
        const poems = await model.getAll();
        return json(poems);
    } catch (error) {
        console.error('Error fetching poems:', error);
        return json({ error: 'Failed to fetch poems' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const model = ensureDatabase();
        const { title, body, authorIds } = await request.json();
        
        if (!title || !body) {
            return json({ error: 'Title and body are required' }, { status: 400 });
        }
        
        const poemData = { title, body };
        const poem = await model.create(poemData, authorIds || []);
        
        return json(poem);
    } catch (error) {
        console.error('Error creating poem:', error);
        return json({ error: 'Failed to create poem' }, { status: 500 });
    }
}