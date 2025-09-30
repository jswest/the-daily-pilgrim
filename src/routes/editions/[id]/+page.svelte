<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import Header from "$lib/components/Header.svelte";
  import Button from "$lib/components/base/Button.svelte";
  import LoadingState from "$lib/components/base/LoadingState.svelte";
  import PageContainer from "$lib/components/base/PageContainer.svelte";

  let edition = $state(null);
  let loading = $state(true);
  let error = $state("");
  let generating = $state(false);
  let deleting = $state(false);

  onMount(async () => {
    try {
      const id = parseInt($page.params.id);
      const response = await fetch(`/api/editions/${id}`);
      const data = await response.json();

      if (response.ok) {
        edition = data;
      } else {
        error = data.error || "Edition not found";
      }
    } catch (err) {
      error = err.message;
      console.error("Error loading edition:", err);
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

  async function generatePDF() {
    if (generating) return;
    generating = true;

    try {
      console.log(`Generating PDF for edition ${edition.id}...`);
      alert(
        `PDF generation started for Issue ${edition.issueNumber}. Use the CLI command: npm run pdf:generate ${edition.id}`
      );
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF: " + err.message);
    } finally {
      generating = false;
    }
  }

  async function deleteEdition() {
    if (deleting) return;

    const confirmed = confirm(
      `Are you sure you want to delete Issue ${edition.issueNumber}? This action cannot be undone.`
    );

    if (!confirmed) return;

    deleting = true;

    try {
      const response = await fetch(`/api/editions/${edition.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        goto("/editions");
      } else {
        const data = await response.json();
        error = data.error || "Failed to delete edition";
        alert(error);
      }
    } catch (err) {
      error = err.message;
      console.error("Error deleting edition:", err);
      alert("Error deleting edition: " + err.message);
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title
    >{edition ? `Issue ${edition.issueNumber}` : "Edition"} - The Daily Pilgrim</title
  >
</svelte:head>

<Header
  breadcrumbs={[
    { href: "/", label: "Home" },
    { href: "/editions", label: "Editions" },
    { label: edition ? `Issue ${edition.issueNumber}` : "Loading..." },
  ]}
/>

{#if loading}
  <PageContainer>
    <LoadingState message="Loading edition..." />
  </PageContainer>
{:else if error}
  <PageContainer>
    <div class="alert">{error}</div>
    <div class="actions">
      <Button variant="secondary" href="/editions">Back to Editions</Button>
    </div>
  </PageContainer>
{:else if edition}
  <PageContainer>
    <div class="edition-header">
      <h1>Issue {edition.issueNumber}</h1>
      <p>Published {formatDate(edition.publishedAt)}</p>
      <div class="actions">
        <Button variant="secondary" href="/editions">Back to Editions</Button>
        <Button variant="secondary" href="/editions/{edition.id}/edit">
          Edit
        </Button>
        <Button
          variant="primary"
          onclick={generatePDF}
          disabled={generating}
        >
          {generating ? "Generating..." : "Generate PDF"}
        </Button>
        <Button
          variant="danger"
          onclick={deleteEdition}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>

    {#if edition.coverImage}
      <div class="content-section">
        <h2>Cover Image</h2>
        <div class="cover-image">
          <img src="/api/images/{edition.coverImage.id}/file" alt="Cover" />
          {#if edition.coverImage.caption}
            <div class="image-caption">{edition.coverImage.caption}</div>
          {/if}
          {#if edition.coverImage.authors}
            <div class="image-credit">
              Photo by {edition.coverImage.authors}
            </div>
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
              <h3><a href="/articles/{article.id}">{article.hed}</a></h3>
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
              <h3><a href="/poems/{poem.id}">{poem.title}</a></h3>
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

    {#if edition.images && edition.images.length > 0}
      <div class="content-section">
        <h2>Images ({edition.images.length})</h2>
        <div class="images-grid">
          {#each edition.images as image}
            <div class="image-item">
              <img
                src="/api/images/{image.id}/file"
                alt={image.caption || image.filename}
              />
              <div class="image-info">
                <div class="image-filename">{image.filename}</div>
                <div class="image-type">{image.usageType}</div>
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
      </div>
    {/if}
  </PageContainer>
{/if}

<style>
  .alert {
    padding: var(--unit);
    margin-bottom: calc(var(--unit) * 2);
    font-family: var(--font-body);
    font-weight: 500;
    background-color: var(--color-warn);
    color: var(--color-bg);
    text-align: center;
  }

  .edition-header {
    text-align: center;
    margin-bottom: calc(var(--unit) * 3);
    padding: calc(var(--unit) * 2);
    background-color: #f8f9fa;
    border: 1px solid var(--color-fg);
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
    margin: 0 0 calc(var(--unit) * 1.5) 0;
    opacity: 0.6;
  }

  .actions {
    display: flex;
    gap: var(--unit);
    justify-content: center;
    flex-wrap: wrap;
  }

  .content-section {
    margin-bottom: calc(var(--unit) * 3);
    padding: calc(var(--unit) * 1.5);
    border: 1px solid var(--color-fg);
    background-color: var(--color-bg);
  }

  .content-section h2 {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.25);
    font-weight: 700;
    margin: 0 0 calc(var(--unit) * 1.5) 0;
    color: var(--color-fg);
  }

  .cover-image {
    text-align: center;
  }

  .cover-image img {
    max-width: 400px;
    height: auto;
    border: 1px solid var(--color-fg);
  }

  .content-list {
    display: flex;
    flex-direction: column;
    gap: calc(var(--unit) * 1.5);
  }

  .content-item {
    padding: calc(var(--unit) * 1);
    border: 1px solid var(--color-fg);
    background-color: #f8f9fa;
  }

  .content-item h3 {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.1);
    font-weight: 700;
    margin: 0 0 calc(var(--unit) * 0.5) 0;
  }

  .content-item h3 a {
    color: var(--color-off);
    text-decoration: none;
  }

  .content-item h3 a:hover {
    text-decoration: underline;
  }

  .content-dek {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.9);
    opacity: 0.6;
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
    opacity: 0.6;
    font-style: italic;
    text-align: center;
    padding: calc(var(--unit) * 2);
  }

  .images-grid {
    display: grid;
    gap: calc(var(--unit) * 1.5);
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .image-item {
    border: 1px solid var(--color-fg);
    overflow: hidden;
    background-color: var(--color-bg);
  }

  .image-item img {
    width: 100%;
    height: 200px;
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
    font-size: calc(var(--unit) * 0.75);
    color: var(--color-off);
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: calc(var(--unit) * 0.5);
  }

  .image-caption,
  .image-credit {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.8);
    opacity: 0.6;
    margin-bottom: calc(var(--unit) * 0.25);
  }

  .image-caption {
    font-style: italic;
  }
</style>
