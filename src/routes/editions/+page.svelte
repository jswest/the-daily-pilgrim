<script>
  import { onMount } from "svelte";
  import Button from "$lib/components/base/Button.svelte";
  import LoadingState from "$lib/components/base/LoadingState.svelte";
  import EmptyState from "$lib/components/base/EmptyState.svelte";
  import PageContainer from "$lib/components/base/PageContainer.svelte";
  import CardGrid from "$lib/components/base/CardGrid.svelte";
  import Card from "$lib/components/base/Card.svelte";
  import Header from "$lib/components/Header.svelte";

  let editions = $state([]);
  let loading = $state(true);
  let error = $state("");

  onMount(async () => {
    try {
      const response = await fetch("/api/editions");
      const data = await response.json();

      if (response.ok) {
        editions = data;
      } else {
        error = data.error || "Failed to load editions";
      }
    } catch (err) {
      error = err.message;
      console.error("Error loading editions:", err);
    } finally {
      loading = false;
    }
  });

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
</script>

<svelte:head>
  <title>Editions - The Daily Pilgrim</title>
</svelte:head>

<Header breadcrumbs={[{ href: "/", label: "Home" }, { label: "Editions" }]} />

<PageContainer>
  <div class="page-actions">
    <Button href="/editions/create" variant="primary">Create new edition</Button>
  </div>

  {#if error}
    <div class="alert">{error}</div>
  {/if}

  {#if loading}
    <LoadingState message="Loading editions..." />
  {:else if editions.length === 0}
    <EmptyState
      message="No editions yet. Create your first magazine edition to get started."
      actionText="Create new edition"
      actionHref="/editions/create"
    />
  {:else}
    <CardGrid>
      {#each editions as edition}
        <Card>
          <h2>Issue {edition.issueNumber}</h2>
          <div class="edition-date">{formatDate(edition.publishedAt)}</div>

          {#if edition.coverImage}
            <div class="edition-cover">
              <img
                src="/api/images/{edition.coverImage.id}/file"
                alt="Issue {edition.issueNumber} cover"
              />
            </div>
          {/if}

          <div class="card-actions">
            <Button href="/editions/{edition.id}" variant="primary">
              View
            </Button>
            <Button href="/editions/{edition.id}/edit" variant="secondary">
              Edit
            </Button>
          </div>
        </Card>
      {/each}
    </CardGrid>
  {/if}
</PageContainer>

<style>
  .page-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: calc(var(--unit) * 2);
  }

  .alert {
    padding: var(--unit);
    margin-bottom: calc(var(--unit) * 2);
    font-family: var(--font-body);
    font-weight: 500;
    background-color: var(--color-warn);
    color: var(--color-bg);
    text-align: center;
  }

  .edition-date {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.9);
    opacity: 0.6;
    margin-bottom: calc(var(--unit) * 1.5);
  }

  .edition-cover {
    margin-bottom: calc(var(--unit) * 1.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edition-cover img {
    max-width: 100%;
    max-height: 200px;
    object-fit: cover;
    border: 1px solid var(--color-fg);
  }
</style>
