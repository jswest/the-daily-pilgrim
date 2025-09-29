<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Header from '$lib/components/Header.svelte';
    import Button from '$lib/components/base/Button.svelte';
    import LoadingState from '$lib/components/base/LoadingState.svelte';
    import PageContainer from '$lib/components/base/PageContainer.svelte';

    let loading = true;
    let saving = false;
    let error = '';

    // Form data
    let issueNumber = 1;
    let publishedAt = new Date().toISOString().split('T')[0];
    let coverImageId = null;

    // Available content
    let availableContent = {
        articles: [],
        poems: [],
        images: []
    };

    // Selected content for this edition
    let selectedArticles = [];
    let selectedPoems = [];
    let selectedImages = [];

    onMount(async () => {
        try {
            // Get next issue number
            const issueResponse = await fetch('/api/editions/next-issue');
            const issueData = await issueResponse.json();
            if (issueResponse.ok) {
                issueNumber = issueData.nextIssueNumber;
            }

            // Load available content
            const contentResponse = await fetch('/api/editions/available-content');
            const contentData = await contentResponse.json();
            if (contentResponse.ok) {
                availableContent = contentData;
            } else {
                error = contentData.error || 'Failed to load available content';
            }
        } catch (err) {
            error = err.message;
            console.error('Error loading data:', err);
        } finally {
            loading = false;
        }
    });

    function toggleArticle(articleId) {
        if (selectedArticles.includes(articleId)) {
            selectedArticles = selectedArticles.filter(id => id !== articleId);
        } else {
            selectedArticles = [...selectedArticles, articleId];
        }
    }

    function togglePoem(poemId) {
        if (selectedPoems.includes(poemId)) {
            selectedPoems = selectedPoems.filter(id => id !== poemId);
        } else {
            selectedPoems = [...selectedPoems, poemId];
        }
    }

    function toggleImage(imageId) {
        if (selectedImages.some(img => img.id === imageId)) {
            selectedImages = selectedImages.filter(img => img.id !== imageId);
        } else {
            selectedImages = [...selectedImages, { id: imageId, usageType: 'content' }];
        }
    }

    async function handleSubmit() {
        if (saving) return;

        if (selectedArticles.length === 0 && selectedPoems.length === 0) {
            error = 'Please select at least one article or poem for this edition.';
            return;
        }

        saving = true;
        error = '';

        try {
            const response = await fetch('/api/editions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    issueNumber: issueNumber,
                    publishedAt: publishedAt,
                    coverImageId: coverImageId
                })
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Edition created:', result);
                goto(`/editions/${result.id}`);
            } else {
                error = result.error || 'Failed to create edition';
            }
        } catch (err) {
            error = err.message;
            console.error('Error creating edition:', err);
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

{#if loading}
    <PageContainer>
        <LoadingState message="Loading available content..." />
    </PageContainer>
{:else}
    <PageContainer>
        <div class="edition-header">
            <h1>Create New Edition</h1>
            <p>Select content and create a new magazine edition</p>
        </div>

        <form on:submit|preventDefault={handleSubmit} class="edition-form">
            {#if error}
                <div class="alert">{error}</div>
            {/if}

        <div class="form-section">
            <h2>Edition Details</h2>

            <div class="form-group">
                <label for="issueNumber">Issue Number</label>
                <input
                    type="number"
                    id="issueNumber"
                    bind:value={issueNumber}
                    min="1"
                    required
                />
            </div>

            <div class="form-group">
                <label for="publishedAt">Publication Date</label>
                <input
                    type="date"
                    id="publishedAt"
                    bind:value={publishedAt}
                    required
                />
            </div>

            <div class="form-group">
                <label>Cover Image</label>
                <div class="cover-image-selection">
                    <div class="cover-option" class:selected={coverImageId === null}>
                        <input
                            type="radio"
                            id="no-cover"
                            bind:group={coverImageId}
                            value={null}
                        />
                        <label for="no-cover" class="cover-label">
                            <div class="no-cover-preview">No Cover Image</div>
                        </label>
                    </div>

                    {#each availableContent.images as image}
                        <div class="cover-option" class:selected={coverImageId === image.id}>
                            <input
                                type="radio"
                                id="cover-{image.id}"
                                bind:group={coverImageId}
                                value={image.id}
                            />
                            <label for="cover-{image.id}" class="cover-label">
                                <div class="cover-preview">
                                    <img src="/api/images/{image.id}/file" alt="{image.filename}" />
                                    <div class="cover-info">
                                        <div class="cover-filename">{image.filename}</div>
                                        <div class="cover-type">{image.imageType || 'image'}</div>
                                        {#if image.authors}
                                            <div class="cover-authors">by {image.authors}</div>
                                        {/if}
                                    </div>
                                </div>
                            </label>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2>Select Articles ({selectedArticles.length} selected)</h2>
            {#if availableContent.articles.length === 0}
                <p class="empty-content">No available articles. <a href="/articles/create">Create an article first</a>.</p>
            {:else}
                <div class="content-grid">
                    {#each availableContent.articles as article}
                        <div class="content-card" class:selected={selectedArticles.includes(article.id)}>
                            <div class="content-header">
                                <h3>{article.hed}</h3>
                                {#if article.authors}
                                    <div class="content-authors">by {article.authors}</div>
                                {/if}
                            </div>
                            {#if article.dek}
                                <div class="content-excerpt">{article.dek}</div>
                            {/if}
                            <button
                                type="button"
                                class="btn btn-small"
                                class:btn-primary={selectedArticles.includes(article.id)}
                                class:btn-secondary={!selectedArticles.includes(article.id)}
                                on:click={() => toggleArticle(article.id)}
                            >
                                {selectedArticles.includes(article.id) ? 'Remove' : 'Add'}
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="form-section">
            <h2>Select Poems ({selectedPoems.length} selected)</h2>
            {#if availableContent.poems.length === 0}
                <p class="empty-content">No available poems. <a href="/poems/create">Create a poem first</a>.</p>
            {:else}
                <div class="content-grid">
                    {#each availableContent.poems as poem}
                        <div class="content-card" class:selected={selectedPoems.includes(poem.id)}>
                            <div class="content-header">
                                <h3>{poem.title}</h3>
                                {#if poem.authors}
                                    <div class="content-authors">by {poem.authors}</div>
                                {/if}
                            </div>
                            <button
                                type="button"
                                class="btn btn-small"
                                class:btn-primary={selectedPoems.includes(poem.id)}
                                class:btn-secondary={!selectedPoems.includes(poem.id)}
                                on:click={() => togglePoem(poem.id)}
                            >
                                {selectedPoems.includes(poem.id) ? 'Remove' : 'Add'}
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="form-section">
            <h2>Select Images ({selectedImages.length} selected)</h2>
            {#if availableContent.images.length === 0}
                <p class="empty-content">No available images. <a href="/images/upload">Upload images first</a>.</p>
            {:else}
                <div class="content-grid">
                    {#each availableContent.images as image}
                        <div class="content-card" class:selected={selectedImages.some(img => img.id === image.id)}>
                            <div class="image-preview">
                                <img src="/api/images/{image.id}/file" alt="{image.caption || image.filename}" />
                            </div>
                            <div class="content-header">
                                <h3>{image.filename}</h3>
                                {#if image.authors}
                                    <div class="content-authors">by {image.authors}</div>
                                {/if}
                            </div>
                            {#if image.caption}
                                <div class="content-excerpt">{image.caption}</div>
                            {/if}
                            <button
                                type="button"
                                class="btn btn-small"
                                class:btn-primary={selectedImages.some(img => img.id === image.id)}
                                class:btn-secondary={!selectedImages.some(img => img.id === image.id)}
                                on:click={() => toggleImage(image.id)}
                            >
                                {selectedImages.some(img => img.id === image.id) ? 'Remove' : 'Add'}
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

            <div class="form-actions">
                <Button variant="secondary" href="/editions">Cancel</Button>
                <button type="submit" class="btn btn-primary" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Edition'}
                </button>
            </div>
        </form>
    </PageContainer>
{/if}

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

    .edition-form {
        max-width: 1200px;
        margin: 0 auto;
    }

    .form-section {
        margin-bottom: calc(var(--unit) * 3);
        padding: calc(var(--unit) * 1.5);
        border: 1px solid #dee2e6;
        background-color: white;
    }

    .form-section h2 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.25);
        font-weight: 700;
        margin: 0 0 calc(var(--unit) * 1.5) 0;
        color: var(--color-fg);
    }

    .form-group {
        margin-bottom: calc(var(--unit) * 1.5);
    }

    .form-group label {
        display: block;
        font-family: var(--font-hed);
        font-weight: 600;
        margin-bottom: calc(var(--unit) * 0.5);
        color: var(--color-fg);
    }

    .form-group input,
    .form-group select {
        width: 100%;
        max-width: 300px;
        padding: calc(var(--unit) * 0.75);
        border: 1px solid #ced4da;
        font-family: var(--font-body);
        font-size: var(--unit);
        border-radius: 0;
    }

    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: var(--color-off);
        box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .content-grid {
        display: grid;
        gap: calc(var(--unit) * 1.5);
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    .content-card {
        border: 1px solid #dee2e6;
        padding: var(--unit);
        background-color: white;
        transition: all 0.2s ease;
    }

    .content-card.selected {
        border-color: var(--color-off);
        background-color: #f0f8ff;
        box-shadow: 0 2px 4px rgba(0, 102, 204, 0.1);
    }

    .content-header h3 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.1);
        font-weight: 700;
        margin: 0 0 calc(var(--unit) * 0.5) 0;
        line-height: 1.2;
        color: var(--color-fg);
    }

    .content-authors {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.85);
        color: var(--color-off);
        font-weight: 600;
        margin-bottom: calc(var(--unit) * 0.75);
    }

    .content-excerpt {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.9);
        line-height: 1.4;
        margin-bottom: calc(var(--unit) * 1);
        color: #495057;
    }

    .image-preview {
        margin-bottom: var(--unit);
    }

    .image-preview img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border: 1px solid #dee2e6;
    }

    .btn-small {
        padding: calc(var(--unit) * 0.5) calc(var(--unit) * 0.75);
        font-size: calc(var(--unit) * 0.85);
    }

    .form-actions {
        display: flex;
        gap: var(--unit);
        justify-content: center;
        margin-top: calc(var(--unit) * 3);
        padding-top: calc(var(--unit) * 2);
        border-top: 1px solid #dee2e6;
    }

    /* Cover Image Selection */
    .cover-image-selection {
        display: grid;
        gap: calc(var(--unit) * 1);
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        margin-top: calc(var(--unit) * 0.75);
    }

    .cover-option {
        position: relative;
    }

    .cover-option input[type="radio"] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .cover-label {
        display: block;
        cursor: pointer;
        border: 2px solid #dee2e6;
        transition: all 0.2s ease;
        background-color: white;
    }

    .cover-option.selected .cover-label,
    .cover-label:hover {
        border-color: var(--color-off);
        background-color: #f0f8ff;
    }

    .no-cover-preview {
        padding: calc(var(--unit) * 2);
        text-align: center;
        color: #6c757d;
        font-family: var(--font-body);
        font-style: italic;
        background-color: #f8f9fa;
        border: 2px dashed #dee2e6;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .cover-option.selected .no-cover-preview {
        background-color: #f0f8ff;
        border-color: var(--color-off);
        color: var(--color-off);
    }

    .cover-preview {
        display: flex;
        flex-direction: column;
    }

    .cover-preview img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-bottom: 1px solid #e9ecef;
    }

    .cover-info {
        padding: calc(var(--unit) * 0.75);
    }

    .cover-filename {
        font-family: var(--font-hed);
        font-weight: 600;
        font-size: calc(var(--unit) * 0.9);
        margin-bottom: calc(var(--unit) * 0.25);
        color: var(--color-fg);
    }

    .cover-type {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.75);
        color: var(--color-off);
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: calc(var(--unit) * 0.25);
    }

    .cover-authors {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.75);
        color: #6c757d;
        font-style: italic;
    }
</style>