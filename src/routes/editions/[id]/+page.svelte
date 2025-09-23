<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    let edition = null;
    let loading = true;
    let error = '';
    let generating = false;

    onMount(async () => {
        try {
            const id = parseInt($page.params.id);
            const response = await fetch(`/api/editions/${id}`);
            const data = await response.json();

            if (response.ok) {
                edition = data;
            } else {
                error = data.error || 'Edition not found';
            }
        } catch (err) {
            error = err.message;
            console.error('Error loading edition:', err);
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

    async function generatePDF() {
        if (generating) return;
        generating = true;

        try {
            // In a real implementation, this would make an API call to trigger PDF generation
            console.log(`Generating PDF for edition ${edition.id}...`);

            // For now, just show a message
            alert(`PDF generation started for Issue ${edition.issue_number}. Use the CLI command: npm run pdf:generate ${edition.id}`);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Error generating PDF: ' + err.message);
        } finally {
            generating = false;
        }
    }
</script>

<svelte:head>
    <title>{edition ? `Issue ${edition.issue_number}` : 'Edition'} - The Daily Pilgrim</title>
</svelte:head>

{#if loading}
    <div class="loading">Loading edition...</div>
{:else if error}
    <div class="error">{error}</div>
    <div class="actions">
        <a href="/editions" class="btn btn-secondary">Back to Editions</a>
    </div>
{:else if edition}
    <div class="page-header">
        <h1>Issue {edition.issue_number}</h1>
        <p>Published {formatDate(edition.published_at)}</p>
        <div class="actions">
            <a href="/editions" class="btn btn-secondary">Back to Editions</a>
            <a href="/editions/{edition.id}/edit" class="btn btn-secondary">Edit</a>
            <button on:click={generatePDF} class="btn btn-primary" disabled={generating}>
                {generating ? 'Generating...' : 'Generate PDF'}
            </button>
        </div>
    </div>

    <div class="edition-content">
        {#if edition.cover_image}
            <div class="cover-section">
                <h2>Cover Image</h2>
                <div class="cover-image">
                    <img src="/api/images/{edition.cover_image.id}/file" alt="Cover" />
                    {#if edition.cover_image.caption}
                        <div class="image-caption">{edition.cover_image.caption}</div>
                    {/if}
                    {#if edition.cover_image.byline}
                        <div class="image-credit">Photo by {edition.cover_image.byline}</div>
                    {/if}
                </div>
            </div>
        {/if}

        <div class="content-section">
            <h2>Articles ({edition.articles?.length || 0})</h2>
            {#if edition.articles && edition.articles.length > 0}
                <div class="content-list">
                    {#each edition.articles as article}
                        <div class="content-item">
                            <h3>{article.hed}</h3>
                            {#if article.dek}
                                <div class="content-dek">{article.dek}</div>
                            {/if}
                            {#if article.authors}
                                <div class="content-authors">by {article.authors}</div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="empty-content">No articles in this edition.</p>
            {/if}
        </div>

        <div class="content-section">
            <h2>Poems ({edition.poems?.length || 0})</h2>
            {#if edition.poems && edition.poems.length > 0}
                <div class="content-list">
                    {#each edition.poems as poem}
                        <div class="content-item">
                            <h3>{poem.title}</h3>
                            {#if poem.authors}
                                <div class="content-authors">by {poem.authors}</div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="empty-content">No poems in this edition.</p>
            {/if}
        </div>

        <div class="content-section">
            <h2>Images ({edition.images?.length || 0})</h2>
            {#if edition.images && edition.images.length > 0}
                <div class="images-grid">
                    {#each edition.images as image}
                        <div class="image-item">
                            <img src="{image.processed_path || image.original_path}" alt="{image.caption || image.filename}" />
                            <div class="image-info">
                                <div class="image-filename">{image.filename}</div>
                                <div class="image-type">{image.usage_type}</div>
                                {#if image.caption}
                                    <div class="image-caption">{image.caption}</div>
                                {/if}
                                {#if image.authors}
                                    <div class="image-credit">by {image.authors}</div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="empty-content">No images in this edition.</p>
            {/if}
        </div>
    </div>
{/if}

<style>
    .page-header {
        background-color: var(--color-fg);
        color: var(--color-bg);
        text-align: center;
        margin-bottom: calc(var(--unit) * 3);
        padding: calc(var(--unit) * 2);
    }

    .page-header h1 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.5);
        font-weight: 900;
        margin: 0 0 calc(var(--unit) * 0.5) 0;
    }

    .page-header p {
        font-family: var(--font-body);
        margin: 0 0 calc(var(--unit) * 1.5) 0;
    }

    .actions {
        display: flex;
        gap: var(--unit);
        justify-content: center;
        flex-wrap: wrap;
    }

    .loading, .error {
        text-align: center;
        padding: calc(var(--unit) * 3);
        font-family: var(--font-body);
    }

    .error {
        color: var(--color-warn);
    }

    .edition-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--unit);
    }

    .cover-section, .content-section {
        margin-bottom: calc(var(--unit) * 3);
        padding: calc(var(--unit) * 1.5);
        border: 1px solid #ddd;
        background-color: white;
    }

    .cover-section h2, .content-section h2 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.25);
        font-weight: 700;
        margin: 0 0 calc(var(--unit) * 1.5) 0;
    }

    .cover-image {
        text-align: center;
    }

    .cover-image img {
        max-width: 300px;
        height: auto;
        border: 1px solid #ddd;
    }

    .content-list {
        display: flex;
        flex-direction: column;
        gap: calc(var(--unit) * 1.5);
    }

    .content-item {
        padding: calc(var(--unit) * 1);
        border: 1px solid #eee;
        background-color: #fafafa;
    }

    .content-item h3 {
        font-family: var(--font-hed);
        font-size: var(--unit);
        font-weight: 700;
        margin: 0 0 calc(var(--unit) * 0.5) 0;
    }

    .content-dek {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.9);
        color: #666;
        margin-bottom: calc(var(--unit) * 0.5);
    }

    .content-authors {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.85);
        color: var(--color-off);
        font-style: italic;
    }

    .empty-content {
        font-family: var(--font-body);
        color: #666;
        font-style: italic;
    }

    .images-grid {
        display: grid;
        gap: calc(var(--unit) * 1.5);
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    .image-item {
        border: 1px solid #eee;
        overflow: hidden;
    }

    .image-item img {
        width: 100%;
        height: 150px;
        object-fit: cover;
    }

    .image-info {
        padding: var(--unit);
    }

    .image-filename {
        font-family: var(--font-hed);
        font-weight: 600;
        font-size: calc(var(--unit) * 0.9);
        margin-bottom: calc(var(--unit) * 0.25);
    }

    .image-type {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.8);
        color: var(--color-off);
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: calc(var(--unit) * 0.5);
    }

    .image-caption {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.85);
        font-style: italic;
        margin-bottom: calc(var(--unit) * 0.25);
    }

    .image-credit {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.8);
        color: #666;
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
        background: none;
    }

    .btn:hover:not(:disabled) {
        opacity: 0.8;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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