<script>
    import { goto } from '$app/navigation';
    import Header from '$lib/components/Header.svelte';
    import Button from '$lib/components/base/Button.svelte';
    import PageContainer from '$lib/components/base/PageContainer.svelte';

    let { data } = $props();

    let image = $state(data.image);
    let error = $state(data.error || '');
    let imageId = $state(data.imageId);
    let showOriginal = $state(false);

    function getImageTypeLabel(type) {
        const types = {
            'background': 'Background (9:16)',
            'title': 'Title (16:9)',
            'inline': 'Inline'
        };
        return types[type] || type;
    }

    function getImageUrl(image) {
        // Force original if toggle is on, or if not processed yet
        if (showOriginal || !image.isProcessed || image.processingStatus !== 'completed') {
            return `/api/images/${image.id}/file?original=true`;
        }
        return `/api/images/${image.id}/file`; // Serve processed version
    }

    function getImagePlaceholder(image) {
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
                <rect width="600" height="400" fill="#f3f4f6"/>
                <text x="300" y="200" text-anchor="middle" dy=".3em" font-family="Arial" font-size="24" fill="#6b7280">
                    ${image.filename}
                </text>
                <text x="300" y="230" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14" fill="#9ca3af">
                    Image preview not available
                </text>
            </svg>
        `)}`;
    }

    function getProcessingStatusLabel(status) {
        const labels = {
            'pending': 'Pending',
            'processing': 'Processing',
            'completed': 'Processed',
            'failed': 'Failed'
        };
        return labels[status] || status;
    }

    function getProcessingStatusClass(status) {
        const classes = {
            'pending': 'status-pending',
            'processing': 'status-processing',
            'completed': 'status-completed',
            'failed': 'status-failed'
        };
        return classes[status] || 'status-unknown';
    }

    function handleImageError(event, image) {
        // Fallback to placeholder if image fails to load
        event.target.src = getImagePlaceholder(image);
    }

    async function deleteImage() {
        if (!confirm('Are you sure you want to delete this image?')) {
            return;
        }

        try {
            const response = await fetch(`/api/images/${imageId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                goto('/images');
            } else {
                error = 'Failed to delete image';
            }
        } catch (err) {
            console.error('Error deleting image:', err);
            error = 'Network error. Please try again.';
        }
    }

    async function retryProcessing(imageId) {
        try {
            const response = await fetch('/api/processing/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'process_image',
                    imageId: imageId
                })
            });

            const result = await response.json();

            if (response.ok) {
                // Update image processing status
                image.processingStatus = 'pending';
                error = '';
            } else {
                error = result.error || 'Failed to retry processing';
            }
        } catch (err) {
            console.error('Error retrying processing:', err);
            error = 'Network error. Please try again.';
        }
    }
</script>

<svelte:head>
    <title>{image ? image.filename : 'Image'} - The Daily Pilgrim</title>
</svelte:head>

<Header
    breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/images", label: "Images" },
        { label: image ? image.filename : "Loading..." }
    ]}
/>

<PageContainer>
    {#if error}
        <div class="alert">
            {error}
            <Button variant="secondary" href="/images">← Back to Images</Button>
        </div>
    {:else if image}
        <div class="image-header">
            <div class="header-actions">
                {#if image.processingStatus === 'failed'}
                    <button onclick={() => retryProcessing(image.id)} class="btn btn-warning">Retry Processing</button>
                {/if}
                <Button variant="secondary" href="/images/{image.id}/edit">Edit</Button>
                <button onclick={deleteImage} class="btn btn-danger">Delete</button>
            </div>
        </div>
            <div class="image-content">
                <div class="image-display">
                    <div class="image-container">
                        <img 
                            src={getImageUrl(image)} 
                            alt={image.caption || image.filename}
                            class="main-image"
                            onerror={(e) => handleImageError(e, image)}
                        />
                        <div class="image-overlay-badges">
                            <div class="image-type-badge">
                                {getImageTypeLabel(image.imageType)}
                            </div>
                            {#if image.isProcessed && image.processingStatus === 'completed'}
                                <div class="version-badge">
                                    {showOriginal ? 'Original' : '1-bit Dithered'}
                                </div>
                            {/if}
                        </div>

                        {#if image.isProcessed && image.processingStatus === 'completed'}
                            <div class="version-toggle">
                                <button 
                                    onclick={() => showOriginal = !showOriginal}
                                    class="toggle-btn"
                                >
                                    {showOriginal ? 'Show Processed' : 'Show Original'}
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="image-details">
                    <div class="image-header">
                        <h1 class="image-title">{image.filename}</h1>
                        
                        {#if image.caption}
                            <p class="image-caption">{image.caption}</p>
                        {/if}
                    </div>

                    <div class="image-metadata">
                        <div class="metadata-section">
                            <h3>Image Information</h3>
                            <div class="metadata-grid">
                                <div class="metadata-item">
                                    <span class="label">Type:</span>
                                    <span class="value">{getImageTypeLabel(image.imageType)}</span>
                                </div>
                                
                                {#if image.width && image.height}
                                    <div class="metadata-item">
                                        <span class="label">Dimensions:</span>
                                        <span class="value">{image.width}×{image.height}px</span>
                                    </div>
                                {/if}
                                
                                <div class="metadata-item">
                                    <span class="label">Processing Status:</span>
                                    <span class="value processing-status {getProcessingStatusClass(image.processingStatus)}">
                                        {getProcessingStatusLabel(image.processingStatus)}
                                    </span>
                                </div>
                                
                                {#if image.processingAttempts > 0}
                                    <div class="metadata-item">
                                        <span class="label">Processing Attempts:</span>
                                        <span class="value">{image.processingAttempts}</span>
                                    </div>
                                {/if}

                                {#if image.processingError}
                                    <div class="metadata-item">
                                        <span class="label">Processing Error:</span>
                                        <span class="value error-text">{image.processingError}</span>
                                    </div>
                                {/if}

                                <div class="metadata-item">
                                    <span class="label">File Path:</span>
                                    <span class="value">{image.originalPath}</span>
                                </div>

                                {#if image.processedPath}
                                    <div class="metadata-item">
                                        <span class="label">Processed Path:</span>
                                        <span class="value">{image.processedPath}</span>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        {#if image.authors && image.authors.length > 0}
                            <div class="metadata-section">
                                <h3>Attribution</h3>
                                <div class="authors-list">
                                    {#each image.authors as author}
                                        <div class="author-item">
                                            <span class="author-name">{author.name}</span>
                                            <span class="author-role">({author.role})</span>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        <div class="metadata-section">
                            <h3>Timestamps</h3>
                            <div class="metadata-grid">
                                <div class="metadata-item">
                                    <span class="label">Uploaded:</span>
                                    <span class="value">{new Date(image.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</span>
                                </div>

                                {#if image.updatedAt !== image.createdAt}
                                    <div class="metadata-item">
                                        <span class="label">Updated:</span>
                                        <span class="value">{new Date(image.updatedAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    {/if}
</PageContainer>

<style>
    .image-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: calc(var(--unit) * 2);
    }

    .header-actions {
        display: flex;
        gap: var(--unit);
    }

    .image-content {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: calc(var(--unit) * 2);
    }

    .image-display {
        background-color: var(--color-bg);
        border: 1px solid #dee2e6;
        overflow: hidden;
    }

    .image-container {
        position: relative;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f8f9fa;
    }

    .main-image {
        max-width: 100%;
        max-height: 600px;
        object-fit: contain;
    }

    .image-overlay-badges {
        position: absolute;
        top: var(--unit);
        right: var(--unit);
        display: flex;
        flex-direction: column;
        gap: calc(var(--unit) * 0.5);
        align-items: flex-end;
    }

    .image-type-badge,
    .version-badge {
        background: rgba(0, 0, 0, 0.8);
        color: var(--color-bg);
        padding: calc(var(--unit) * 0.5) var(--unit);
        font-size: calc(var(--unit) * 0.875);
        font-weight: 500;
    }

    .version-badge {
        background: rgba(16, 185, 129, 0.9);
    }

    .version-toggle {
        position: absolute;
        bottom: var(--unit);
        right: var(--unit);
    }

    .toggle-btn {
        background: rgba(0, 0, 0, 0.8);
        color: var(--color-bg);
        border: none;
        padding: calc(var(--unit) * 0.75) calc(var(--unit) * 1.5);
        font-size: calc(var(--unit) * 0.875);
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .toggle-btn:hover {
        background: rgba(0, 0, 0, 0.9);
    }

    .image-details {
        display: flex;
        flex-direction: column;
        gap: calc(var(--unit) * 1.5);
    }

    .image-header {
        background-color: var(--color-bg);
        border: 1px solid #dee2e6;
        padding: calc(var(--unit) * 1.5);
    }

    .image-title {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.5);
        font-weight: 600;
        color: var(--color-fg);
        margin: 0 0 calc(var(--unit) * 0.5) 0;
        word-break: break-word;
    }

    .image-caption {
        font-family: var(--font-body);
        color: #666;
        font-style: italic;
        line-height: 1.5;
        margin: 0;
    }

    .image-metadata {
        background-color: var(--color-bg);
        border: 1px solid #dee2e6;
        padding: calc(var(--unit) * 1.5);
    }

    .metadata-section {
        margin-bottom: calc(var(--unit) * 2);
    }

    .metadata-section:last-child {
        margin-bottom: 0;
    }

    .metadata-section h3 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.125);
        font-weight: 600;
        color: var(--color-fg);
        margin: 0 0 var(--unit) 0;
    }

    .metadata-grid {
        display: grid;
        gap: calc(var(--unit) * 0.75);
    }

    .metadata-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--unit);
    }

    .metadata-item .label {
        font-family: var(--font-body);
        font-weight: 500;
        color: #666;
        flex-shrink: 0;
    }

    .metadata-item .value {
        font-family: var(--font-body);
        color: var(--color-fg);
        text-align: right;
        word-break: break-word;
    }

    .btn-warning {
        background-color: var(--color-warn);
        color: var(--color-bg);
        border: none;
        padding: calc(var(--unit) * 0.5) var(--unit);
        font-family: var(--font-hed);
        font-size: var(--unit);
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s;
    }

    .btn-warning:hover {
        opacity: 1;
    }

    .btn-danger {
        background-color: #dc2626;
        color: var(--color-bg);
        border: none;
        padding: calc(var(--unit) * 0.5) var(--unit);
        font-family: var(--font-hed);
        font-size: var(--unit);
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s;
    }

    .btn-danger:hover {
        opacity: 1;
    }

    .processing-status.status-pending {
        color: var(--color-warn);
    }

    .processing-status.status-completed {
        color: #059669;
    }

    .processing-status.status-failed {
        color: #dc2626;
    }

    @media (max-width: 768px) {
        .image-content {
            grid-template-columns: 1fr;
            gap: calc(var(--unit) * 1.5);
        }

        .metadata-item {
            flex-direction: column;
            align-items: flex-start;
            gap: calc(var(--unit) * 0.25);
        }

        .metadata-item .value {
            text-align: left;
        }
    }
</style>