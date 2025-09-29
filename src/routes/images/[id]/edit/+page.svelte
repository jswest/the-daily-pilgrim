<script>
    import { goto } from '$app/navigation';
    import Header from '$lib/components/Header.svelte';
    import PageContainer from '$lib/components/base/PageContainer.svelte';
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

<Header
    breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/images", label: "Images" },
        { href: `/images/${data.imageId}`, label: data.image ? data.image.filename : "Image" },
        { label: "Edit" }
    ]}
/>

<PageContainer>
    <div class="edit-header">
        <h1>Edit Image</h1>
        <p>Update image metadata and author attribution</p>
    </div>

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
</PageContainer>

<style>
    .edit-header {
        text-align: center;
        margin-bottom: calc(var(--unit) * 3);
        padding: calc(var(--unit) * 2);
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
    }

    .edit-header h1 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 2);
        font-weight: 900;
        margin: 0 0 calc(var(--unit) * 0.5) 0;
        color: var(--color-fg);
    }

    .edit-header p {
        font-family: var(--font-body);
        margin: 0;
        color: #666;
    }

    .alert {
        padding: var(--unit);
        margin-bottom: calc(var(--unit) * 2);
        text-align: center;
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
        font-weight: 700;
        font-size: calc(var(--unit) * 1.25);
        margin: 0 0 var(--unit) 0;
        color: var(--color-fg);
    }

    .image-preview {
        background-color: var(--color-bg);
        border: 1px solid #dee2e6;
        padding: var(--unit);
        display: flex;
        gap: calc(var(--unit) * 1.5);
    }

    .preview-img {
        width: 200px;
        height: 150px;
        object-fit: cover;
        border: 1px solid #dee2e6;
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
        color: var(--color-fg);
    }

    .info-item .value {
        font-family: var(--font-body);
        color: var(--color-fg);
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