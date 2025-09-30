<script>
    import { onMount } from 'svelte';
    import Button from './base/Button.svelte';
    import LoadingState from './base/LoadingState.svelte';
    import OrderedContentList from './OrderedContentList.svelte';

    let {
        initialData = {
            issueNumber: 1,
            publishedAt: new Date().toISOString().split('T')[0],
            coverImageId: null,
            articleIds: [],
            poemIds: [],
            imageIds: []
        },
        onSubmit,
        isSubmitting = false,
        submitButtonText = 'Save',
        cancelHref = '/editions',
        showCurrentContent = false,
        currentEdition = null
    } = $props();

    // Form data
    let formData = $state({
        issueNumber: initialData.issueNumber,
        publishedAt: initialData.publishedAt,
        coverImageId: initialData.coverImageId
    });

    // Available content
    let availableContent = $state({
        articles: [],
        poems: [],
        images: []
    });
    let loadingContent = $state(true);

    // Ordered content - single unified array
    let orderedContent = $state([]);

    let error = $state('');

    onMount(async () => {
        try {
            const response = await fetch('/api/editions/available-content');
            const data = await response.json();
            if (response.ok) {
                availableContent = data;
                // Initialize ordered content from currentEdition if in edit mode
                if (currentEdition) {
                    initializeOrderedContent();
                }
            } else {
                error = data.error || 'Failed to load available content';
            }
        } catch (err) {
            error = err.message;
            console.error('Error loading available content:', err);
        } finally {
            loadingContent = false;
        }
    });

    function initializeOrderedContent() {
        const ordered = [];

        // Add articles with their orderPosition
        if (currentEdition.articles) {
            currentEdition.articles.forEach(article => {
                ordered.push({
                    type: 'article',
                    id: article.id,
                    data: article,
                    orderPosition: article.orderPosition
                });
            });
        }

        // Add poems with their orderPosition
        if (currentEdition.poems) {
            currentEdition.poems.forEach(poem => {
                ordered.push({
                    type: 'poem',
                    id: poem.id,
                    data: poem,
                    orderPosition: poem.orderPosition
                });
            });
        }

        // Add images with their orderPosition
        if (currentEdition.images) {
            currentEdition.images.forEach(image => {
                ordered.push({
                    type: 'image',
                    id: image.id,
                    data: image,
                    usageType: image.usageType || 'content',
                    orderPosition: image.orderPosition
                });
            });
        }

        // Sort by orderPosition to get correct global order
        ordered.sort((a, b) => a.orderPosition - b.orderPosition);

        orderedContent = ordered;
    }

    function isContentSelected(type, id) {
        return orderedContent.some(item => item.type === type && item.id === id);
    }

    function addArticle(articleId) {
        const article = availableContent.articles.find(a => a.id === articleId);
        if (!article) return;

        orderedContent = [...orderedContent, {
            type: 'article',
            id: articleId,
            data: article
        }];
    }

    function addPoem(poemId) {
        const poem = availableContent.poems.find(p => p.id === poemId);
        if (!poem) return;

        orderedContent = [...orderedContent, {
            type: 'poem',
            id: poemId,
            data: poem
        }];
    }

    function addImage(imageId, usageType) {
        const image = availableContent.images.find(img => img.id === imageId);
        if (!image) return;

        orderedContent = [...orderedContent, {
            type: 'image',
            id: imageId,
            data: image,
            usageType
        }];
    }

    function removeContent(index) {
        orderedContent = orderedContent.filter((_, i) => i !== index);
    }

    function moveUp(index) {
        if (index === 0) return;
        const newContent = [...orderedContent];
        [newContent[index - 1], newContent[index]] = [newContent[index], newContent[index - 1]];
        orderedContent = newContent;
    }

    function moveDown(index) {
        if (index === orderedContent.length - 1) return;
        const newContent = [...orderedContent];
        [newContent[index], newContent[index + 1]] = [newContent[index + 1], newContent[index]];
        orderedContent = newContent;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const articlesAndPoems = orderedContent.filter(item => item.type === 'article' || item.type === 'poem');
        if (articlesAndPoems.length === 0) {
            error = 'Please select at least one article or poem for this edition.';
            return;
        }

        error = '';

        const submissionData = {
            issueNumber: parseInt(formData.issueNumber),
            publishedAt: formData.publishedAt,
            coverImageId: formData.coverImageId,
            orderedContent: orderedContent.map(item => ({
                type: item.type,
                id: item.id,
                usageType: item.usageType
            }))
        };

        await onSubmit(submissionData);
    }
</script>

