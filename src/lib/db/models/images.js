import { getDatabase, getRawDatabase } from '../connection.js';
import { images, authors, imageAuthors } from '../schema.js';
import { eq, desc, sql } from 'drizzle-orm';

export class ImageModel {
    constructor() {
        this.db = getDatabase();
        this.rawDb = getRawDatabase();
    }

    async getAll() {
        // Get images with concatenated author names
        const query = `
            SELECT i.*, GROUP_CONCAT(au.name, ', ') as authors
            FROM images i
            LEFT JOIN image_authors ia ON i.id = ia.image_id
            LEFT JOIN authors au ON ia.author_id = au.id
            GROUP BY i.id
            ORDER BY i.created_at DESC
        `;

        return this.rawDb.prepare(query).all();
    }

    async getById(id) {
        // Get the image
        const image = await this.db
            .select()
            .from(images)
            .where(eq(images.id, id))
            .get();

        if (!image) {
            return null;
        }

        // Get image authors
        const imageAuthorsList = await this.db
            .select({
                id: authors.id,
                name: authors.name,
                bio: authors.bio,
                role: imageAuthors.role,
            })
            .from(authors)
            .innerJoin(imageAuthors, eq(authors.id, imageAuthors.authorId))
            .where(eq(imageAuthors.imageId, id));

        image.authors = imageAuthorsList;

        return image;
    }

    async create(imageData, authorIds = []) {
        return this.rawDb.transaction(() => {
            const {
                filename,
                original_path,
                processed_path = null,
                caption = null,
                image_type,
                width = null,
                height = null,
                is_processed = false
            } = imageData;

            // Insert the image
            const result = this.db
                .insert(images)
                .values({
                    filename,
                    originalPath: original_path,
                    processedPath: processed_path,
                    caption,
                    imageType: image_type,
                    width,
                    height,
                    isProcessed: is_processed,
                    processingStatus: 'pending',
                })
                .returning()
                .get();

            // Insert author relationships
            if (authorIds.length > 0) {
                const authorRelations = authorIds.map(({ authorId, role = 'photographer' }) => ({
                    imageId: result.id,
                    authorId: authorId,
                    role: role,
                }));

                this.db
                    .insert(imageAuthors)
                    .values(authorRelations)
                    .run();
            }

            return this.getById(result.id);
        });
    }

    async updateById(id, imageData, authorIds = []) {
        return this.rawDb.transaction(() => {
            const {
                filename,
                original_path,
                processed_path = null,
                caption = null,
                image_type,
                width = null,
                height = null,
                is_processed = false,
                processing_status = 'pending'
            } = imageData;

            // Update the image
            const result = this.db
                .update(images)
                .set({
                    filename,
                    originalPath: original_path,
                    processedPath: processed_path,
                    caption,
                    imageType: image_type,
                    width,
                    height,
                    isProcessed: is_processed,
                    processingStatus: processing_status,
                    updatedAt: new Date(),
                })
                .where(eq(images.id, id))
                .returning()
                .get();

            // Delete existing author relationships
            this.db
                .delete(imageAuthors)
                .where(eq(imageAuthors.imageId, id))
                .run();

            // Insert new author relationships
            if (authorIds.length > 0) {
                const authorRelations = authorIds.map(({ authorId, role = 'photographer' }) => ({
                    imageId: id,
                    authorId: authorId,
                    role: role,
                }));

                this.db
                    .insert(imageAuthors)
                    .values(authorRelations)
                    .run();
            }

            return this.getById(id);
        });
    }

    async deleteById(id) {
        return this.db
            .delete(images)
            .where(eq(images.id, id))
            .run();
    }
}