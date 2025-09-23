<script>
    import { onMount } from 'svelte';

    let images = $state([]);
    let isLoading = $state(false);
    let message = $state('');

    onMount(async () => {
        await loadImages();
    });

    async function loadImages() {
        isLoading = true;
        try {
            const response = await fetch('/api/images');
            const data = await response.json();
            images = data;
        } catch (error) {
            console.error('Error loading images:', error);
            message = 'Failed to load images';
        } finally {
            isLoading = false;
        }
    }

    function getImageTypeLabel(type) {
        const types = {
            'background': 'Background (9:16)',
            'title': 'Title (16:9)',
            'inline': 'Inline'
        };
        return types[type] || type;
    }

    function getImageUrl(image) {
        // Show processed version if available and processing is completed
        if (image.is_processed && image.processing_status === 'completed') {
            return `/api/images/${image.id}/file`; // This will automatically serve processed version
        }
        return `/api/images/${image.id}/file?original=true`; // Force original for unprocessed images
    }

    function getImagePlaceholder(image) {
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="150" fill="#f3f4f6"/>
                <text x="100" y="75" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="#6b7280">
                    ${image.filename}
                </text>
            </svg>
        `)}`;
    }

    function handleImageError(event, image) {
        // Fallback to placeholder if image fails to load
        event.target.src = getImagePlaceholder(image);
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
</script>

<svelte:head>
    <title>Images - The Daily Pilgrim</title>
</svelte:head>

<div class="hero">
    <h1>Images</h1>
    <p>Upload and manage images with captions and author attribution</p>
</div>

<div class="main-content">
    <div class="header-actions">
        <nav class="breadcrumb">
            <a href="/">Home</a>
            <span>→</span>
            <span>Images</span>
        </nav>
        <a href="/images/upload" class="btn btn-primary">Upload Image</a>
    </div>

    {#if message}
        <div class="alert">
            {message}
        </div>
    {/if}

    {#if isLoading}
        <div class="loading">Loading images...</div>
    {:else if images.length === 0}
        <div class="empty-state">
            <p>No images found.</p>
            <a href="/images/upload" class="btn btn-primary">Upload the first image</a>
        </div>
    {:else}
        <div class="card-grid">
            {#each images as image}
                <div class="card image-card">
                    <div class="image-preview">
                        <img 
                            src={getImageUrl(image)} 
                            alt={image.caption || image.filename}
                            class="preview-image"
                            onerror={(e) => handleImageError(e, image)}
                        />
                        <div class="image-overlay">
                            <div class="type-badge">
                                {getImageTypeLabel(image.image_type)}
                            </div>
                            <div class="status-badge {getProcessingStatusClass(image.processing_status)}">
                                {getProcessingStatusLabel(image.processing_status)}
                            </div>
                        </div>
                    </div>
                    
                    <h2>{image.filename}</h2>
                    
                    {#if image.caption}
                        <p class="caption">{image.caption}</p>
                    {/if}
                    
                    {#if image.authors}
                        <div class="authors">
                            <span class="label">By:</span>
                            <span>{image.authors}</span>
                        </div>
                    {/if}
                    
                    <div class="meta">
                        <span>Type: {getImageTypeLabel(image.image_type)}</span>
                        {#if image.width && image.height}
                            <span>{image.width}×{image.height}px</span>
                        {/if}
                        <span class="status {getProcessingStatusClass(image.processing_status)}">
                            {getProcessingStatusLabel(image.processing_status)}
                        </span>
                        <span>Uploaded {new Date(image.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div class="card-actions">
                        <a href="/images/{image.id}" class="btn btn-primary">View</a>
                        <a href="/images/{image.id}/edit" class="btn btn-secondary">Edit</a>
                    </div>
                </div>
            {/each}
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

    .hero {
        background-color: var(--color-fg);
        color: var(--color-bg);
        text-align: center;
        margin-bottom: calc(var(--unit) * 3);
        padding: var(--unit);
    }
    
    .hero h1 {
        font-family: var(--font-masthead);
        font-size: calc(var(--unit) * 2);
        font-weight: 600;
        line-height: 1;
        margin: 0 0 var(--unit) 0;
        text-transform: uppercase;
        transform-origin: 50% 50%;
        transform: scaleY(75%);
    }
    
    .hero p {
        font-family: var(--font-hed);
        font-size: var(--unit);
        font-weight: 900;
        margin: 0;
    }

    .main-content {
        margin: 0 auto;
        max-width: 1200px;
        padding: var(--unit);
    }

    .header-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: calc(var(--unit) * 2);
    }

    .breadcrumb {
        display: flex;
        align-items: center;
        gap: calc(var(--unit) * 0.5);
        font-family: var(--font-body);
        color: var(--color-fg);
    }

    .breadcrumb a {
        color: var(--color-off);
        text-decoration: none;
    }

    .breadcrumb a:hover {
        text-decoration: underline;
    }

    .alert {
        background-color: var(--color-warn);
        color: var(--color-bg);
        padding: var(--unit);
        margin-bottom: calc(var(--unit) * 2);
        text-align: center;
    }

    .loading {
        text-align: center;
        padding: calc(var(--unit) * 2);
        font-family: var(--font-body);
        color: var(--color-fg);
    }

    .empty-state {
        text-align: center;
        padding: calc(var(--unit) * 3);
        font-family: var(--font-body);
        color: var(--color-fg);
    }

    .empty-state p {
        margin-bottom: var(--unit);
        font-size: calc(var(--unit) * 1.125);
    }

    .card-grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .card {
        background-color: white;
        border: 1px solid var(--color-fg);
        padding: var(--unit);
    }

    .image-card {
        padding: 0;
        overflow: hidden;
    }

    .image-preview {
        position: relative;
        height: 200px;
        overflow: hidden;
    }

    .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom, rgba(0,0,0,0.1), transparent);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: calc(var(--unit) * 0.5);
    }

    .type-badge,
    .status-badge {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: calc(var(--unit) * 0.25) calc(var(--unit) * 0.5);
        font-size: calc(var(--unit) * 0.75);
        font-family: var(--font-body);
        font-weight: 600;
    }

    .status-badge.status-pending {
        background: var(--color-warn);
    }

    .status-badge.status-processing {
        background: var(--color-off);
        animation: pulse 2s infinite;
    }

    .status-badge.status-completed {
        background: #10b981;
    }

    .status-badge.status-failed {
        background: var(--color-warn);
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    .image-card h2 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1);
        font-weight: 900;
        line-height: 1;
        margin: var(--unit) var(--unit) calc(var(--unit) * 0.5) var(--unit);
        word-break: break-word;
    }

    .caption {
        font-family: var(--font-dek);
        font-style: italic;
        line-height: 1.4;
        margin: 0 var(--unit) var(--unit) var(--unit);
        opacity: 0.8;
    }

    .authors {
        font-family: var(--font-body);
        margin: 0 var(--unit) calc(var(--unit) * 0.5) var(--unit);
    }

    .authors .label {
        font-weight: 600;
        margin-right: calc(var(--unit) * 0.5);
    }

    .meta {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.875);
        margin: 0 var(--unit) calc(var(--unit) * 1.5) var(--unit);
        display: flex;
        flex-direction: column;
        gap: calc(var(--unit) * 0.25);
        opacity: 0.6;
    }

    .meta .status.status-pending {
        color: var(--color-warn);
        opacity: 1;
        font-weight: 600;
    }

    .meta .status.status-processing {
        color: var(--color-off);
        opacity: 1;
        font-weight: 600;
    }

    .meta .status.status-completed {
        color: #10b981;
        opacity: 1;
        font-weight: 600;
    }

    .meta .status.status-failed {
        color: var(--color-warn);
        opacity: 1;
        font-weight: 600;
    }

    .card-actions {
        display: flex;
        gap: var(--unit);
        flex-wrap: wrap;
        margin: 0 var(--unit) var(--unit) var(--unit);
    }

    .btn {
        border: none;
        border-radius: 0;
        box-sizing: border-box;
        cursor: pointer;
        display: inline-block;
        font-family: var(--font-hed);
        font-size: var(--unit);
        font-weight: 400;
        line-height: 1;
        opacity: 0.5;
        padding: calc(var(--unit) * 0.5);
        text-decoration: none;
        transition: opacity 0.2s;
        text-align: center;
    }
    
    .btn:hover {
        opacity: 1;
    }

    .btn-primary {
        background-color: var(--color-off);
        color: var(--color-bg);
    }

    .btn-secondary {
        background: var(--color-bg);
        border: 1px solid var(--color-fg);
        color: var(--color-fg);
    }
</style>