import { json } from '@sveltejs/kit';
import { ArticleModel } from '$lib/db/models/articles.js';
import { initializeDatabase } from '$lib/db/connection.js';

let articleModel;

function ensureDatabase() {
    if (!articleModel) {
        try {
            initializeDatabase();
            articleModel = new ArticleModel();
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }
    return articleModel;
}

export async function GET() {
    try {
        const model = ensureDatabase();
        const articles = await model.getAll();
        return json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        return json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const model = ensureDatabase();
        const { hed, dek, body, authorIds, title_image_id } = await request.json();
        
        if (!hed || !body) {
            return json({ error: 'Hed and body are required' }, { status: 400 });
        }
        
        const articleData = { hed, dek, body, title_image_id };
        const article = await model.create(articleData, authorIds || []);
        
        return json(article);
    } catch (error) {
        console.error('Error creating article:', error);
        return json({ error: 'Failed to create article' }, { status: 500 });
    }
}