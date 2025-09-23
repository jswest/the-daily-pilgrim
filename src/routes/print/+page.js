export async function load({ url, fetch }) {
    const issueParam = url.searchParams.get('issue');

    if (!issueParam) {
        throw new Error('Issue parameter is required (e.g., ?issue=1 or ?issue=2025-09-22)');
    }

    try {
        let edition;

        // Check if issue parameter is a number (issue number) or date string
        if (/^\d+$/.test(issueParam)) {
            // It's an issue number
            const response = await fetch(`/api/editions`);
            const editions = await response.json();
            edition = editions.find(e => (e.issue_number || e.issueNumber) === parseInt(issueParam));

            if (!edition) {
                throw new Error(`Edition with issue number ${issueParam} not found`);
            }
        } else {
            // It's a date string, find by published date
            const response = await fetch(`/api/editions`);
            const editions = await response.json();
            edition = editions.find(e => (e.published_at || e.publishedAt).startsWith(issueParam));

            if (!edition) {
                throw new Error(`Edition with date ${issueParam} not found`);
            }
        }

        // Get full edition details
        const detailResponse = await fetch(`/api/editions/${edition.id}`);
        const fullEdition = await detailResponse.json();

        return {
            edition: fullEdition
        };
    } catch (error) {
        console.error('Error loading edition for print:', error);
        throw error;
    }
}