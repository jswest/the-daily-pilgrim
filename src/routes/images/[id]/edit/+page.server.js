import { error } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';

export async function load({ params }) {
    try {
        const db = getDatabase();
        const imageId = parseInt(params.id);

        if (isNaN(imageId)) {
            throw error(400, 'Invalid image ID');
        }

        const image = await db.query.images.findFirst({
            where: (images, { eq }) => eq(images.id, imageId),
            with: {
                authors: {
                    with: {
                        author: true,
                    },
                },
            },
        });

        if (!image) {
            throw error(404, 'Image not found');
        }

        // Format authors for the form
        const formattedImage = {
            ...image,
            authors: image.authors.map(a => ({
                ...a.author,
                role: a.role
            }))
        };

        return {
            image: formattedImage,
            imageId
        };
    } catch (err) {
        console.error('Error loading image for edit:', err);

        if (err.status === 404 || err.status === 400) {
            throw err;
        }

        throw error(500, 'Failed to load image');
    }
}