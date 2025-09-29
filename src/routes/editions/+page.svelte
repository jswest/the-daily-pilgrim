<script>
    import { onMount } from 'svelte';
    import Header from '$lib/components/Header.svelte';

    let editions = [];
    let loading = true;
    let error = '';

    onMount(async () => {
        try {
            const response = await fetch('/api/editions');
            const data = await response.json();

            if (response.ok) {
                editions = data;
            } else {
                error = data.error || 'Failed to load editions';
            }
        } catch (err) {
            error = err.message;
            console.error('Error loading editions:', err);
        } finally {
            loading = false;
        }
    });

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
</script>

<svelte:head>
    <title>Editions - The Daily Pilgrim</title>
</svelte:head>

<Header
    breadcrumbs={[
        { href: "/", label: "Home" },
        { label: "Editions" }
    ]}
/>

<div class="main-content">
    <div class="page-actions">
        <a href="/editions/create" class="btn btn-primary">Create New Edition</a>
    </div>

    {#if loading}
        <div class="loading">Loading editions...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else if editions.length === 0}
        <div class="empty-state">
            <h2>No editions yet</h2>
            <p>Create your first magazine edition to get started.</p>
            <a href="/editions/create" class="btn btn-primary">Create First Edition</a>
        </div>
    {:else}
        <div class="editions-grid">
            {#each editions as edition}
                <div class="edition-card">
                    <div class="edition-header">
                        <h2>Issue {edition.issueNumber}</h2>
                        <div class="edition-date">{formatDate(edition.publishedAt)}</div>
                    </div>

                    {#if edition.coverImage}
                        <div class="edition-cover">
                            <img src="/api/images/{edition.coverImage.id}/file" alt="Issue {edition.issueNumber} cover" />
                        </div>
                    {/if}

                    <div class="edition-actions">
                        <a href="/editions/{edition.id}" class="btn btn-secondary">View</a>
                        <a href="/editions/{edition.id}/edit" class="btn btn-secondary">Edit</a>
                        <a href="/editions/{edition.id}/generate" class="btn btn-primary">Generate PDF</a>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .main-content {
        margin: 0 auto;
        max-width: 1200px;
        padding: var(--unit);
    }

    .page-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-bottom: calc(var(--unit) * 2);
    }

    .loading, .error {
        text-align: center;
        padding: calc(var(--unit) * 3);
        font-family: var(--font-body);
    }

    .error {
        color: var(--color-warn);
    }

    .empty-state {
        text-align: center;
        padding: calc(var(--unit) * 4);
    }

    .empty-state h2 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.25);
        font-weight: 700;
        margin-bottom: var(--unit);
    }

    .empty-state p {
        font-family: var(--font-body);
        margin-bottom: calc(var(--unit) * 2);
        color: #666;
    }

    .editions-grid {
        display: grid;
        gap: calc(var(--unit) * 2);
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--unit);
    }

    .edition-card {
        background-color: white;
        border: 1px solid var(--color-fg);
        padding: var(--unit);
        display: flex;
        flex-direction: column;
    }

    .edition-header {
        margin-bottom: calc(var(--unit) * 1.5);
    }

    .edition-header h2 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.25);
        font-weight: 900;
        margin: 0 0 calc(var(--unit) * 0.5) 0;
    }

    .edition-date {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.9);
        color: #666;
    }

    .edition-cover {
        margin-bottom: calc(var(--unit) * 1.5);
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .edition-cover img {
        max-width: 100%;
        max-height: 200px;
        object-fit: cover;
        border: 1px solid #ddd;
    }

    .edition-actions {
        display: flex;
        gap: calc(var(--unit) * 0.75);
        flex-wrap: wrap;
        margin-top: auto;
    }

    .btn {
        display: inline-block;
        padding: calc(var(--unit) * 0.75);
        text-decoration: none;
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.9);
        font-weight: 600;
        text-align: center;
        transition: opacity 0.2s ease;
        border: 1px solid var(--color-fg);
        cursor: pointer;
        flex: 1;
        min-width: 80px;
    }

    .btn:hover {
        opacity: 0.8;
    }

    .btn-primary {
        background-color: var(--color-off);
        color: var(--color-bg);
        border-color: var(--color-off);
    }

    .btn-secondary {
        background-color: var(--color-bg);
        color: var(--color-fg);
        border-color: var(--color-fg);
    }
</style>