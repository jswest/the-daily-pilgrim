import sharp from 'sharp';

/**
 * Floyd-Steinberg dithering algorithm for 1-bit conversion
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {Object} options - Processing options
 * @returns {Buffer} - Processed 1-bit dithered image buffer
 */
export async function floydSteinbergDither(imageBuffer, options = {}) {
    const { 
        format = 'png',
        maxWidth = 1200,
        maxHeight = 1200 
    } = options;

    try {
        // Load image with Sharp and get metadata
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();
        
        // Resize if too large, maintaining aspect ratio
        let resized = image.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
        });

        // Convert to grayscale and get raw pixel data
        const { data, info } = await resized
            .greyscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const { width, height, channels } = info;
        
        // Create copy for dithering (Floyd-Steinberg modifies in-place)
        const pixels = new Uint8Array(data);
        
        // Floyd-Steinberg dithering
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * channels;
                const oldPixel = pixels[index];
                
                // Threshold: convert to pure black (0) or white (255)
                const newPixel = oldPixel < 128 ? 0 : 255;
                pixels[index] = newPixel;
                
                // Calculate error
                const error = oldPixel - newPixel;
                
                // Distribute error to neighboring pixels
                // Floyd-Steinberg error distribution:
                //     X   7/16
                // 3/16 5/16 1/16
                
                if (x + 1 < width) {
                    // Right pixel: 7/16 of error
                    const rightIndex = (y * width + (x + 1)) * channels;
                    pixels[rightIndex] = Math.max(0, Math.min(255, 
                        pixels[rightIndex] + error * 7 / 16
                    ));
                }
                
                if (y + 1 < height) {
                    if (x > 0) {
                        // Bottom-left pixel: 3/16 of error
                        const bottomLeftIndex = ((y + 1) * width + (x - 1)) * channels;
                        pixels[bottomLeftIndex] = Math.max(0, Math.min(255, 
                            pixels[bottomLeftIndex] + error * 3 / 16
                        ));
                    }
                    
                    // Bottom pixel: 5/16 of error
                    const bottomIndex = ((y + 1) * width + x) * channels;
                    pixels[bottomIndex] = Math.max(0, Math.min(255, 
                        pixels[bottomIndex] + error * 5 / 16
                    ));
                    
                    if (x + 1 < width) {
                        // Bottom-right pixel: 1/16 of error
                        const bottomRightIndex = ((y + 1) * width + (x + 1)) * channels;
                        pixels[bottomRightIndex] = Math.max(0, Math.min(255, 
                            pixels[bottomRightIndex] + error * 1 / 16
                        ));
                    }
                }
            }
        }
        
        // Create final image from dithered pixels
        const outputBuffer = await sharp(pixels, {
            raw: {
                width,
                height,
                channels
            }
        })
        .png({
            palette: true,
            colors: 2, // Only black and white
            effort: 10 // Maximum compression effort
        })
        .toBuffer();
        
        return outputBuffer;
        
    } catch (error) {
        console.error('Error in Floyd-Steinberg dithering:', error);
        throw new Error(`Dithering failed: ${error.message}`);
    }
}

/**
 * Get image dimensions from buffer
 * @param {Buffer} imageBuffer - Input image buffer
 * @returns {Object} - {width, height}
 */
export async function getImageDimensions(imageBuffer) {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        return {
            width: metadata.width,
            height: metadata.height
        };
    } catch (error) {
        console.error('Error getting image dimensions:', error);
        throw new Error(`Failed to get dimensions: ${error.message}`);
    }
}

/**
 * Validate if image buffer is processable
 * @param {Buffer} imageBuffer - Input image buffer
 * @returns {boolean} - Whether image can be processed
 */
export async function validateImage(imageBuffer) {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        
        // Check if it's a supported format
        const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'tiff'];
        if (!supportedFormats.includes(metadata.format)) {
            return false;
        }
        
        // Check reasonable dimensions
        if (!metadata.width || !metadata.height || 
            metadata.width > 10000 || metadata.height > 10000) {
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error validating image:', error);
        return false;
    }
}