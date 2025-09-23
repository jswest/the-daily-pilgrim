import { getDatabase, getRawDatabase } from '../connection.js';
import { poems, authors, poemAuthors } from '../schema.js';
import { eq, desc, sql } from 'drizzle-orm';

export class PoemModel {
    constructor() {
        this.db = getDatabase();
        this.rawDb = getRawDatabase();
    }

    async getAll() {
        // Get poems with concatenated author names
        const query = `
            SELECT p.*, GROUP_CONCAT(au.name, ', ') as authors
            FROM poems p
            LEFT JOIN poem_authors pa ON p.id = pa.poem_id
            LEFT JOIN authors au ON pa.author_id = au.id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `;

        return this.rawDb.prepare(query).all();
    }

    async getById(id) {
        // Get the poem
        const poem = await this.db
            .select()
            .from(poems)
            .where(eq(poems.id, id))
            .get();

        if (!poem) {
            return null;
        }

        // Get poem authors
        const poemAuthorsList = await this.db
            .select({
                id: authors.id,
                name: authors.name,
                bio: authors.bio,
                orderPosition: poemAuthors.orderPosition,
            })
            .from(authors)
            .innerJoin(poemAuthors, eq(authors.id, poemAuthors.authorId))
            .where(eq(poemAuthors.poemId, id))
            .orderBy(poemAuthors.orderPosition);

        poem.authors = poemAuthorsList;

        return poem;
    }

    async create(poemData, authorIds = []) {
        return this.rawDb.transaction(() => {
            const { title, body, order_in_edition = null } = poemData;

            // Insert the poem
            const result = this.db
                .insert(poems)
                .values({
                    title,
                    body,
                    orderInEdition: order_in_edition,
                })
                .returning()
                .get();

            // Insert author relationships
            if (authorIds.length > 0) {
                const authorRelations = authorIds.map((authorId, index) => ({
                    poemId: result.id,
                    authorId: authorId,
                    orderPosition: index + 1,
                }));

                this.db
                    .insert(poemAuthors)
                    .values(authorRelations)
                    .run();
            }

            return this.getById(result.id);
        });
    }

    async updateById(id, poemData, authorIds = []) {
        return this.rawDb.transaction(() => {
            const { title, body, order_in_edition = null } = poemData;

            // Update the poem
            const result = this.db
                .update(poems)
                .set({
                    title,
                    body,
                    orderInEdition: order_in_edition,
                    updatedAt: new Date(),
                })
                .where(eq(poems.id, id))
                .returning()
                .get();

            // Delete existing author relationships
            this.db
                .delete(poemAuthors)
                .where(eq(poemAuthors.poemId, id))
                .run();

            // Insert new author relationships
            if (authorIds.length > 0) {
                const authorRelations = authorIds.map((authorId, index) => ({
                    poemId: id,
                    authorId: authorId,
                    orderPosition: index + 1,
                }));

                this.db
                    .insert(poemAuthors)
                    .values(authorRelations)
                    .run();
            }

            return this.getById(id);
        });
    }

    async deleteById(id) {
        return this.db
            .delete(poems)
            .where(eq(poems.id, id))
            .run();
    }
}