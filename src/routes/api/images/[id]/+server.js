import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';
import { images, imageAuthors, authors } from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
    try {
        const db = getDatabase();
        const imageId = parseInt(params.id);

        if (isNaN(imageId)) {
            return json({ error: 'Invalid image ID' }, { status: 400 });
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
            return json({ error: 'Image not found' }, { status: 404 });
        }

        return json(image);
    } catch (error) {
        console.error('Error fetching image:', error);
        return json({ error: 'Failed to fetch image' }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    try {
        const db = getDatabase();
        const imageId = parseInt(params.id);

        if (isNaN(imageId)) {
            return json({ error: 'Invalid image ID' }, { status: 400 });
        }

        const { caption, image_type, authorIds = [] } = await request.json();

        if (!image_type) {
            return json({ error: 'Image type is required' }, { status: 400 });
        }

        // Update the image
        const [image] = await db
            .update(images)
            .set({
                caption,
                imageType: image_type,
                updatedAt: new Date().toISOString()
            })
            .where(eq(images.id, imageId))
            .returning();

        if (!image) {
            return json({ error: 'Image not found' }, { status: 404 });
        }

        // Update author relationships
        await db
            .delete(imageAuthors)
            .where(eq(imageAuthors.imageId, imageId));

        if (authorIds.length > 0) {
            for (const authorId of authorIds) {
                await db.insert(imageAuthors).values({
                    imageId,
                    authorId,
                    role: 'photographer'
                });
            }
        }

        return json(image);
    } catch (error) {
        console.error('Error updating image:', error);
        if (error.message === 'Image not found') {
            return json({ error: 'Image not found' }, { status: 404 });
        }
        return json({ error: 'Failed to update image' }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const db = getDatabase();
        const imageId = parseInt(params.id);

        if (isNaN(imageId)) {
            return json({ error: 'Invalid image ID' }, { status: 400 });
        }

        const result = await db
            .delete(images)
            .where(eq(images.id, imageId))
            .returning();

        if (result.length === 0) {
            return json({ error: 'Image not found' }, { status: 404 });
        }

        return json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        return json({ error: 'Failed to delete image' }, { status: 500 });
    }
}