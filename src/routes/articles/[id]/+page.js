export async function load({ params, fetch }) {
    const articleId = params.id;
    
    try {
        const response = await fetch(`/api/articles/${articleId}`);
        
        if (response.ok) {
            const article = await response.json();
            return {
                article,
                articleId
            };
        } else if (response.status === 404) {
            return {
                article: null,
                error: 'Article not found',
                articleId
            };
        } else {
            return {
                article: null,
                error: 'Failed to load article',
                articleId
            };
        }
    } catch (error) {
        console.error('Error loading article:', error);
        return {
            article: null,
            error: 'Network error. Please try again.',
            articleId
        };
    }
}