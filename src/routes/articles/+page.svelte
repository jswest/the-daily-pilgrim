<script>
  import { onMount } from "svelte";
  import Header from "$lib/components/Header.svelte";

  let articles = $state([]);
  let isLoading = $state(false);
  let message = $state("");

  onMount(async () => {
    await loadArticles();
  });

  async function loadArticles() {
    isLoading = true;
    try {
      const response = await fetch("/api/articles");
      const data = await response.json();
      articles = data;
    } catch (error) {
      console.error("Error loading articles:", error);
      message = "Failed to load articles";
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Articles - The Daily Pilgrim</title>
</svelte:head>

<Header
  breadcrumbs={[
    { href: "/", label: "Home" },
    { label: "Articles" }
  ]}
/>

<div class="main-content">
  <div class="page-actions">
    <a href="/articles/create" class="btn btn-primary">Create Article</a>
  </div>

  {#if message}
    <div class="alert">
      {message}
    </div>
  {/if}

  {#if isLoading}
    <div class="loading">Loading articles...</div>
  {:else if articles.length === 0}
    <div class="empty-state">
      <p>No articles found.</p>
      <a href="/articles/create" class="btn btn-primary">Create the first article</a>
    </div>
  {:else}
    <div class="card-grid">
      {#each articles as article}
        <article class="card">
          <h2>{article.hed}</h2>
          {#if article.dek}
            <p class="dek">{article.dek}</p>
          {/if}
          
          <div class="body-preview">
            {article.body.length > 150
              ? article.body.substring(0, 150) + "..."
              : article.body}
          </div>

          {#if article.authors}
            <div class="authors">
              <span class="label">By:</span>
              <span>{article.authors}</span>
            </div>
          {/if}
          
          <div class="meta">
            Created {new Date(article.created_at).toLocaleDateString()}
          </div>

          <div class="card-actions">
            <a href="/articles/{article.id}" class="btn btn-primary">View</a>
            <a href="/articles/{article.id}/edit" class="btn btn-secondary">Edit</a>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<style>
  :global(:root) {
    --color-bg: #ffffff;
    --color-fg: #000000;
    --color-off: #0066cc;
    --color-warn: #cc6600;
    --font-body: "Cormorant";
    --font-dek: "Merriweather";
    --font-hed: "Merriweather";
    --font-masthead: "Bodoni Moda";
    --unit: 16px;
  }

  .hero {
    background-color: var(--color-fg);
    color: var(--color-bg);
    text-align: center;
    margin-bottom: calc(var(--unit) * 3);
    padding: var(--unit);
  }
  
  .hero h1 {
    font-family: var(--font-masthead);
    font-size: calc(var(--unit) * 2);
    font-weight: 600;
    line-height: 1;
    margin: 0 0 var(--unit) 0;
    text-transform: uppercase;
    transform-origin: 50% 50%;
    transform: scaleY(75%);
  }
  
  .hero p {
    font-family: var(--font-hed);
    font-size: var(--unit);
    font-weight: 900;
    margin: 0;
  }

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

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: calc(var(--unit) * 0.5);
    font-family: var(--font-body);
    color: var(--color-fg);
  }

  .breadcrumb a {
    color: var(--color-off);
    text-decoration: none;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }

  .alert {
    background-color: var(--color-warn);
    color: var(--color-bg);
    padding: var(--unit);
    margin-bottom: calc(var(--unit) * 2);
    text-align: center;
  }

  .loading {
    text-align: center;
    padding: calc(var(--unit) * 2);
    font-family: var(--font-body);
    color: var(--color-fg);
  }

  .empty-state {
    text-align: center;
    padding: calc(var(--unit) * 3);
    font-family: var(--font-body);
    color: var(--color-fg);
  }

  .empty-state p {
    margin-bottom: var(--unit);
    font-size: calc(var(--unit) * 1.125);
  }

  .card-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .card {
    background-color: white;
    border: 1px solid var(--color-fg);
    padding: var(--unit);
  }

  .card h2 {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.125);
    font-weight: 900;
    line-height: 1;
    margin: 0 0 calc(var(--unit) * 0.5) 0;
  }

  .dek {
    font-family: var(--font-dek);
    font-style: italic;
    line-height: 1.4;
    margin: 0 0 var(--unit) 0;
    opacity: 0.8;
  }

  .body-preview {
    font-family: var(--font-body);
    line-height: 1.5;
    margin: 0 0 var(--unit) 0;
  }

  .authors {
    font-family: var(--font-body);
    margin: 0 0 calc(var(--unit) * 0.5) 0;
  }

  .authors .label {
    font-weight: 600;
    margin-right: calc(var(--unit) * 0.5);
  }

  .meta {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.875);
    opacity: 0.6;
    margin: 0 0 calc(var(--unit) * 1.5) 0;
  }

  .card-actions {
    display: flex;
    gap: var(--unit);
    flex-wrap: wrap;
  }

  .btn {
    border: none;
    border-radius: 0;
    box-sizing: border-box;
    cursor: pointer;
    display: inline-block;
    font-family: var(--font-hed);
    font-size: var(--unit);
    font-weight: 400;
    line-height: 1;
    opacity: 0.5;
    padding: calc(var(--unit) * 0.5);
    text-decoration: none;
    transition: opacity 0.2s;
    text-align: center;
  }
  
  .btn:hover {
    opacity: 1;
  }

  .btn-primary {
    background-color: var(--color-off);
    color: var(--color-bg);
  }

  .btn-secondary {
    background: var(--color-bg);
    border: 1px solid var(--color-fg);
    color: var(--color-fg);
  }
</style>
