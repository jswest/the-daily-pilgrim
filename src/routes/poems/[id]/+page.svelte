<script>
  import { goto } from "$app/navigation";

  import { oxford } from "$lib/util";

  let { data } = $props();

  let poem = $state(data.poem);
  let error = $state(data.error || "");
  let poemId = $state(data.poemId);

  async function deletePoem() {
    if (!confirm("Are you sure you want to delete this poem?")) {
      return;
    }

    try {
      const response = await fetch(`/api/poems/${poemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        goto("/poems");
      } else {
        error = "Failed to delete poem";
      }
    } catch (err) {
      console.error("Error deleting poem:", err);
      error = "Network error. Please try again.";
    }
  }
</script>

<svelte:head>
  <title>{poem ? poem.title : "Poem"} - The Daily Pilgrim</title>
</svelte:head>

<div class="page-container">
  <header class="page-header">
    <div class="header-content">
      <nav class="breadcrumb">
        <a href="/">Home</a>
        <span>→</span>
        <a href="/poems">Poems</a>
        <span>→</span>
        <span>{poem ? poem.title : "Loading..."}</span>
      </nav>

      {#if poem}
        <div class="header-actions">
          <a href="/poems/{poem.id}/edit" class="btn btn-secondary">Edit</a>
          <button onclick={deletePoem} class="btn btn-danger">Delete</button>
        </div>
      {/if}
    </div>
  </header>

  <main>
    {#if error}
      <div class="alert alert-error">
        {error}
        <a href="/poems" class="back-link">← Back to Poems</a>
      </div>
    {:else if poem}
      <article class="poem-content">
        <div class="poem-header">
          <h1 class="poem-hed">{poem.title}</h1>
          {#if poem.authors && poem.authors.length > 0}
            <p class="authors">
              <span class="label">By</span>
              {oxford(poem.authors.map((a) => a.name))}
            </p>
          {/if}
        </div>
        <div class="poem-body">
          <div class="poem-text">
            {poem.body}
          </div>
        </div>
      </article>
    {/if}
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
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .alert {
    max-width: 800px;
    margin: 0 auto 2rem auto;
    padding: 1rem;
    border-radius: 0.375rem;
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
    text-align: center;
  }

  .back-link {
    display: inline-block;
    margin-top: 0.5rem;
    color: #3b82f6;
    text-decoration: none;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  main {
    max-width: 400px;
    margin: 0 auto var(--unit) auto;
  }

  .poem-content {
    background: white;
    border-radius: 0;
    border: 1px solid var(--color-fg);
    overflow: hidden;
  }
  h1.poem-hed {
    color: #111827;
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 2);
    font-weight: 100;
    line-height: 1;
    margin: var(--unit) 0 calc(var(--unit) * 1.5) 0;
    padding: 0 var(--unit);
    text-align: left;
    transform-origin: 0 0;
    transform: scaleX(75%);
    width: calc((400px - var(--unit) - var(--unit)) / 0.75);
  }
  .authors {
    font-family: var(--font-hed);
    font-size: var(--unit);
    font-weight: 900;
    padding: 0 var(--unit);
  }
  .poem-body {
    padding: 0 var(--unit);
  }
  .poem-text {
    font-family: var(--font-body);
    font-size: var(--unit);
    line-height: 1.5;
    white-space: pre-line;
    text-align: left;
    max-width: 400px;
    margin: 0 auto var(--unit) auto;
  }
</style>
