import { error } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';

export async function load({ params }) {
	try {
		const db = getDatabase();
		const noteId = parseInt(params.id);

		if (isNaN(noteId)) {
			throw error(400, 'Invalid note ID');
		}

		const note = await db.query.notes.findFirst({
			where: (notes, { eq }) => eq(notes.id, noteId),
		});

		if (!note) {
			throw error(404, 'Note not found');
		}

		return {
			note,
			noteId
		};
	} catch (err) {
		console.error('Error loading note:', err);

		if (err.status === 404 || err.status === 400) {
			throw err;
		}

		throw error(500, 'Failed to load note');
	}
}
