<script>
  import { onMount } from "svelte";
  import Header from "$lib/components/Header.svelte";
  import Button from "$lib/components/base/Button.svelte";
  import LoadingState from "$lib/components/base/LoadingState.svelte";
  import EmptyState from "$lib/components/base/EmptyState.svelte";
  import PageContainer from "$lib/components/base/PageContainer.svelte";
  import CardGrid from "$lib/components/base/CardGrid.svelte";
  import Card from "$lib/components/base/Card.svelte";

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

<PageContainer>
  <div class="page-actions">
    <Button variant="primary" href="/articles/create">Create Article</Button>
  </div>

  {#if message}
    <div class="alert">
      {message}
    </div>
  {/if}

  {#if isLoading}
    <LoadingState message="Loading articles..." />
  {:else if articles.length === 0}
    <EmptyState
      message="No articles found."
      actionText="Create the first article"
      actionHref="/articles/create"
    />
  {:else}
    <CardGrid>
      {#each articles as article}
        <Card>
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
            Created {new Date(article.createdAt).toLocaleDateString()}
          </div>

          <div class="card-actions">
            <Button variant="primary" href="/articles/{article.id}">View</Button>
            <Button variant="secondary" href="/articles/{article.id}/edit">Edit</Button>
          </div>
        </Card>
      {/each}
    </CardGrid>
  {/if}
</PageContainer>

<style>
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
</style>
