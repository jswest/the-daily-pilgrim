<script>
  import { oxford } from "$lib/util.js";
  import { marked } from "marked";

  import Article from "$lib/components/Article.svelte";
  import Poem from "$lib/components/Poem.svelte";

  let { data } = $props();
  let edition = $state(data.edition);

  // Merge all content and sort by orderPosition
  let orderedContent = $derived.by(() => {
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

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
</script>

<svelte:head>
  <title
    >The Daily Pilgrim - Issue {edition.issue_number ||
      edition.issueNumber}</title
  >
</svelte:head>

<!-- Cover Page -->
<div class="edition">
  <div class="cover-page">
    <div class="cover-content">
      <h1 class="masthead">THE DAILY PILGRIM.</h1>
      <p class="issue-meta">
        <b>Issue {edition.issueNumber}.</b>
        {formatDate(edition.publishedAt)}.
      </p>
    </div>
    {#if edition.coverImage}
      <div class="cover-image">
        <img src="/api/images/{edition.coverImage.id}/file" alt="Cover" />
      </div>
    {/if}
  </div>

  <!-- Table of Contents -->
  <div class="toc-page">
    <h2 class="toc-heading">Contents</h2>
    <div class="toc-list">
      {#each orderedContent as item}
        <div class="toc-item">
          {#if item.type === 'article'}
            <h3 class="toc-hed">{item.data.hed}</h3>
            {#if item.data.dek}
              <p class="toc-dek">{item.data.dek}</p>
            {/if}
            {#if item.data.authors && item.data.authors.length > 0}
              <p class="toc-byline">By {oxford(item.data.authors.map(a => a.name))}</p>
            {/if}
            {#if item.data.sourcePublication}
              <p class="toc-source">{item.data.sourcePublication}</p>
            {/if}
          {:else if item.type === 'poem'}
            <h3 class="toc-hed">{item.data.title}</h3>
            <p class="toc-type">Poem</p>
            {#if item.data.authors && item.data.authors.length > 0}
              <p class="toc-byline">By {oxford(item.data.authors.map(a => a.name))}</p>
            {/if}
          {:else if item.type === 'image'}
            <h3 class="toc-hed">{item.data.caption || item.data.filename}</h3>
            <p class="toc-type">Image</p>
            {#if item.data.authors && item.data.authors.length > 0}
              <p class="toc-byline">By {oxford(item.data.authors.map(a => a.name))}</p>
            {/if}
          {/if}
          {#if item.data.note}
            <p class="toc-note-title">+ {item.data.note.title}</p>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  {#each orderedContent as item}
    <!-- Render note before content if present -->
    {#if item.data.note}
      <div class="note-wrapper">
        <article class="note">
          <h3 class="note-label">Editor's Note</h3>
          <h2 class="note-title">{item.data.note.title}</h2>
          <div class="note-body">
            {@html marked(item.data.note.body)}
          </div>
        </article>
      </div>
    {/if}

    <!-- Render content -->
    {#if item.type === 'article'}
      <div class="article-wrapper">
        <Article article={item.data} />
      </div>
    {:else if item.type === 'poem'}
      <div class="poem-wrapper">
        <Poem poem={item.data} />
      </div>
    {:else if item.type === 'image'}
      <div class="image-wrapper">
        <img src="/api/images/{item.data.id}/file" alt={item.data.caption || ''} />
        {#if item.data.caption}
          <p class="image-caption">{item.data.caption}</p>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  /* Page setup for 9:16 aspect ratio (90mm x 160mm) */
  @page {
    size: 400px calc(400px * 16 / 9);
    margin: 0;
    background: white;
  }
  .edition {
    margin: 0 auto;
    width: 400px;
  }

  .cover-page {
    background: var(--color-fg);
    page-break-after: always;
    height: calc(400px * 16 / 9);
    page-break-inside: avoid;
    position: relative;
    text-align: center;
    width: 400px;
  }
  .cover-content {
    background-color: var(--color-bg);
    box-sizing: border-box;
    color: var(--color-fg);
    height: calc(var(--unit) * 6);
    padding: var(--unit);
    position: absolute;
    top: 25%;
    transform: translateY(-50%);
    width: 100%;
    z-index: 10;
  }
  .masthead {
    font-family: var(--font-masthead);
    font-size: calc(var(--unit) * 2);
    font-weight: 900;
    line-height: 1;
    margin: 0 0 var(--unit) 0;
    transform: scaleX(75%);
    transform-origin: 50% 50%;
  }
  .issue-meta {
    font-family: var(--font-masthead);
    font-size: calc(var(--unit) * 0.75);
    letter-spacing: calc(var(--unit) * 0.1);
    text-transform: uppercase;
  }
  .cover-image {
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 5;
  }

  .cover-image img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }

  .toc-page {
    page-break-after: always;
    page-break-inside: avoid;
    padding: calc(var(--unit) * 2);
    width: 400px;
    box-sizing: border-box;
  }

  .toc-heading {
    font-family: var(--font-masthead);
    font-size: calc(var(--unit) * 1.5);
    font-weight: 900;
    text-transform: uppercase;
    text-align: center;
    margin: 0 0 calc(var(--unit) * 2) 0;
    letter-spacing: calc(var(--unit) * 0.1);
  }

  .toc-list {
    display: flex;
    flex-direction: column;
    gap: calc(var(--unit) * 1.5);
  }

  .toc-item {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: calc(var(--unit) * 1);
  }

  .toc-item:last-child {
    border-bottom: none;
  }

  .toc-hed {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.125);
    font-weight: 700;
    margin: 0 0 calc(var(--unit) * 0.5) 0;
    line-height: 1.2;
  }

  .toc-dek {
    font-family: var(--font-dek);
    font-size: calc(var(--unit) * 0.875);
    margin: 0 0 calc(var(--unit) * 0.5) 0;
    line-height: 1.4;
    opacity: 0.8;
  }

  .toc-type {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.75);
    text-transform: uppercase;
    letter-spacing: calc(var(--unit) * 0.05);
    font-weight: 600;
    margin: 0 0 calc(var(--unit) * 0.5) 0;
    opacity: 0.6;
  }

  .toc-byline {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.75);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: calc(var(--unit) * 0.05);
    margin: 0;
    opacity: 0.7;
  }

  .toc-source {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.75);
    font-style: italic;
    margin: calc(var(--unit) * 0.25) 0 0 0;
    opacity: 0.6;
  }

  .toc-note-title {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.75);
    font-style: italic;
    margin: calc(var(--unit) * 0.5) 0 0 0;
    opacity: 0.7;
  }

  .note-wrapper {
    break-after: page;
  }

  .note {
    padding: calc(var(--unit));
    box-sizing: border-box;
  }

  .note-label {
    font-family: var(--font-masthead);
    font-size: calc(var(--unit) * 0.75);
    letter-spacing: calc(var(--unit) * 0.1);
    text-align: center;
    text-transform: uppercase;
    margin: 0 0 calc(var(--unit) * 1) 0;
    opacity: 0.7;
  }

  .note-title {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.5);
    font-weight: 700;
    line-height: 1.2;
    text-align: left;
    margin: 0 0 calc(var(--unit) * 2) 0;
  }

  .note-body {
    font-family: var(--font-body);
    font-size: var(--unit);
    font-weight: 500;
    line-height: 1.5;
  }

  .note-body :global(p) {
    margin-bottom: calc(var(--unit) * 1.5);
  }

  .note-body :global(h2) {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 1.5);
    font-weight: 900;
    line-height: 1;
    margin-bottom: calc(var(--unit) * 1.5);
    text-align: center;
  }

  .note-body :global(blockquote) {
    border-left: calc(var(--unit) * 0.25) solid black;
    margin-left: var(--unit);
    padding-left: var(--unit);
  }

  .article-wrapper,
  .poem-wrapper,
  .image-wrapper {
    break-after: page;
  }

  .image-wrapper {
    page-break-inside: avoid;
    text-align: center;
    padding: calc(var(--unit) * 2);
  }

  .image-wrapper img {
    max-width: 100%;
    max-height: calc((400px * 16 / 9) - var(--unit) * 4);
    object-fit: contain;
  }

  .image-caption {
    margin-top: calc(var(--unit) * 0.5);
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.875);
    font-style: italic;
    color: #666;
  }

  @media print {
    :global(body) {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
