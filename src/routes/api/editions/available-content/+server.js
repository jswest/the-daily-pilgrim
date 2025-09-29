import { json } from '@sveltejs/kit';
import { getDatabase } from "$lib/db/connection.js";

export async function GET() {
    try {
        const db = getDatabase();

        // Get all articles and poems that aren't assigned to editions yet
        const articles = await db.query.articles.findMany({
            with: {
                authors: {
                    with: {
                        author: true,
                    },
                },
            },
            orderBy: (articles, { desc }) => [desc(articles.createdAt)],
        });

        const poems = await db.query.poems.findMany({
            with: {
                authors: {
                    with: {
                        author: true,
                    },
                },
            },
            orderBy: (poems, { desc }) => [desc(poems.createdAt)],
        });

        const images = await db.query.images.findMany({
            with: {
                authors: {
                    with: {
                        author: true,
                    },
                },
            },
            orderBy: (images, { desc }) => [desc(images.createdAt)],
        });

        return json({
            articles: articles.map(article => ({
                ...article,
                authors: article.authors.map(a => a.author.name).join(', ')
            })),
            poems: poems.map(poem => ({
                ...poem,
                authors: poem.authors.map(a => a.author.name).join(', ')
            })),
            images: images.map(image => ({
                ...image,
                authors: image.authors?.map(a => a.author.name).join(', ') || ''
            }))
        });
    } catch (error) {
        console.error('Error fetching available content:', error);
        return json({ error: error.message }, { status: 500 });
    }
}