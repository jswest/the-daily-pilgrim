import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';
import { notes } from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
	try {
		const db = getDatabase();
		const noteId = parseInt(params.id);

		if (isNaN(noteId)) {
			return json({ error: 'Invalid note ID' }, { status: 400 });
		}

		const note = await db.query.notes.findFirst({
			where: (n, { eq }) => eq(n.id, noteId),
		});

		if (!note) {
			return json({ error: 'Note not found' }, { status: 404 });
		}

		return json(note);
	} catch (error) {
		console.error('Error fetching note:', error);
		return json({ error: 'Failed to fetch note' }, { status: 500 });
	}
}

export async function PUT({ params, request }) {
	try {
		const db = getDatabase();
		const noteId = parseInt(params.id);

		if (isNaN(noteId)) {
			return json({ error: 'Invalid note ID' }, { status: 400 });
		}

		const { title, body } = await request.json();

		if (!title || !body) {
			return json({ error: 'Title and body are required' }, { status: 400 });
		}

		const [note] = await db
			.update(notes)
			.set({
				title,
				body,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(notes.id, noteId))
			.returning();

		if (!note) {
			return json({ error: 'Note not found' }, { status: 404 });
		}

		return json(note);
	} catch (error) {
		console.error('Error updating note:', error);
		return json({ error: 'Failed to update note' }, { status: 500 });
	}
}

export async function DELETE({ params }) {
	try {
		const db = getDatabase();
		const noteId = parseInt(params.id);

		if (isNaN(noteId)) {
			return json({ error: 'Invalid note ID' }, { status: 400 });
		}

		const result = await db
			.delete(notes)
			.where(eq(notes.id, noteId))
			.returning();

		if (result.length === 0) {
			return json({ error: 'Note not found' }, { status: 404 });
		}

		return json({ message: 'Note deleted successfully' });
	} catch (error) {
		console.error('Error deleting note:', error);
		return json({ error: 'Failed to delete note' }, { status: 500 });
	}
}
