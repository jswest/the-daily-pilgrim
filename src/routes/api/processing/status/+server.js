import { json } from '@sveltejs/kit';
import { imageProcessor } from '$lib/processing/worker.js';

export async function GET() {
    try {
        // Initialize processor if needed
        if (!imageProcessor.db) {
            await imageProcessor.initialize();
        }
        
        const status = imageProcessor.getQueueStatus();
        return json(status);
    } catch (error) {
        console.error('Error getting processing status:', error);
        return json({ error: 'Failed to get processing status' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const { action, imageId } = await request.json();
        
        // Initialize processor if needed
        if (!imageProcessor.db) {
            await imageProcessor.initialize();
        }
        
        switch (action) {
            case 'reset_failed':
                const resetCount = imageProcessor.resetFailedImages();
                return json({ 
                    message: `Reset ${resetCount} failed images to pending status`,
                    resetCount 
                });
                
            case 'process_image':
                if (!imageId) {
                    return json({ error: 'Image ID required' }, { status: 400 });
                }
                
                await imageProcessor.processImageById(imageId);
                return json({ message: `Processing image ${imageId}` });
                
            case 'start_worker':
                if (!imageProcessor.isRunning) {
                    // Start worker in background
                    imageProcessor.start().catch(console.error);
                    return json({ message: 'Worker started' });
                } else {
                    return json({ message: 'Worker already running' });
                }
                
            case 'stop_worker':
                imageProcessor.stop();
                return json({ message: 'Worker stopped' });
                
            default:
                return json({ error: 'Invalid action' }, { status: 400 });
        }
        
    } catch (error) {
        console.error('Error in processing action:', error);
        return json({ error: error.message }, { status: 500 });
    }
}