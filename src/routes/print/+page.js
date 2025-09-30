export async function load({ url, fetch }) {
    const issueParam = url.searchParams.get('issue');

    if (!issueParam) {
        throw new Error('Issue parameter is required (e.g., ?issue=1 or ?issue=2025-09-22)');
    }

    try {
        let editionId;

        // Check if issue parameter is a number (issue number) or date string
        if (/^\d+$/.test(issueParam)) {
            // It's an issue number - find the edition ID
            const response = await fetch(`/api/editions`);
            const editions = await response.json();
            const foundEdition = editions.find(e => (e.issue_number || e.issueNumber) === parseInt(issueParam));

            if (!foundEdition) {
                throw new Error(`Edition with issue number ${issueParam} not found`);
            }
            editionId = foundEdition.id;
        } else {
            // It's a date string, find by published date
            const response = await fetch(`/api/editions`);
            const editions = await response.json();
            const foundEdition = editions.find(e => (e.published_at || e.publishedAt).startsWith(issueParam));

            if (!foundEdition) {
                throw new Error(`Edition with date ${issueParam} not found`);
            }
            editionId = foundEdition.id;
        }

        // Fetch the full edition with orderPosition data
        const editionResponse = await fetch(`/api/editions/${editionId}`);
        const edition = await editionResponse.json();

        return {
            edition,
        };
    } catch (error) {
        console.error('Error loading edition for print:', error);
        throw error;
    }
}