#!/usr/bin/env node

import { imageProcessor } from '../src/lib/processing/worker.js';

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        await imageProcessor.initialize();

        switch (command) {
            case 'status':
                const status = imageProcessor.getQueueStatus();
                console.log('Processing Queue Status:');
                console.log(`- Pending: ${status.pending}`);
                console.log(`- Processing: ${status.processing}`);
                console.log(`- Completed: ${status.completed}`);
                console.log(`- Failed: ${status.failed}`);
                console.log(`- Worker Running: ${status.isRunning}`);
                console.log(`- Current Jobs: ${status.currentJobs}`);
                break;

            case 'process':
                const imageId = args[1];
                if (imageId) {
                    console.log(`Processing image ${imageId}...`);
                    await imageProcessor.processImageById(parseInt(imageId));
                    console.log(`Image ${imageId} processed successfully`);
                } else {
                    console.log('Processing all pending images...');
                    const count = await imageProcessor.processBatch();
                    console.log(`Processed ${count} images`);
                }
                break;

            case 'reset':
                console.log('Resetting failed images to pending status...');
                const resetCount = imageProcessor.resetFailedImages();
                console.log(`Reset ${resetCount} failed images`);
                break;

            case 'worker':
                console.log('Starting image processing worker...');
                console.log('Press Ctrl+C to stop');
                
                // Handle graceful shutdown
                process.on('SIGINT', () => {
                    console.log('\nShutting down worker...');
                    imageProcessor.stop();
                    process.exit(0);
                });

                await imageProcessor.start();
                break;

            default:
                console.log('Image Processing CLI');
                console.log('');
                console.log('Usage:');
                console.log('  node scripts/process-images.js <command> [args]');
                console.log('');
                console.log('Commands:');
                console.log('  status           Show processing queue status');
                console.log('  process [id]     Process specific image by ID or all pending');
                console.log('  reset            Reset all failed images to pending');
                console.log('  worker           Start background worker daemon');
                console.log('');
                console.log('Examples:');
                console.log('  node scripts/process-images.js status');
                console.log('  node scripts/process-images.js process 123');
                console.log('  node scripts/process-images.js process');
                console.log('  node scripts/process-images.js reset');
                console.log('  node scripts/process-images.js worker');
                break;
        }

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();