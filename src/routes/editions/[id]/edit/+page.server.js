import { getDatabase } from "$lib/db/connection.js";
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    try {
        const db = getDatabase();
        const id = parseInt(params.id);

        if (isNaN(id)) {
            throw error(400, 'Invalid edition ID');
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
                images: {
                    with: {
                        image: {
                            with: {
                                authors: {
                                    with: {
                                        author: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!edition) {
            throw error(404, 'Edition not found');
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

        return {
            edition: formattedEdition,
            editionId: id
        };
    } catch (err) {
        console.error('Error loading edition for edit:', err);
        throw error(500, err.message || 'Failed to load edition');
    }
}