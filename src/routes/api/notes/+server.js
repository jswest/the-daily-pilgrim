import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';
import { notes } from '$lib/db/schema.js';

export async function GET() {
	try {
		const db = getDatabase();

		const allNotes = await db.query.notes.findMany({
			orderBy: (notes, { desc }) => [desc(notes.createdAt)],
		});

		return json(allNotes);
	} catch (error) {
		console.error('Error fetching notes:', error);
		return json({ error: 'Failed to fetch notes' }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const db = getDatabase();
		const { title, body } = await request.json();

		if (!title || !body) {
			return json({ error: 'Title and body are required' }, { status: 400 });
		}

		const [note] = await db
			.insert(notes)
			.values({ title, body })
			.returning();

		return json(note);
	} catch (error) {
		console.error('Error creating note:', error);
		return json({ error: 'Failed to create note' }, { status: 500 });
	}
}
