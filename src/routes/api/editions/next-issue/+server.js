import { json } from '@sveltejs/kit';
import { getDatabase } from "$lib/db/connection.js";
import { editions } from '$lib/db/schema.js';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        const db = getDatabase();

        // Get the highest issue number and add 1
        const result = await db
            .select({ maxIssue: sql`MAX(${editions.issueNumber})` })
            .from(editions);

        const nextIssueNumber = (result[0]?.maxIssue || 0) + 1;

        return json({ nextIssueNumber });
    } catch (error) {
        console.error('Error getting next issue number:', error);
        return json({ error: error.message }, { status: 500 });
    }
}