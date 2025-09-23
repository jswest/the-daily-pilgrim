<script>
    import { goto } from '$app/navigation';

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
        if (showOriginal || !image.is_processed || image.processing_status !== 'completed') {
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
                image.processing_status = 'pending';
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

<div class="page-container">
    <header class="page-header">
        <div class="header-content">
            <nav class="breadcrumb">
                <a href="/">Home</a>
                <span>→</span>
                <a href="/images">Images</a>
                <span>→</span>
                <span>{image ? image.filename : 'Loading...'}</span>
            </nav>
            
            {#if image}
                <div class="header-actions">
                    {#if image.processing_status === 'failed'}
                        <button onclick={() => retryProcessing(image.id)} class="btn btn-warning">Retry Processing</button>
                    {/if}
                    <a href="/images/{image.id}/edit" class="btn btn-secondary">Edit</a>
                    <button onclick={deleteImage} class="btn btn-danger">Delete</button>
                </div>
            {/if}
        </div>
    </header>

    <main>
        {#if error}
            <div class="alert alert-error">
                {error}
                <a href="/images" class="back-link">← Back to Images</a>
            </div>
        {:else if image}
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
                                {getImageTypeLabel(image.image_type)}
                            </div>
                            {#if image.is_processed && image.processing_status === 'completed'}
                                <div class="version-badge">
                                    {showOriginal ? 'Original' : '1-bit Dithered'}
                                </div>
                            {/if}
                        </div>
                        
                        {#if image.is_processed && image.processing_status === 'completed'}
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
                                    <span class="value">{getImageTypeLabel(image.image_type)}</span>
                                </div>
                                
                                {#if image.width && image.height}
                                    <div class="metadata-item">
                                        <span class="label">Dimensions:</span>
                                        <span class="value">{image.width}×{image.height}px</span>
                                    </div>
                                {/if}
                                
                                <div class="metadata-item">
                                    <span class="label">Processing Status:</span>
                                    <span class="value processing-status {getProcessingStatusClass(image.processing_status)}">
                                        {getProcessingStatusLabel(image.processing_status)}
                                    </span>
                                </div>
                                
                                {#if image.processing_attempts > 0}
                                    <div class="metadata-item">
                                        <span class="label">Processing Attempts:</span>
                                        <span class="value">{image.processing_attempts}</span>
                                    </div>
                                {/if}
                                
                                {#if image.processing_error}
                                    <div class="metadata-item">
                                        <span class="label">Processing Error:</span>
                                        <span class="value error-text">{image.processing_error}</span>
                                    </div>
                                {/if}
                                
                                <div class="metadata-item">
                                    <span class="label">File Path:</span>
                                    <span class="value">{image.original_path}</span>
                                </div>
                                
                                {#if image.processed_path}
                                    <div class="metadata-item">
                                        <span class="label">Processed Path:</span>
                                        <span class="value">{image.processed_path}</span>
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
                                    <span class="value">{new Date(image.created_at).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</span>
                                </div>
                                
                                {#if image.updated_at !== image.created_at}
                                    <div class="metadata-item">
                                        <span class="label">Updated:</span>
                                        <span class="value">{new Date(image.updated_at).toLocaleDateString('en-US', { 
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
    </main>
</div>

<style>
    .page-container {
        min-height: 100vh;
        background: #f9fafb;
    }

    .page-header {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 2rem;
        margin-bottom: 2rem;
    }

    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .breadcrumb a {
        color: #3b82f6;
        text-decoration: none;
    }

    .breadcrumb a:hover {
        text-decoration: underline;
    }

    .header-actions {
        display: flex;
        gap: 0.75rem;
    }

    .alert {
        max-width: 1200px;
        margin: 0 auto 2rem auto;
        padding: 1rem;
        border-radius: 0.375rem;
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
        text-align: center;
    }

    .back-link {
        display: inline-block;
        margin-top: 0.5rem;
        color: #3b82f6;
        text-decoration: none;
    }

    .back-link:hover {
        text-decoration: underline;
    }

    main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem 3rem 2rem;
    }

    .image-content {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 2rem;
    }

    .image-display {
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        overflow: hidden;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .image-container {
        position: relative;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f9fafb;
    }

    .main-image {
        max-width: 100%;
        max-height: 600px;
        object-fit: contain;
    }

    .image-overlay-badges {
        position: absolute;
        top: 1rem;
        right: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-end;
    }

    .image-type-badge,
    .version-badge {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .version-badge {
        background: rgba(16, 185, 129, 0.9);
    }

    .version-toggle {
        position: absolute;
        bottom: 1rem;
        right: 1rem;
    }

    .toggle-btn {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
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
        gap: 1.5rem;
    }

    .image-header {
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        padding: 1.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .image-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
        word-break: break-word;
    }

    .image-caption {
        margin: 0;
        color: #6b7280;
        font-style: italic;
        line-height: 1.5;
    }

    .image-metadata {
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        padding: 1.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .metadata-section {
        margin-bottom: 2rem;
    }

    .metadata-section:last-child {
        margin-bottom: 0;
    }

    .metadata-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
    }

    .metadata-grid {
        display: grid;
        gap: 0.75rem;
    }

    .metadata-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }

    .metadata-item .label {
        font-weight: 500;
        color: #6b7280;
        flex-shrink: 0;
    }

    .metadata-item .value {
        color: #111827;
        text-align: right;
        word-break: break-word;
    }

    .value.processed {
        color: #059669;
        font-weight: 500;
    }

    .value.unprocessed {
        color: #dc2626;
        font-weight: 500;
    }

    .authors-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .author-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .author-name {
        font-weight: 500;
        color: #111827;
    }

    .author-role {
        color: #6b7280;
        font-size: 0.875rem;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: background-color 0.2s;
        display: inline-block;
        text-align: center;
    }

    .btn-secondary {
        background: #f3f4f6;
        color: #374151;
    }

    .btn-secondary:hover {
        background: #e5e7eb;
    }

    .btn-danger {
        background: #dc2626;
        color: white;
    }

    .btn-danger:hover {
        background: #b91c1c;
    }

    .btn-warning {
        background: #f59e0b;
        color: white;
    }

    .btn-warning:hover {
        background: #d97706;
    }

    .processing-status {
        font-weight: 500;
    }

    .processing-status.status-pending {
        color: #f59e0b;
    }

    .processing-status.status-processing {
        color: #3b82f6;
    }

    .processing-status.status-completed {
        color: #10b981;
    }

    .processing-status.status-failed {
        color: #ef4444;
    }

    .error-text {
        color: #ef4444;
        font-family: monospace;
        font-size: 0.875rem;
        word-break: break-word;
    }

    @media (max-width: 768px) {
        .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .image-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .metadata-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
        }

        .metadata-item .value {
            text-align: left;
        }
    }
</style>