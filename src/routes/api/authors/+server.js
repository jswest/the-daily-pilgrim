import { json } from '@sveltejs/kit';
import { AuthorModel } from '$lib/db/models/authors.js';
import { initializeDatabase } from '$lib/db/connection.js';

let authorModel;

function ensureDatabase() {
    if (!authorModel) {
        try {
            initializeDatabase();
            authorModel = new AuthorModel();
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }
    return authorModel;
}

export async function GET({ url }) {
    try {
        const model = ensureDatabase();
        const query = url.searchParams.get('q');
        
        if (query) {
            const authors = await model.searchByName(query);
            return json(authors);
        } else {
            const authors = await model.getAll();
            return json(authors);
        }
    } catch (error) {
        console.error('Error fetching authors:', error);
        return json({ error: 'Failed to fetch authors' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const model = ensureDatabase();
        const { name, bio } = await request.json();
        
        if (!name) {
            return json({ error: 'Name is required' }, { status: 400 });
        }
        
        const author = await model.create(name, bio);
        return json(author);
    } catch (error) {
        console.error('Error creating author:', error);
        return json({ error: 'Failed to create author' }, { status: 500 });
    }
}