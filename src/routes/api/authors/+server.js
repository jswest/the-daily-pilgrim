import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';
import { authors } from '$lib/db/schema.js';

export async function GET({ url }) {
    try {
        const db = getDatabase();
        const query = url.searchParams.get('q');

        if (query) {
            const authorsList = await db.query.authors.findMany({
                where: (authors, { like }) => like(authors.name, `%${query}%`),
                orderBy: (authors, { asc }) => [asc(authors.name)],
            });
            return json(authorsList);
        } else {
            const authorsList = await db.query.authors.findMany({
                orderBy: (authors, { asc }) => [asc(authors.name)],
            });
            return json(authorsList);
        }
    } catch (error) {
        console.error('Error fetching authors:', error);
        return json({ error: 'Failed to fetch authors' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const db = getDatabase();
        const { name, bio } = await request.json();

        if (!name) {
            return json({ error: 'Name is required' }, { status: 400 });
        }

        const [author] = await db
            .insert(authors)
            .values({ name, bio })
            .returning();

        return json(author);
    } catch (error) {
        console.error('Error creating author:', error);
        return json({ error: 'Failed to create author' }, { status: 500 });
    }
}