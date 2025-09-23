export async function load({ params, fetch }) {
    const imageId = params.id;
    
    try {
        const response = await fetch(`/api/images/${imageId}`);
        
        if (response.ok) {
            const image = await response.json();
            return {
                image,
                imageId
            };
        } else if (response.status === 404) {
            return {
                image: null,
                error: 'Image not found',
                imageId
            };
        } else {
            return {
                image: null,
                error: 'Failed to load image',
                imageId
            };
        }
    } catch (error) {
        console.error('Error loading image:', error);
        return {
            image: null,
            error: 'Network error. Please try again.',
            imageId
        };
    }
}