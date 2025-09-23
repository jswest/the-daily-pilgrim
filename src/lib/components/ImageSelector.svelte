<script>
    let { 
        selectedImageId = null,
        onImageSelect = () => {},
        imageType = 'title' // filter by image type
    } = $props();

    let images = $state([]);
    let isLoading = $state(false);
    let showSelector = $state(false);
    let selectedImage = $state(null);

    // Load selected image data if we have an ID
    $effect(async () => {
        if (selectedImageId && !selectedImage) {
            try {
                const response = await fetch(`/api/images/${selectedImageId}`);
                if (response.ok) {
                    const imageData = await response.json();
                    selectedImage = imageData;
                }
            } catch (error) {
                console.error('Error loading selected image:', error);
            }
        }
    });

    async function loadImages() {
        if (images.length > 0) return; // Already loaded
        
        isLoading = true;
        try {
            const response = await fetch('/api/images');
            const data = await response.json();
            // Filter by image type if specified
            images = imageType ? data.filter(img => img.image_type === imageType) : data;
        } catch (error) {
            console.error('Error loading images:', error);
        } finally {
            isLoading = false;
        }
    }

    function handleImageSelect(image) {
        selectedImage = image;
        selectedImageId = image.id;
        onImageSelect(image);
        showSelector = false;
    }

    function clearSelection() {
        selectedImage = null;
        selectedImageId = null;
        onImageSelect(null);
    }

    function openSelector() {
        showSelector = true;
        loadImages();
    }

    function getImageUrl(image) {
        if (image.is_processed && image.processing_status === 'completed') {
            return `/api/images/${image.id}/file`;
        }
        return `/api/images/${image.id}/file?original=true`;
    }

    function getImageTypeLabel(type) {
        const types = {
            'background': 'Background (9:16)',
            'title': 'Title (16:9)',
            'inline': 'Inline'
        };
        return types[type] || type;
    }
</script>

<div class="image-selector">
    <label class="selector-label">
        Title Image {imageType === 'title' ? '(16:9)' : ''}
        <span class="optional">(optional)</span>
    </label>
    
    {#if selectedImage}
        <div class="selected-image">
            <div class="image-preview">
                <img 
                    src={getImageUrl(selectedImage)} 
                    alt={selectedImage.caption || selectedImage.filename}
                    class="preview-img"
                />
                <div class="image-info">
                    <div class="image-filename">{selectedImage.filename}</div>
                    <div class="image-meta">
                        {getImageTypeLabel(selectedImage.image_type)}
                        {#if selectedImage.width && selectedImage.height}
                            • {selectedImage.width}×{selectedImage.height}px
                        {/if}
                    </div>
                </div>
            </div>
            <div class="image-actions">
                <button type="button" onclick={openSelector} class="btn btn-secondary">
                    Change Image
                </button>
                <button type="button" onclick={clearSelection} class="btn btn-outline">
                    Remove
                </button>
            </div>
        </div>
    {:else}
        <button type="button" onclick={openSelector} class="btn btn-outline select-btn">
            Select Image
        </button>
    {/if}

    {#if showSelector}
        <div class="selector-modal">
            <div class="modal-backdrop" onclick={() => showSelector = false}></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Select {imageType === 'title' ? 'Title' : ''} Image</h3>
                    <button type="button" onclick={() => showSelector = false} class="close-btn">×</button>
                </div>
                
                <div class="modal-body">
                    {#if isLoading}
                        <div class="loading">Loading images...</div>
                    {:else if images.length === 0}
                        <div class="empty-state">
                            <p>No {imageType} images found.</p>
                            <a href="/images/upload" class="btn btn-primary">Upload Images</a>
                        </div>
                    {:else}
                        <div class="images-grid">
                            {#each images as image}
                                <div class="image-option" onclick={() => handleImageSelect(image)}>
                                    <img 
                                        src={getImageUrl(image)} 
                                        alt={image.caption || image.filename}
                                        class="option-img"
                                    />
                                    <div class="option-info">
                                        <div class="option-filename">{image.filename}</div>
                                        <div class="option-meta">
                                            {#if image.width && image.height}
                                                {image.width}×{image.height}px
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(:root) {
        --color-bg: #ffffff;
        --color-fg: #000000;
        --color-off: #0066cc;
        --color-warn: #cc6600;
        --font-body: "Cormorant";
        --font-dek: "Merriweather";
        --font-hed: "Merriweather";
        --font-masthead: "Bodoni Moda";
        --unit: 16px;
    }

    .image-selector {
        margin-bottom: calc(var(--unit) * 1.5);
    }

    .selector-label {
        display: block;
        margin-bottom: calc(var(--unit) * 0.5);
        font-family: var(--font-hed);
        font-weight: 600;
        color: var(--color-fg);
    }

    .optional {
        font-weight: 400;
        opacity: 0.6;
        font-size: calc(var(--unit) * 0.875);
    }

    .selected-image {
        border: 1px solid var(--color-fg);
        padding: var(--unit);
    }

    .image-preview {
        display: flex;
        gap: var(--unit);
        margin-bottom: var(--unit);
    }

    .preview-img {
        width: 80px;
        height: 60px;
        object-fit: cover;
        border: 1px solid var(--color-fg);
    }

    .image-info {
        flex: 1;
    }

    .image-filename {
        font-family: var(--font-hed);
        font-weight: 600;
        margin-bottom: calc(var(--unit) * 0.25);
    }

    .image-meta {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.875);
        opacity: 0.6;
    }

    .image-actions {
        display: flex;
        gap: calc(var(--unit) * 0.5);
    }

    .select-btn {
        width: 100%;
        padding: calc(var(--unit) * 0.75);
        text-align: center;
    }

    .selector-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
        position: relative;
        background: var(--color-bg);
        border: 1px solid var(--color-fg);
        width: 90vw;
        max-width: 800px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        padding: var(--unit);
        border-bottom: 1px solid var(--color-fg);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h3 {
        margin: 0;
        font-family: var(--font-hed);
        font-weight: 900;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: calc(var(--unit) * 1.5);
        cursor: pointer;
        padding: 0;
        width: calc(var(--unit) * 2);
        height: calc(var(--unit) * 2);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-body {
        padding: var(--unit);
        overflow-y: auto;
        flex: 1;
    }

    .loading {
        text-align: center;
        padding: calc(var(--unit) * 2);
        font-family: var(--font-body);
    }

    .empty-state {
        text-align: center;
        padding: calc(var(--unit) * 3);
        font-family: var(--font-body);
    }

    .empty-state p {
        margin-bottom: var(--unit);
    }

    .images-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--unit);
    }

    .image-option {
        border: 1px solid var(--color-fg);
        padding: calc(var(--unit) * 0.5);
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .image-option:hover {
        background-color: #f9f9f9;
    }

    .option-img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        margin-bottom: calc(var(--unit) * 0.5);
    }

    .option-filename {
        font-family: var(--font-hed);
        font-weight: 600;
        font-size: calc(var(--unit) * 0.875);
        margin-bottom: calc(var(--unit) * 0.25);
        word-break: break-word;
    }

    .option-meta {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.75);
        opacity: 0.6;
    }

    .btn-outline {
        background: transparent;
        border: 1px solid var(--color-fg);
        color: var(--color-fg);
    }

    .btn-outline:hover {
        background: var(--color-fg);
        color: var(--color-bg);
    }
</style>