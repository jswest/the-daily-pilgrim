import { error } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';

export async function load({ params }) {
    try {
        const db = getDatabase();
        const poemId = parseInt(params.id);

        if (isNaN(poemId)) {
            throw error(400, 'Invalid poem ID');
        }

        const poem = await db.query.poems.findFirst({
            where: (poems, { eq }) => eq(poems.id, poemId),
            with: {
                authors: {
                    with: {
                        author: true,
                    },
                    orderBy: (poemAuthors, { asc }) => [asc(poemAuthors.orderPosition)],
                },
            },
        });

        if (!poem) {
            throw error(404, 'Poem not found');
        }

        // Format authors for the form
        const formattedPoem = {
            ...poem,
            authors: poem.authors.map(a => a.author)
        };

        return {
            poem: formattedPoem,
            poemId
        };
    } catch (err) {
        console.error('Error loading poem for edit:', err);

        if (err.status === 404 || err.status === 400) {
            throw err;
        }

        throw error(500, 'Failed to load poem');
    }
}