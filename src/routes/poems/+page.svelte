<script>
    import { onMount } from 'svelte';

    let poems = $state([]);
    let isLoading = $state(false);
    let message = $state('');

    onMount(async () => {
        await loadPoems();
    });

    async function loadPoems() {
        isLoading = true;
        try {
            const response = await fetch('/api/poems');
            const data = await response.json();
            poems = data;
        } catch (error) {
            console.error('Error loading poems:', error);
            message = 'Failed to load poems';
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Poems - The Daily Pilgrim</title>
</svelte:head>

<div class="page-container">
    <header class="page-header">
        <div class="header-content">
            <div>
                <h1>Poems</h1>
                <nav class="breadcrumb">
                    <a href="/">Home</a>
                    <span>→</span>
                    <span>Poems</span>
                </nav>
            </div>
            <a href="/poems/create" class="btn btn-primary">Create Poem</a>
        </div>
    </header>

    {#if message}
        <div class="alert alert-error">
            {message}
        </div>
    {/if}

    <main>
        <div class="poems-list">
            {#if isLoading}
                <div class="loading">Loading poems...</div>
            {:else if poems.length === 0}
                <div class="empty-state">
                    <p>No poems found.</p>
                    <a href="/poems/create" class="btn btn-primary">Create the first poem</a>
                </div>
            {:else}
                <div class="poems-grid">
                    {#each poems as poem}
                        <article class="poem-card">
                            <div class="poem-header">
                                <h2 class="poem-title">{poem.title}</h2>
                                {#if poem.authors}
                                    <div class="poem-authors">
                                        <span class="label">By:</span>
                                        <span class="authors">{poem.authors}</span>
                                    </div>
                                {/if}
                            </div>
                            
                            <div class="poem-body">
                                <div class="poem-preview">
                                    {#each poem.body.split('\n').slice(0, 6) as line}
                                        {line}<br/>
                                    {/each}
                                    {#if poem.body.split('\n').length > 6}
                                        <span class="continuation">...</span>
                                    {/if}
                                </div>
                            </div>
                            
                            <div class="poem-meta">
                                <div class="poem-date">
                                    Created {new Date(poem.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            
                            <div class="poem-actions">
                                <a href="/poems/{poem.id}" class="btn btn-secondary">View</a>
                                <a href="/poems/{poem.id}/edit" class="btn btn-outline">Edit</a>
                            </div>
                        </article>
                    {/each}
                </div>
            {/if}
        </div>
    </main>
</div>

<style>
    .page-container {
        min-height: 100vh;
        background: #f9fafb;
    }

    .page-header {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 2rem;
        margin-bottom: 2rem;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        max-width: 1200px;
        margin: 0 auto;
    }

    .page-header h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
    }

    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .breadcrumb a {
        color: #3b82f6;
        text-decoration: none;
    }

    .breadcrumb a:hover {
        text-decoration: underline;
    }

    .alert {
        max-width: 1200px;
        margin: 0 auto 2rem auto;
        padding: 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
    }

    main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem 2rem 2rem;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }

    .empty-state {
        text-align: center;
        padding: 3rem;
        color: #6b7280;
    }

    .empty-state p {
        margin-bottom: 1rem;
        font-size: 1.125rem;
    }

    .poems-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 2rem;
    }

    .poem-card {
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        padding: 1.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.2s;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .poem-card:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .poem-header {
        margin-bottom: 1rem;
    }

    .poem-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        line-height: 1.4;
    }

    .poem-authors {
        font-size: 0.875rem;
    }

    .poem-authors .label {
        font-weight: 500;
        color: #6b7280;
        margin-right: 0.5rem;
    }

    .poem-authors .authors {
        color: #111827;
    }

    .poem-body {
        flex: 1;
        margin-bottom: 1rem;
    }

    .poem-preview {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 1rem;
        line-height: 1.6;
        color: #374151;
        white-space: pre-line;
    }

    .continuation {
        color: #6b7280;
        font-style: italic;
    }

    .poem-meta {
        margin-bottom: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f3f4f6;
    }

    .poem-date {
        font-size: 0.875rem;
        color: #9ca3af;
    }

    .poem-actions {
        display: flex;
        gap: 0.75rem;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: background-color 0.2s;
        display: inline-block;
        text-align: center;
    }

    .btn-primary {
        background: #3b82f6;
        color: white;
    }

    .btn-primary:hover {
        background: #2563eb;
    }

    .btn-secondary {
        background: #f3f4f6;
        color: #374151;
    }

    .btn-secondary:hover {
        background: #e5e7eb;
    }

    .btn-outline {
        background: transparent;
        color: #3b82f6;
        border: 1px solid #3b82f6;
    }

    .btn-outline:hover {
        background: #3b82f6;
        color: white;
    }
</style>