export async function load({ params, fetch }) {
    const poemId = params.id;
    
    try {
        const response = await fetch(`/api/poems/${poemId}`);
        
        if (response.ok) {
            const poem = await response.json();
            return {
                poem,
                poemId
            };
        } else if (response.status === 404) {
            return {
                poem: null,
                error: 'Poem not found',
                poemId
            };
        } else {
            return {
                poem: null,
                error: 'Failed to load poem',
                poemId
            };
        }
    } catch (error) {
        console.error('Error loading poem:', error);
        return {
            poem: null,
            error: 'Network error. Please try again.',
            poemId
        };
    }
}