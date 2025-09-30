<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Header from '$lib/components/Header.svelte';
    import PageContainer from '$lib/components/base/PageContainer.svelte';
    import EditionForm from '$lib/components/EditionForm.svelte';

    let loading = $state(true);
    let saving = $state(false);
    let initialData = $state({
        issueNumber: 1,
        publishedAt: new Date().toISOString().split('T')[0],
        coverImageId: null,
        articleIds: [],
        poemIds: [],
        imageIds: []
    });

    onMount(async () => {
        try {
            // Get next issue number
            const issueResponse = await fetch('/api/editions/next-issue');
            const issueData = await issueResponse.json();
            if (issueResponse.ok) {
                initialData.issueNumber = issueData.nextIssueNumber;
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            loading = false;
        }
    });

    async function handleSubmit(formData) {
        if (saving) return;

        saving = true;

        try {
            const response = await fetch('/api/editions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                goto(`/editions/${result.id}`);
            } else {
                throw new Error(result.error || 'Failed to create edition');
            }
        } catch (err) {
            console.error('Error creating edition:', err);
            alert(err.message);
        } finally {
            saving = false;
        }
    }
</script>

<svelte:head>
    <title>Create Edition - The Daily Pilgrim</title>
</svelte:head>

<Header
    breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/editions", label: "Editions" },
        { label: "Create New Edition" }
    ]}
/>

<PageContainer>
    <div class="edition-header">
        <h1>Create New Edition</h1>
        <p>Select content and create a new magazine edition</p>
    </div>

    {#if !loading}
        <EditionForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={saving}
            submitButtonText="Create Edition"
            cancelHref="/editions"
        />
    {/if}
</PageContainer>

<style>
    .edition-header {
        text-align: center;
        margin-bottom: calc(var(--unit) * 3);
        padding: calc(var(--unit) * 2);
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
    }

    .edition-header h1 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 2);
        font-weight: 900;
        margin: 0 0 calc(var(--unit) * 0.5) 0;
        color: var(--color-fg);
    }

    .edition-header p {
        font-family: var(--font-body);
        margin: 0;
        color: #666;
    }
</style>