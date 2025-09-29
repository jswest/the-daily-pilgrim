import { error } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';

export async function load({ params }) {
    try {
        const db = getDatabase();
        const articleId = parseInt(params.id);

        if (isNaN(articleId)) {
            throw error(400, 'Invalid article ID');
        }

        const article = await db.query.articles.findFirst({
            where: (articles, { eq }) => eq(articles.id, articleId),
            with: {
                authors: {
                    with: {
                        author: true,
                    },
                    orderBy: (articleAuthors, { asc }) => [asc(articleAuthors.orderPosition)],
                },
            },
        });

        if (!article) {
            throw error(404, 'Article not found');
        }

        // Format authors for the form
        const formattedArticle = {
            ...article,
            authors: article.authors.map(a => a.author)
        };

        return {
            article: formattedArticle,
            articleId
        };
    } catch (err) {
        console.error('Error loading article for edit:', err);

        if (err.status === 404 || err.status === 400) {
            throw err;
        }

        throw error(500, 'Failed to load article');
    }
}