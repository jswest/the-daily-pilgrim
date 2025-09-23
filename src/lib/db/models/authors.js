import { getDatabase } from '../connection.js';
import { authors } from '../schema.js';
import { eq, like, sql } from 'drizzle-orm';

export class AuthorModel {
    constructor() {
        this.db = getDatabase();
    }

    async getAll() {
        return await this.db
            .select()
            .from(authors)
            .orderBy(authors.name);
    }

    async getById(id) {
        return await this.db
            .select()
            .from(authors)
            .where(eq(authors.id, id))
            .get();
    }

    async searchByName(query, limit = 10) {
        return await this.db
            .select()
            .from(authors)
            .where(like(authors.name, `%${query}%`))
            .orderBy(authors.name)
            .limit(limit);
    }

    async create(name, bio = null) {
        return await this.db
            .insert(authors)
            .values({ name, bio })
            .returning()
            .get();
    }

    async updateById(id, name, bio = null) {
        return await this.db
            .update(authors)
            .set({
                name,
                bio,
                updatedAt: new Date()
            })
            .where(eq(authors.id, id))
            .returning()
            .get();
    }

    async deleteById(id) {
        return await this.db
            .delete(authors)
            .where(eq(authors.id, id))
            .run();
    }
}