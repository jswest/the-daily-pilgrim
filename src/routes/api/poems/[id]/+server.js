import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';
import { poems, poemAuthors } from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
    try {
        const db = getDatabase();
        const poemId = parseInt(params.id);

        if (isNaN(poemId)) {
            return json({ error: 'Invalid poem ID' }, { status: 400 });
        }

        const raw = await db.query.poems.findFirst({
            where: (p, { eq }) => eq(p.id, poemId),
            with: {
                authors: {
                    with: {
                        author: true,
                    },
                    orderBy: (poemAuthors, { asc }) => [asc(poemAuthors.orderPosition)],
                },
            },
        });

        if (!raw) {
            return json({ error: 'Poem not found' }, { status: 404 });
        }

        const poem = Object.assign(raw, {
            authors: raw.authors.map((au) => au.author),
        });

        return json(poem);
    } catch (error) {
        console.error('Error fetching poem:', error);
        return json({ error: 'Failed to fetch poem' }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    try {
        const db = getDatabase();
        const poemId = parseInt(params.id);

        if (isNaN(poemId)) {
            return json({ error: 'Invalid poem ID' }, { status: 400 });
        }

        const { title, body, authorIds = [] } = await request.json();

        if (!title || !body) {
            return json({ error: 'Title and body are required' }, { status: 400 });
        }

        const result = await db.transaction(async (tx) => {
            const [poem] = await tx
                .update(poems)
                .set({
                    title,
                    body,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(poems.id, poemId))
                .returning();

            if (!poem) {
                throw new Error('Poem not found');
            }

            await tx
                .delete(poemAuthors)
                .where(eq(poemAuthors.poemId, poemId));

            if (authorIds.length > 0) {
                const authorRelations = authorIds.map((authorId, index) => ({
                    poemId: poemId,
                    authorId: authorId,
                    orderPosition: index + 1,
                }));

                await tx.insert(poemAuthors).values(authorRelations);
            }

            return poem;
        });

        return json(result);
    } catch (error) {
        console.error('Error updating poem:', error);
        if (error.message === 'Poem not found') {
            return json({ error: 'Poem not found' }, { status: 404 });
        }
        return json({ error: 'Failed to update poem' }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const db = getDatabase();
        const poemId = parseInt(params.id);

        if (isNaN(poemId)) {
            return json({ error: 'Invalid poem ID' }, { status: 400 });
        }

        const result = await db
            .delete(poems)
            .where(eq(poems.id, poemId))
            .returning();

        if (result.length === 0) {
            return json({ error: 'Poem not found' }, { status: 404 });
        }

        return json({ message: 'Poem deleted successfully' });
    } catch (error) {
        console.error('Error deleting poem:', error);
        return json({ error: 'Failed to delete poem' }, { status: 500 });
    }
}