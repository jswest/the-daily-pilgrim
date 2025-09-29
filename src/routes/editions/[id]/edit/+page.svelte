<script>
    import { goto } from '$app/navigation';
    import Header from '$lib/components/Header.svelte';
    import Button from '$lib/components/base/Button.svelte';
    import PageContainer from '$lib/components/base/PageContainer.svelte';

    let { data } = $props();

    let edition = $state(data.edition);
    let isSubmitting = $state(false);
    let submitMessage = $state('');
    let submitError = $state('');

    // Form data
    let formData = $state({
        issueNumber: edition.issueNumber,
        publishedAt: edition.publishedAt ? edition.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0],
        coverImageId: edition.coverImageId
    });

    // Available content for selection
    let availableContent = $state({
        articles: [],
        poems: [],
        images: []
    });
    let loadingContent = $state(true);

    // Selected content
    let selectedArticles = $state(edition.articles?.map(a => a.id) || []);
    let selectedPoems = $state(edition.poems?.map(p => p.id) || []);
    let selectedImages = $state(edition.images?.map(img => ({ id: img.id, usageType: img.usageType || 'content' })) || []);

    // Load available content on mount
    $effect(async () => {
        try {
            const response = await fetch('/api/editions/available-content');
            const data = await response.json();
            if (response.ok) {
                availableContent = data;
            }
        } catch (error) {
            console.error('Error loading available content:', error);
        } finally {
            loadingContent = false;
        }
    });

    function formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

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

    async function handleSubmit(event) {
        event.preventDefault();

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
                body: JSON.stringify({
                    issueNumber: parseInt(formData.issueNumber),
                    publishedAt: formData.publishedAt,
                    coverImageId: formData.coverImageId,
                    articleIds: selectedArticles,
                    poemIds: selectedPoems,
                    imageIds: selectedImages
                })
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

    <form onsubmit={handleSubmit} class="edition-form">
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

                    {#if !loadingContent}
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
                                            {#if image.authors}
                                                <div class="cover-authors">by {image.authors}</div>
                                            {/if}
                                        </div>
                                    </div>
                                </label>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2>Current Content</h2>

            <div class="current-content">
                <div class="content-type">
                    <h3>Articles ({edition.articles?.length || 0})</h3>
                    {#if edition.articles && edition.articles.length > 0}
                        <div class="content-list">
                            {#each edition.articles as article}
                                <div class="content-item">
                                    <h4><a href="/articles/{article.id}">{article.hed}</a></h4>
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

                <div class="content-type">
                    <h3>Poems ({edition.poems?.length || 0})</h3>
                    {#if edition.poems && edition.poems.length > 0}
                        <div class="content-list">
                            {#each edition.poems as poem}
                                <div class="content-item">
                                    <h4><a href="/poems/{poem.id}">{poem.title}</a></h4>
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

                <div class="content-type">
                    <h3>Images ({edition.images?.length || 0})</h3>
                    {#if edition.images && edition.images.length > 0}
                        <div class="images-grid">
                            {#each edition.images as image}
                                <div class="image-item">
                                    <img src="/api/images/{image.id}/file" alt="{image.caption || image.filename}" />
                                    <div class="image-info">
                                        <div class="image-filename">{image.filename}</div>
                                        <div class="image-type">{image.usageType}</div>
                                        {#if image.authors}
                                            <div class="image-authors">by {image.authors}</div>
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
        </div>

        <div class="form-section">
            <h2>Add Content</h2>

            <div class="content-selection">
                <div class="content-type">
                    <h3>Available Articles</h3>
                    {#if !loadingContent && availableContent.articles && availableContent.articles.length > 0}
                        <div class="available-content-list">
                            {#each availableContent.articles as article}
                                <div class="content-item selectable" class:selected={selectedArticles.includes(article.id)}>
                                    <input
                                        type="checkbox"
                                        id="article-{article.id}"
                                        checked={selectedArticles.includes(article.id)}
                                        onchange={() => toggleArticle(article.id)}
                                    />
                                    <label for="article-{article.id}" class="content-label">
                                        <h4>{article.hed}</h4>
                                        {#if article.dek}
                                            <div class="content-dek">{article.dek}</div>
                                        {/if}
                                        {#if article.authors}
                                            <div class="content-authors">by {article.authors}</div>
                                        {/if}
                                    </label>
                                </div>
                            {/each}
                        </div>
                    {:else if !loadingContent}
                        <p class="empty-content">No available articles.</p>
                    {/if}
                </div>

                <div class="content-type">
                    <h3>Available Poems</h3>
                    {#if !loadingContent && availableContent.poems && availableContent.poems.length > 0}
                        <div class="available-content-list">
                            {#each availableContent.poems as poem}
                                <div class="content-item selectable" class:selected={selectedPoems.includes(poem.id)}>
                                    <input
                                        type="checkbox"
                                        id="poem-{poem.id}"
                                        checked={selectedPoems.includes(poem.id)}
                                        onchange={() => togglePoem(poem.id)}
                                    />
                                    <label for="poem-{poem.id}" class="content-label">
                                        <h4>{poem.title}</h4>
                                        {#if poem.authors}
                                            <div class="content-authors">by {poem.authors}</div>
                                        {/if}
                                    </label>
                                </div>
                            {/each}
                        </div>
                    {:else if !loadingContent}
                        <p class="empty-content">No available poems.</p>
                    {/if}
                </div>

                <div class="content-type">
                    <h3>Available Images</h3>
                    {#if !loadingContent && availableContent.images && availableContent.images.length > 0}
                        <div class="images-selection-grid">
                            {#each availableContent.images as image}
                                <div class="image-item selectable" class:selected={selectedImages.some(img => img.id === image.id)}>
                                    <input
                                        type="checkbox"
                                        id="image-{image.id}"
                                        checked={selectedImages.some(img => img.id === image.id)}
                                        onchange={() => toggleImage(image.id)}
                                    />
                                    <label for="image-{image.id}" class="image-label">
                                        <img src="/api/images/{image.id}/file" alt="{image.caption || image.filename}" />
                                        <div class="image-info">
                                            <div class="image-filename">{image.filename}</div>
                                            {#if image.authors}
                                                <div class="image-authors">by {image.authors}</div>
                                            {/if}
                                        </div>
                                    </label>
                                </div>
                            {/each}
                        </div>
                    {:else if !loadingContent}
                        <p class="empty-content">No available images.</p>
                    {/if}
                </div>
            </div>
        </div>

        <div class="form-actions">
            <Button variant="secondary" href="/editions/{data.editionId}">Cancel</Button>
            <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Edition'}
            </button>
        </div>
    </form>
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

    .edition-form {
        max-width: 1200px;
        margin: 0 auto;
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

    .cover-authors {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.75);
        color: #6c757d;
        font-style: italic;
    }

    .current-content {
        display: flex;
        flex-direction: column;
        gap: calc(var(--unit) * 2);
    }

    .content-type h3 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.1);
        font-weight: 700;
        margin: 0 0 var(--unit) 0;
        color: var(--color-fg);
    }

    .content-list {
        display: flex;
        flex-direction: column;
        gap: calc(var(--unit) * 1);
    }

    .content-item {
        padding: var(--unit);
        border: 1px solid #e9ecef;
        background-color: #f8f9fa;
    }

    .content-item h4 {
        font-family: var(--font-hed);
        font-size: var(--unit);
        font-weight: 700;
        margin: 0 0 calc(var(--unit) * 0.5) 0;
    }

    .content-item h4 a {
        color: var(--color-off);
        text-decoration: none;
    }

    .content-item h4 a:hover {
        text-decoration: underline;
    }

    .content-dek {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.9);
        color: #666;
        margin-bottom: calc(var(--unit) * 0.5);
        font-style: italic;
    }

    .content-authors {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.85);
        color: var(--color-off);
        font-weight: 600;
    }

    .empty-content {
        font-family: var(--font-body);
        color: #666;
        font-style: italic;
        text-align: center;
        padding: calc(var(--unit) * 2);
    }

    .images-grid {
        display: grid;
        gap: calc(var(--unit) * 1.5);
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .image-item {
        border: 1px solid #dee2e6;
        overflow: hidden;
        background-color: var(--color-bg);
    }

    .image-item img {
        width: 100%;
        height: 150px;
        object-fit: cover;
    }

    .image-info {
        padding: calc(var(--unit) * 0.75);
    }

    .image-filename {
        font-family: var(--font-hed);
        font-weight: 600;
        font-size: calc(var(--unit) * 0.9);
        margin-bottom: calc(var(--unit) * 0.25);
    }

    .image-type {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.75);
        color: var(--color-off);
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: calc(var(--unit) * 0.25);
    }

    .image-authors {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.8);
        color: #666;
        font-style: italic;
    }

    .form-actions {
        display: flex;
        gap: var(--unit);
        justify-content: center;
        margin-top: calc(var(--unit) * 3);
        padding-top: calc(var(--unit) * 2);
        border-top: 1px solid #dee2e6;
    }

    .btn-primary {
        background-color: var(--color-off);
        color: var(--color-bg);
        border: none;
        padding: calc(var(--unit) * 0.5) var(--unit);
        font-family: var(--font-hed);
        font-size: var(--unit);
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
        opacity: 1;
    }

    .btn-primary:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .content-selection {
        display: flex;
        flex-direction: column;
        gap: calc(var(--unit) * 2);
    }

    .available-content-list {
        display: flex;
        flex-direction: column;
        gap: var(--unit);
    }

    .content-item.selectable {
        display: flex;
        gap: var(--unit);
        align-items: flex-start;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .content-item.selectable:hover {
        background-color: #f0f8ff;
    }

    .content-item.selectable.selected {
        background-color: #e6f3ff;
        border-color: var(--color-off);
    }

    .content-label {
        flex: 1;
        cursor: pointer;
    }

    .content-label h4 {
        font-family: var(--font-hed);
        font-size: var(--unit);
        font-weight: 700;
        margin: 0 0 calc(var(--unit) * 0.5) 0;
        color: var(--color-fg);
    }

    .images-selection-grid {
        display: grid;
        gap: var(--unit);
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }

    .image-item.selectable {
        position: relative;
        cursor: pointer;
        transition: all 0.2s;
    }

    .image-item.selectable:hover {
        transform: scale(1.02);
    }

    .image-item.selectable.selected {
        border-color: var(--color-off);
        background-color: #e6f3ff;
    }

    .image-item.selectable input[type="checkbox"] {
        position: absolute;
        top: calc(var(--unit) * 0.5);
        right: calc(var(--unit) * 0.5);
        z-index: 1;
    }

    .image-label {
        display: block;
        cursor: pointer;
    }

    .image-label img {
        width: 100%;
        height: 100px;
        object-fit: cover;
        border-bottom: 1px solid #e9ecef;
    }

    .image-authors {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.75);
        color: #666;
        font-style: italic;
    }
</style>