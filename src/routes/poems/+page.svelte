<script>
  import { onMount } from "svelte";
  import Header from "$lib/components/Header.svelte";
  import Button from "$lib/components/base/Button.svelte";
  import LoadingState from "$lib/components/base/LoadingState.svelte";
  import EmptyState from "$lib/components/base/EmptyState.svelte";
  import PageContainer from "$lib/components/base/PageContainer.svelte";
  import CardGrid from "$lib/components/base/CardGrid.svelte";
  import Card from "$lib/components/base/Card.svelte";

  let poems = $state([]);
  let isLoading = $state(false);
  let message = $state("");

  onMount(async () => {
    await loadPoems();
  });

  async function loadPoems() {
    isLoading = true;
    try {
      const response = await fetch("/api/poems");
      const data = await response.json();
      poems = data;
    } catch (error) {
      console.error("Error loading poems:", error);
      message = "Failed to load poems";
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Poems - The Daily Pilgrim</title>
</svelte:head>

<Header
  breadcrumbs={[
    { href: "/", label: "Home" },
    { label: "Poems" }
  ]}
/>

<PageContainer>
  <div class="page-actions">
    <Button variant="primary" href="/poems/create">Create Poem</Button>
  </div>

  {#if message}
    <div class="alert">
      {message}
    </div>
  {/if}

  {#if isLoading}
    <LoadingState message="Loading poems..." />
  {:else if poems.length === 0}
    <EmptyState
      message="No poems found."
      actionText="Create the first poem"
      actionHref="/poems/create"
    />
  {:else}
    <CardGrid>
      {#each poems as poem}
        <Card>
          <h2>{poem.title}</h2>

          {#if poem.authors}
            <div class="authors">
              <span class="label">By:</span>
              <span>{poem.authors}</span>
            </div>
          {/if}

          <div class="poem-preview">
            {#each poem.body.split("\n").slice(0, 6) as line}
              {line}<br />
            {/each}
            {#if poem.body.split("\n").length > 6}
              <span class="continuation">...</span>
            {/if}
          </div>

          <div class="meta">
            Created {new Date(poem.created_at).toLocaleDateString()}
          </div>

          <div class="card-actions">
            <Button variant="primary" href="/poems/{poem.id}">View</Button>
            <Button variant="secondary" href="/poems/{poem.id}/edit">Edit</Button>
          </div>
        </Card>
      {/each}
    </CardGrid>
  {/if}
</PageContainer>

<style>
  .authors {
    font-family: var(--font-body);
    margin: 0 0 calc(var(--unit) * 0.5) 0;
  }

  .authors .label {
    font-weight: 600;
    margin-right: calc(var(--unit) * 0.5);
  }

  .poem-preview {
    font-family: var(--font-body);
    line-height: 1.6;
    margin: 0 0 var(--unit) 0;
    white-space: pre-line;
  }

  .continuation {
    opacity: 0.6;
    font-style: italic;
  }

  .meta {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.875);
    opacity: 0.6;
    margin: 0 0 calc(var(--unit) * 1.5) 0;
  }
</style>