{#if loadingContent}
    <LoadingState message="Loading available content..." />
{:else}
    <form onsubmit={handleSubmit} class="edition-form">
        {#if error}
            <div class="alert error">{error}</div>
        {/if}

        <div class="form-section">
            <h2>Edition Details</h2>

            <div class="form-group">
                <label for="issueNumber">Issue Number</label>
                <input
                    type="number"
                    id="issueNumber"
                    bind:value={formData.issueNumber}
                    min="1"
                    required
                />
            </div>

            <div class="form-group">
                <label for="publishedAt">Publication Date</label>
                <input
                    type="date"
                    id="publishedAt"
                    bind:value={formData.publishedAt}
                    required
                />
            </div>

            <div class="form-group">
                <label>Cover Image</label>
                <div class="cover-image-selection">
                    <div class="cover-option" class:selected={formData.coverImageId === null}>
                        <input
                            type="radio"
                            id="no-cover"
                            bind:group={formData.coverImageId}
                            value={null}
                        />
                        <label for="no-cover" class="cover-label">
                            <div class="no-cover-preview">No Cover Image</div>
                        </label>
                    </div>

                    {#each availableContent.images as image}
                        <div class="cover-option" class:selected={formData.coverImageId === image.id}>
                            <input
                                type="radio"
                                id="cover-{image.id}"
                                bind:group={formData.coverImageId}
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

        <OrderedContentList
            orderedContent={orderedContent}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            onRemove={removeContent}
        />

        <div class="form-section">
            <h2>Add Content</h2>

            <div class="content-selection">
                <div class="content-type">
                    <h3>Articles</h3>
                    {#if availableContent.articles.length === 0}
                        <p class="empty-content">No available articles. <a href="/articles/create">Create an article first</a>.</p>
                    {:else}
                        <div class="content-grid">
                            {#each availableContent.articles as article}
                                {@const isSelected = isContentSelected('article', article.id)}
                                <div class="content-card" class:selected={isSelected} class:disabled={isSelected}>
                                    <div class="content-header">
                                        <h4>{article.hed}</h4>
                                        {#if article.authors}
                                            <div class="content-authors">by {article.authors}</div>
                                        {/if}
                                    </div>
                                    {#if article.dek}
                                        <div class="content-excerpt">{article.dek}</div>
                                    {/if}
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onclick={() => addArticle(article.id)}
                                        disabled={isSelected}
                                    >
                                        {isSelected ? 'Added' : 'Add'}
                                    </Button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div class="content-type">
                    <h3>Poems</h3>
                    {#if availableContent.poems.length === 0}
                        <p class="empty-content">No available poems. <a href="/poems/create">Create a poem first</a>.</p>
                    {:else}
                        <div class="content-grid">
                            {#each availableContent.poems as poem}
                                {@const isSelected = isContentSelected('poem', poem.id)}
                                <div class="content-card" class:selected={isSelected} class:disabled={isSelected}>
                                    <div class="content-header">
                                        <h4>{poem.title}</h4>
                                        {#if poem.authors}
                                            <div class="content-authors">by {poem.authors}</div>
                                        {/if}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onclick={() => addPoem(poem.id)}
                                        disabled={isSelected}
                                    >
                                        {isSelected ? 'Added' : 'Add'}
                                    </Button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div class="content-type">
                    <h3>Images</h3>
                    {#if availableContent.images.length === 0}
                        <p class="empty-content">No available images. <a href="/images/upload">Upload images first</a>.</p>
                    {:else}
                        <div class="content-grid images-grid">
                            {#each availableContent.images as image}
                                {@const isSelected = isContentSelected('image', image.id)}
                                <div class="content-card image-card" class:selected={isSelected} class:disabled={isSelected}>
                                    <div class="image-preview-large">
                                        <img src="/api/images/{image.id}/file" alt="{image.caption || image.filename}" />
                                    </div>
                                    <div class="content-header">
                                        <h4>{image.filename}</h4>
                                        {#if image.authors}
                                            <div class="content-authors">by {image.authors}</div>
                                        {/if}
                                    </div>
                                    {#if image.caption}
                                        <div class="content-excerpt">{image.caption}</div>
                                    {/if}
                                    <div class="image-actions">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onclick={() => addImage(image.id, 'content')}
                                            disabled={isSelected}
                                        >
                                            {isSelected ? 'Added' : 'Content'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onclick={() => addImage(image.id, 'background')}
                                            disabled={isSelected}
                                        >
                                            Background
                                        </Button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <div class="form-actions">
            <Button variant="secondary" href={cancelHref}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : submitButtonText}
            </Button>
        </div>
    </form>
{/if}

<style>
    .edition-form {
        max-width: 1200px;
        margin: 0 auto;
    }

    .alert {
        padding: var(--unit);
        margin-bottom: calc(var(--unit) * 2);
        font-family: var(--font-body);
        font-weight: 500;
    }

    .alert.error {
        background-color: var(--color-warn);
        color: var(--color-bg);
    }

    .form-section {
        margin-bottom: calc(var(--unit) * 3);
        padding: calc(var(--unit) * 1.5);
        border: 1px solid #dee2e6;
        background-color: var(--color-bg);
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

    .form-group input {
        width: 100%;
        max-width: 300px;
        padding: calc(var(--unit) * 0.75);
        border: 1px solid #ced4da;
        font-family: var(--font-body);
        font-size: var(--unit);
        border-radius: 0;
    }

    .form-group input:focus {
        outline: none;
        border-color: var(--color-off);
        box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .cover-image-selection {
        display: grid;
        gap: var(--unit);
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
        background-color: var(--color-bg);
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

    .content-type h3 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.1);
        font-weight: 700;
        margin: 0 0 calc(var(--unit) * 1.5) 0;
        color: var(--color-fg);
    }

    .content-selection {
        display: flex;
        flex-direction: column;
        gap: calc(var(--unit) * 2);
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

    .content-header h4 {
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

    .content-card.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    .empty-content {
        font-family: var(--font-body);
        color: #666;
        font-style: italic;
        text-align: center;
        padding: calc(var(--unit) * 2);
    }

    .images-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
    }

    .image-card {
        display: flex;
        flex-direction: column;
    }

    .image-preview-large {
        margin-bottom: var(--unit);
        width: 100%;
        height: 200px;
        overflow: hidden;
        border: 1px solid var(--color-fg);
    }

    .image-preview-large img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .image-actions {
        display: flex;
        gap: calc(var(--unit) * 0.5);
        margin-top: auto;
    }

    .image-actions :global(.btn) {
        flex: 1;
    }

    .form-actions {
        display: flex;
        gap: var(--unit);
        justify-content: center;
        margin-top: calc(var(--unit) * 3);
        padding-top: calc(var(--unit) * 2);
        border-top: 1px solid #dee2e6;
    }
</style>