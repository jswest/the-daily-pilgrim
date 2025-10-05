import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/db/connection.js';
import { sql } from 'drizzle-orm';

export async function GET({ url }) {
	try {
		const db = getDatabase();
		const query = url.searchParams.get('q');

		// Get distinct source publications
		const result = await db.execute(sql`
			SELECT DISTINCT source_publication as name
			FROM articles
			WHERE source_publication IS NOT NULL
			${query ? sql`AND source_publication LIKE ${'%' + query + '%'}` : sql``}
			ORDER BY source_publication ASC
		`);

		// Format as array of objects with 'name' property for autocomplete
		const publications = result.rows.map(row => ({ name: row.name }));

		return json(publications);
	} catch (error) {
		console.error('Error fetching source publications:', error);
		return json({ error: 'Failed to fetch source publications' }, { status: 500 });
	}
}
