<script>
    import { goto } from '$app/navigation';
    import Header from '$lib/components/Header.svelte';
    import PageContainer from '$lib/components/base/PageContainer.svelte';
    import EditionForm from '$lib/components/EditionForm.svelte';

    let { data } = $props();

    let edition = $state(data.edition);
    let isSubmitting = $state(false);
    let submitMessage = $state('');
    let submitError = $state('');

    // Prepare initial data for the form
    let initialData = $state({
        issueNumber: edition.issueNumber,
        publishedAt: edition.publishedAt ? edition.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0],
        coverImageId: edition.coverImageId,
        articleIds: edition.articles?.map(a => a.id) || [],
        poemIds: edition.poems?.map(p => p.id) || [],
        imageIds: edition.images?.map(img => ({ id: img.id, usageType: img.usageType || 'content' })) || []
    });

    async function handleSubmit(formData) {
        if (isSubmitting) return;

        isSubmitting = true;
        submitError = '';
        submitMessage = '';

        try {
            const response = await fetch(`/api/editions/${data.editionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                submitMessage = 'Edition updated successfully!';
                setTimeout(() => {
                    goto(`/editions/${data.editionId}`);
                }, 1500);
            } else {
                submitError = result.error || 'Failed to update edition';
            }
        } catch (error) {
            console.error('Error updating edition:', error);
            submitError = 'Network error. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<svelte:head>
    <title>Edit Issue {edition.issueNumber} - The Daily Pilgrim</title>
</svelte:head>

<Header
    breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/editions", label: "Editions" },
        { href: `/editions/${data.editionId}`, label: `Issue ${edition.issueNumber}` },
        { label: "Edit" }
    ]}
/>

<PageContainer>
    <div class="edit-header">
        <h1>Edit Issue {edition.issueNumber}</h1>
        <p>Update edition details and content</p>
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

    <EditionForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Update Edition"
        cancelHref="/editions/{data.editionId}"
        showCurrentContent={true}
        currentEdition={edition}
    />
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
        font-family: var(--font-body);
        font-weight: 500;
    }

    .alert.success {
        background-color: var(--color-off);
        color: var(--color-bg);
    }

    .alert.error {
        background-color: var(--color-warn);
        color: var(--color-bg);
    }
</style>