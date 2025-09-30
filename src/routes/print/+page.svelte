<script>
  import { oxford } from "$lib/util.js";

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

  {#each orderedContent as item}
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
