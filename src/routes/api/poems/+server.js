import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';
import { poems, poemAuthors } from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const db = getDatabase();

        const poemsWithAuthors = await db.query.poems.findMany({
            with: {
                authors: {
                    with: {
                        author: true,
                    },
                    orderBy: (poemAuthors, { asc }) => [asc(poemAuthors.orderPosition)],
                },
            },
            orderBy: (poems, { desc }) => [desc(poems.createdAt)],
        });

        // Format authors as comma-separated string for UI compatibility
        const formatted = poemsWithAuthors.map(poem => ({
            ...poem,
            authors: poem.authors.map(a => a.author.name).join(', ')
        }));

        return json(formatted);
    } catch (error) {
        console.error('Error fetching poems:', error);
        return json({ error: 'Failed to fetch poems' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const db = getDatabase();
        const { title, body, authorIds = [] } = await request.json();

        if (!title || !body) {
            return json({ error: 'Title and body are required' }, { status: 400 });
        }

        // Create the poem first
        const [poem] = await db
            .insert(poems)
            .values({ title, body })
            .returning();

        // Add author relationships
        if (authorIds.length > 0) {
            for (let i = 0; i < authorIds.length; i++) {
                await db.insert(poemAuthors).values({
                    poemId: poem.id,
                    authorId: authorIds[i],
                    orderPosition: i + 1,
                });
            }
        }

        return json(poem);
    } catch (error) {
        console.error('Error creating poem:', error);
        return json({ error: 'Failed to create poem' }, { status: 500 });
    }
}