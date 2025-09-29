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
                authors: ea.article.authors?.map(aa => aa.author.name).join(', ') || ''
            })) || [],
            poems: edition.poems?.map(ep => ({
                ...ep.poem,
                authors: ep.poem.authors?.map(pa => pa.author.name).join(', ') || ''
            })) || [],
            images: edition.images?.map(ei => ({
                ...ei.image,
                usageType: ei.usageType,
                authors: ei.image.authors?.map(ia => ia.author.name).join(', ') || ''
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

        const { issueNumber, publishedAt, coverImageId, articleIds = [], poemIds = [], imageIds = [] } = await request.json();

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

        // Update article relationships
        await db.delete(editionArticles).where(eq(editionArticles.editionId, id));
        if (articleIds.length > 0) {
            for (let i = 0; i < articleIds.length; i++) {
                await db.insert(editionArticles).values({
                    editionId: id,
                    articleId: articleIds[i],
                    orderPosition: i + 1
                });
            }
        }

        // Update poem relationships
        await db.delete(editionPoems).where(eq(editionPoems.editionId, id));
        if (poemIds.length > 0) {
            for (let i = 0; i < poemIds.length; i++) {
                await db.insert(editionPoems).values({
                    editionId: id,
                    poemId: poemIds[i],
                    orderPosition: i + 1
                });
            }
        }

        // Update image relationships
        await db.delete(editionImages).where(eq(editionImages.editionId, id));
        if (imageIds.length > 0) {
            for (let i = 0; i < imageIds.length; i++) {
                await db.insert(editionImages).values({
                    editionId: id,
                    imageId: imageIds[i].id,
                    usageType: imageIds[i].usageType,
                    orderPosition: i + 1
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