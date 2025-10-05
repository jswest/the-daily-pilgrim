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

  // Unified ordered content
  let orderedContent = $derived.by(() => {
    if (!edition) return [];

    const allContent = [];

    // Add articles
    (edition.articles || []).forEach((article) => {
      allContent.push({
        type: 'article',
        orderPosition: article.orderPosition,
        data: article
      });
    });

    // Add poems
    (edition.poems || []).forEach((poem) => {
      allContent.push({
        type: 'poem',
        orderPosition: poem.orderPosition,
        data: poem
      });
    });

    // Add content images
    (edition.images || []).forEach((image) => {
      if (image.usageType === 'content') {
        allContent.push({
          type: 'image',
          orderPosition: image.orderPosition,
          data: image
        });
      }
    });

    // Sort by orderPosition
    allContent.sort((a, b) => a.orderPosition - b.orderPosition);

    return allContent;
  });

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

  function formatAuthors(authors) {
    if (!authors) return '';
    if (typeof authors === 'string') return authors;
    if (Array.isArray(authors)) {
      return authors.map(a => a.name).join(', ');
    }
    return '';
  }

  function getContentIcon(type) {
    switch(type) {
      case 'article': return '📄';
      case 'poem': return '✒️';
      case 'image': return '🖼️';
      default: return '📦';
    }
  }

  function getContentTitle(item) {
    if (item.type === 'article') return item.data.hed;
    if (item.type === 'poem') return item.data.title;
    if (item.type === 'image') return item.data.filename;
    return 'Unknown';
  }

  function getContentLink(item) {
    if (item.type === 'article') return `/articles/${item.data.id}`;
    if (item.type === 'poem') return `/poems/${item.data.id}`;
    if (item.type === 'image') return `/images/${item.data.id}`;
    return '#';
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
              Photo by {formatAuthors(edition.coverImage.authors)}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <div class="content-section">
      <h2>Content ({orderedContent.length} items)</h2>
      {#if orderedContent.length > 0}
        <div class="ordered-content-list">
          {#each orderedContent as item, index}
            <div class="ordered-content-item">
              <div class="item-number">{index + 1}</div>

              <div class="item-preview">
                {#if item.type === 'image'}
                  <img
                    src="/api/images/{item.data.id}/file"
                    alt={item.data.filename}
                    class="preview-image"
                  />
                {:else}
                  <div class="preview-icon">{getContentIcon(item.type)}</div>
                {/if}
              </div>

              <div class="item-content">
                <div class="item-header">
                  <span class="item-type">{item.type}</span>
                </div>
                <h3 class="item-title">
                  <a href={getContentLink(item)}>{getContentTitle(item)}</a>
                </h3>
                {#if item.type === 'article' && item.data.dek}
                  <div class="item-dek">{item.data.dek}</div>
                {/if}
                {#if item.data.authors}
                  <div class="item-authors">by {formatAuthors(item.data.authors)}</div>
                {/if}
                {#if item.type === 'image' && item.data.caption}
                  <div class="item-caption">{item.data.caption}</div>
                {/if}
                {#if item.data.note}
                  <div class="item-note">
                    <span class="note-label">Editorial Note:</span>
                    <a href="/notes/{item.data.note.id}">{item.data.note.title}</a>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-content">No content in this edition.</p>
      {/if}
    </div>
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

  .image-caption,
  .image-credit {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.8);
    opacity: 0.6;
    margin-top: calc(var(--unit) * 0.5);
  }

  .image-caption {
    font-style: italic;
  }

  .empty-content {
    font-family: var(--font-body);
    opacity: 0.6;
    font-style: italic;
    text-align: center;
    padding: calc(var(--unit) * 2);
  }

  .ordered-content-list {
    display: flex;
    flex-direction: column;
    gap: calc(var(--unit) * 1);
  }

  .ordered-content-item {
    display: flex;
    gap: var(--unit);
    align-items: flex-start;
    padding: var(--unit);
    border: 1px solid var(--color-fg);
    background-color: #f8f9fa;
  }

  .item-number {
    font-family: var(--font-hed);
    font-weight: 900;
    font-size: calc(var(--unit) * 1.5);
    color: var(--color-off);
    min-width: calc(var(--unit) * 2.5);
    text-align: center;
    flex-shrink: 0;
  }

  .item-preview {
    width: calc(var(--unit) * 5);
    height: calc(var(--unit) * 5);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-fg);
    background-color: var(--color-bg);
  }

  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .preview-icon {
    font-size: calc(var(--unit) * 2.5);
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-header {
    margin-bottom: calc(var(--unit) * 0.25);
  }

  .item-type {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.7);
    text-transform: uppercase;
    font-weight: 700;
    color: var(--color-off);
    letter-spacing: 0.05em;
  }

  .item-title {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.1);
    font-weight: 700;
    margin: 0 0 calc(var(--unit) * 0.5) 0;
    line-height: 1.2;
  }

  .item-title a {
    color: var(--color-fg);
    text-decoration: none;
  }

  .item-title a:hover {
    color: var(--color-off);
    text-decoration: underline;
  }

  .item-dek {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.9);
    opacity: 0.7;
    margin-bottom: calc(var(--unit) * 0.5);
    line-height: 1.4;
  }

  .item-authors,
  .item-caption {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.85);
    color: var(--color-off);
    font-weight: 600;
  }

  .item-caption {
    font-style: italic;
    opacity: 0.8;
  }

  .item-note {
    margin-top: calc(var(--unit) * 0.75);
    padding: calc(var(--unit) * 0.75);
    background-color: #e8f4ff;
    border-left: calc(var(--unit) * 0.25) solid var(--color-off);
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.85);
  }

  .note-label {
    font-weight: 700;
    color: var(--color-fg);
    margin-right: calc(var(--unit) * 0.5);
  }

  .item-note a {
    color: var(--color-off);
    text-decoration: none;
    font-weight: 600;
  }

  .item-note a:hover {
    text-decoration: underline;
  }
</style>
