<script>
  import { oxford } from "$lib/util.js";

  import Article from "$lib/components/Article.svelte";
  import Poem from "$lib/components/Poem.svelte";

  let { data } = $props();
  let edition = $state(data.edition);

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

  {#if edition.articles && edition.articles.length > 0}
    {#each edition.articles as article}
      <div class="article-wrapper">
        <Article {article} />
      </div>
    {/each}
  {/if}

  {#if edition.poems && edition.poems.length > 0}
    {#each edition.poems as poem}
      <div class="poem-wrapper">
        <Poem {poem} />
      </div>
    {/each}
  {/if}
</div>

<style>
  /* CSS Reset and variables for print */
  :global(body) {
    margin: 0;
    padding: 0;
    background: white;
    color: black;
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
  .poem-wrapper {
    break-after: page;
  }

  @media print {
    :global(body) {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
