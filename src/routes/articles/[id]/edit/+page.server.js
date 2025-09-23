import { error } from '@sveltejs/kit';
import { getDatabase, initializeDatabase } from '$lib/db/connection.js';

export async function load({ params }) {
    try {
        initializeDatabase();
        const database = getDatabase();
        const articleId = params.id;

        // Get the article
        const article = database.prepare(`
            SELECT id, hed, dek, body, created_at, updated_at
            FROM articles 
            WHERE id = ?
        `).get(articleId);

        if (!article) {
            throw error(404, 'Article not found');
        }

        // Get the article's authors
        const authors = database.prepare(`
            SELECT a.id, a.name, a.bio
            FROM authors a
            JOIN article_authors aa ON a.id = aa.author_id
            WHERE aa.article_id = ?
            ORDER BY a.name
        `).all(articleId);

        // Add authors to article
        article.authors = authors;

        return {
            article,
            articleId
        };
    } catch (err) {
        console.error('Error loading article for edit:', err);
        
        if (err.status === 404) {
            throw err;
        }
        
        throw error(500, 'Failed to load article');
    }
}