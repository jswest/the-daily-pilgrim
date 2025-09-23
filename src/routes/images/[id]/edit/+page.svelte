<script>
    import { goto } from '$app/navigation';
    import ImageForm from '$lib/components/ImageForm.svelte';

    let { data } = $props();
    
    let isSubmitting = $state(false);
    let submitMessage = $state('');
    let submitError = $state('');

    async function handleSubmit(imageData) {
        isSubmitting = true;
        submitError = '';
        submitMessage = '';

        try {
            const response = await fetch(`/api/images/${data.imageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(imageData)
            });

            const result = await response.json();

            if (response.ok) {
                submitMessage = 'Image updated successfully!';
                setTimeout(() => {
                    goto(`/images/${data.imageId}`);
                }, 1500);
            } else {
                submitError = result.error || 'Failed to update image';
            }
        } catch (error) {
            console.error('Error updating image:', error);
            submitError = 'Network error. Please try again.';
        } finally {
            isSubmitting = false;
        }
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

    function getProcessingStatusLabel(status) {
        const labels = {
            'pending': 'Pending',
            'processing': 'Processing',
            'completed': 'Processed',
            'failed': 'Failed'
        };
        return labels[status] || status;
    }
</script>

<svelte:head>
    <title>Edit Image: {data.image ? data.image.filename : 'Loading...'} - The Daily Pilgrim</title>
</svelte:head>

<div class="hero">
    <h1>Edit Image</h1>
    <p>Update image metadata and author attribution</p>
</div>

<div class="main-content">
    <nav class="breadcrumb">
        <a href="/">Home</a>
        <span>→</span>
        <a href="/images">Images</a>
        <span>→</span>
        <a href="/images/{data.imageId}">{data.image ? data.image.filename : 'Image'}</a>
        <span>→</span>
        <span>Edit</span>
    </nav>

    {#if submitMessage}
        <div class="alert success">
            {submitMessage}
        </div>
    {/if}

    {#if submitError}
        <div class="alert error">
            {submitError}
        </div>
    {/if}

    {#if data.image}
        <div class="image-preview-section">
            <h2>Image Preview</h2>
            <div class="image-preview">
                <img 
                    src={getImageUrl(data.image)} 
                    alt={data.image.caption || data.image.filename}
                    class="preview-img"
                />
                <div class="image-info">
                    <div class="info-item">
                        <span class="label">Filename:</span>
                        <span class="value">{data.image.filename}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Type:</span>
                        <span class="value">{getImageTypeLabel(data.image.image_type)}</span>
                    </div>
                    {#if data.image.width && data.image.height}
                        <div class="info-item">
                            <span class="label">Dimensions:</span>
                            <span class="value">{data.image.width}×{data.image.height}px</span>
                        </div>
                    {/if}
                    <div class="info-item">
                        <span class="label">Processing:</span>
                        <span class="value">{getProcessingStatusLabel(data.image.processing_status)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Uploaded:</span>
                        <span class="value">{new Date(data.image.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>

        <ImageForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            initialData={data.image}
            mode="edit"
        />
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
        max-width: 800px;
        padding: var(--unit);
    }

    .breadcrumb {
        display: flex;
        align-items: center;
        gap: calc(var(--unit) * 0.5);
        font-family: var(--font-body);
        color: var(--color-fg);
        margin-bottom: calc(var(--unit) * 2);
    }

    .breadcrumb a {
        color: var(--color-off);
        text-decoration: none;
    }

    .breadcrumb a:hover {
        text-decoration: underline;
    }

    .alert {
        padding: var(--unit);
        margin-bottom: calc(var(--unit) * 2);
        text-align: center;
        font-family: var(--font-body);
        font-weight: 600;
    }

    .alert.success {
        background-color: var(--color-off);
        color: var(--color-bg);
    }

    .alert.error {
        background-color: var(--color-warn);
        color: var(--color-bg);
    }

    .image-preview-section {
        margin-bottom: calc(var(--unit) * 3);
    }

    .image-preview-section h2 {
        font-family: var(--font-hed);
        font-weight: 900;
        font-size: calc(var(--unit) * 1.25);
        margin: 0 0 var(--unit) 0;
    }

    .image-preview {
        background-color: white;
        border: 1px solid var(--color-fg);
        padding: var(--unit);
        display: flex;
        gap: calc(var(--unit) * 1.5);
    }

    .preview-img {
        width: 200px;
        height: 150px;
        object-fit: cover;
        border: 1px solid var(--color-fg);
        flex-shrink: 0;
    }

    .image-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: calc(var(--unit) * 0.5);
    }

    .info-item {
        display: flex;
        gap: calc(var(--unit) * 0.5);
    }

    .info-item .label {
        font-family: var(--font-hed);
        font-weight: 600;
        min-width: 100px;
        flex-shrink: 0;
    }

    .info-item .value {
        font-family: var(--font-body);
    }

    @media (max-width: 768px) {
        .image-preview {
            flex-direction: column;
        }

        .preview-img {
            width: 100%;
            height: 200px;
        }

        .info-item {
            flex-direction: column;
            gap: calc(var(--unit) * 0.25);
        }

        .info-item .label {
            min-width: auto;
        }
    }
</style>