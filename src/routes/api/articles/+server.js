import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';
import { articles, articleAuthors } from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { canonicalizeUrl } from '$lib/util.js';

export async function GET() {
    try {
        const db = getDatabase();

        const articlesWithAuthors = await db.query.articles.findMany({
            with: {
                authors: {
                    with: {
                        author: true,
                    },
                    orderBy: (articleAuthors, { asc }) => [asc(articleAuthors.orderPosition)],
                },
            },
            orderBy: (articles, { desc }) => [desc(articles.createdAt)],
        });

        // Format authors as comma-separated string for UI compatibility
        const formatted = articlesWithAuthors.map(article => ({
            ...article,
            authors: article.authors.map(a => a.author.name).join(', ')
        }));

        return json(formatted);
    } catch (error) {
        console.error('Error fetching articles:', error);
        return json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const db = getDatabase();
        const { hed, dek, body, authorIds = [], title_image_id, url, sourcePublication } = await request.json();

        if (!hed || !body) {
            return json({ error: 'Hed and body are required' }, { status: 400 });
        }

        // Canonicalize URL if provided
        let canonicalUrl = null;
        let hostname = null;
        if (url && url.trim()) {
            const result = canonicalizeUrl(url);
            canonicalUrl = result.canonical;
            hostname = result.hostname;
        }

        // Create the article first
        const [article] = await db
            .insert(articles)
            .values({
                hed,
                dek,
                body,
                titleImageId: title_image_id,
                url: canonicalUrl,
                sourcePublication: sourcePublication || null,
                hostname,
            })
            .returning();

        // Add author relationships
        if (authorIds.length > 0) {
            for (let i = 0; i < authorIds.length; i++) {
                await db.insert(articleAuthors).values({
                    articleId: article.id,
                    authorId: authorIds[i],
                    orderPosition: i + 1,
                });
            }
        }

        return json(article);
    } catch (error) {
        console.error('Error creating article:', error);

        // Check for UNIQUE constraint violation
        if (error.message && error.message.includes('UNIQUE constraint')) {
            return json({ error: 'An article with this URL already exists' }, { status: 409 });
        }

        return json({ error: 'Failed to create article' }, { status: 500 });
    }
}