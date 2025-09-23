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

export async function GET({ params }) {
    try {
        const model = ensureDatabase();
        const articleId = parseInt(params.id);
        
        if (isNaN(articleId)) {
            return json({ error: 'Invalid article ID' }, { status: 400 });
        }
        
        const article = await model.getById(articleId);
        
        if (!article) {
            return json({ error: 'Article not found' }, { status: 404 });
        }
        
        return json(article);
    } catch (error) {
        console.error('Error fetching article:', error);
        return json({ error: 'Failed to fetch article' }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    try {
        const model = ensureDatabase();
        const articleId = parseInt(params.id);
        
        if (isNaN(articleId)) {
            return json({ error: 'Invalid article ID' }, { status: 400 });
        }
        
        const { hed, dek, body, authorIds, title_image_id } = await request.json();
        
        if (!hed || !body) {
            return json({ error: 'Hed and body are required' }, { status: 400 });
        }
        
        const articleData = { hed, dek, body, title_image_id };
        const article = await model.updateById(articleId, articleData, authorIds || []);
        
        if (!article) {
            return json({ error: 'Article not found' }, { status: 404 });
        }
        
        return json(article);
    } catch (error) {
        console.error('Error updating article:', error);
        return json({ error: 'Failed to update article' }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const model = ensureDatabase();
        const articleId = parseInt(params.id);
        
        if (isNaN(articleId)) {
            return json({ error: 'Invalid article ID' }, { status: 400 });
        }
        
        const result = await model.deleteById(articleId);
        
        if (result.changes === 0) {
            return json({ error: 'Article not found' }, { status: 404 });
        }
        
        return json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        return json({ error: 'Failed to delete article' }, { status: 500 });
    }
}