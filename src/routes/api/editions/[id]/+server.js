import { json } from '@sveltejs/kit';
import { getDatabase } from "$lib/db/connection.js";
import { editions, editionArticles, editionPoems, editionImages } from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
    try {
        const db = getDatabase();
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return json({ error: 'Invalid edition ID' }, { status: 400 });
        }

        const edition = await db.query.editions.findFirst({
            where: (editions, { eq }) => eq(editions.id, id),
            with: {
                coverImage: true,
                articles: {
                    with: {
                        article: {
                            with: {
                                authors: {
                                    with: {
                                        author: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: (editionArticles, { asc }) => [asc(editionArticles.orderPosition)],
                },
                poems: {
                    with: {
                        poem: {
                            with: {
                                authors: {
                                    with: {
                                        author: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: (editionPoems, { asc }) => [asc(editionPoems.orderPosition)],
                },
            },
        });

        if (!edition) {
            return json({ error: 'Edition not found' }, { status: 404 });
        }

        // Format the data for frontend consumption
        const formattedEdition = {
            ...edition,
            articles: edition.articles?.map(ea => ({
                ...ea.article,
                orderPosition: ea.orderPosition,
                authors: ea.article.authors?.map(aa => aa.author) || []
            })) || [],
            poems: edition.poems?.map(ep => ({
                ...ep.poem,
                orderPosition: ep.orderPosition,
                authors: ep.poem.authors?.map(pa => pa.author) || []
            })) || [],
            images: edition.images?.map(ei => ({
                ...ei.image,
                orderPosition: ei.orderPosition,
                usageType: ei.usageType,
                authors: ei.image.authors?.map(ia => ia.author) || []
            })) || []
        };

        return json(formattedEdition);
    } catch (error) {
        console.error('Error fetching edition:', error);
        return json({ error: error.message }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    try {
        const db = getDatabase();
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return json({ error: 'Invalid edition ID' }, { status: 400 });
        }

        const { issueNumber, publishedAt, coverImageId, orderedContent = [] } = await request.json();

        // Update the edition
        const [edition] = await db
            .update(editions)
            .set({
                issueNumber,
                publishedAt,
                coverImageId,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(editions.id, id))
            .returning();

        if (!edition) {
            return json({ error: 'Edition not found' }, { status: 404 });
        }

        // Delete all existing relationships
        await db.delete(editionArticles).where(eq(editionArticles.editionId, id));
        await db.delete(editionPoems).where(eq(editionPoems.editionId, id));
        await db.delete(editionImages).where(eq(editionImages.editionId, id));

        // Process orderedContent in order, maintaining global orderPosition
        let globalPosition = 1;

        for (const item of orderedContent) {
            if (item.type === 'article') {
                await db.insert(editionArticles).values({
                    editionId: id,
                    articleId: item.id,
                    orderPosition: globalPosition++
                });
            } else if (item.type === 'poem') {
                await db.insert(editionPoems).values({
                    editionId: id,
                    poemId: item.id,
                    orderPosition: globalPosition++
                });
            } else if (item.type === 'image') {
                await db.insert(editionImages).values({
                    editionId: id,
                    imageId: item.id,
                    usageType: item.usageType || 'content',
                    orderPosition: globalPosition++
                });
            }
        }

        return json(edition);
    } catch (error) {
        console.error('Error updating edition:', error);
        return json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const db = getDatabase();
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return json({ error: 'Invalid edition ID' }, { status: 400 });
        }

        const result = await db
            .delete(editions)
            .where(eq(editions.id, id))
            .returning();

        if (result.length === 0) {
            return json({ error: 'Edition not found' }, { status: 404 });
        }

        return json({ message: 'Edition deleted successfully' });
    } catch (error) {
        console.error('Error deleting edition:', error);
        return json({ error: error.message }, { status: 500 });
    }
}