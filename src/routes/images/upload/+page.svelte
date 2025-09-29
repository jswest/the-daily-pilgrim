<script>
    import { goto } from '$app/navigation';
    import Header from '$lib/components/Header.svelte';
    import PageContainer from '$lib/components/base/PageContainer.svelte';
    import ImageUploadForm from '$lib/components/ImageUploadForm.svelte';

    let isSubmitting = $state(false);
    let submitMessage = $state('');
    let submitError = $state('');

    async function handleSubmit(formData) {
        isSubmitting = true;
        submitError = '';
        submitMessage = '';

        try {
            const response = await fetch('/api/images', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                submitMessage = 'Image uploaded successfully!';
                setTimeout(() => {
                    goto('/images');
                }, 1500);
            } else {
                submitError = result.error || 'Failed to upload image';
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            submitError = 'Network error. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<svelte:head>
    <title>Upload Image - The Daily Pilgrim</title>
</svelte:head>

<Header
    breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/images", label: "Images" },
        { label: "Upload" }
    ]}
/>

<PageContainer>
    <div class="upload-header">
        <h1>Upload Image</h1>
        <p>Add a new image to the collection</p>
    </div>

    {#if submitMessage}
        <div class="alert alert-success">
            {submitMessage}
        </div>
    {/if}

    {#if submitError}
        <div class="alert alert-error">
            {submitError}
        </div>
    {/if}

    <ImageUploadForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
    />
</PageContainer>

<style>
    .upload-header {
        text-align: center;
        margin-bottom: calc(var(--unit) * 3);
        padding: calc(var(--unit) * 2);
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
    }

    .upload-header h1 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 2);
        font-weight: 900;
        margin: 0 0 calc(var(--unit) * 0.5) 0;
        color: var(--color-fg);
    }

    .upload-header p {
        font-family: var(--font-body);
        margin: 0;
        color: #666;
    }

    .alert {
        max-width: 600px;
        margin: 0 auto calc(var(--unit) * 2) auto;
        padding: var(--unit);
    }

    .alert-success {
        background-color: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
    }

    .alert-error {
        background-color: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
    }
</style>