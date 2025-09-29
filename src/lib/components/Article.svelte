<script>
  import { marked } from "marked";

  import { oxford } from "$lib/util.js";

  let { article } = $props();

  console.log(article.titleImage);
</script>

<article class="article-content">
  <div class="article-header">
    <h3>Article</h3>
    <h1 class="article-hed">{article.hed}</h1>
    {#if article.dek}
      <p class="article-dek">{article.dek}</p>
    {/if}

    {#if article.titleImage}
      <figure>
        <img
          src="/api/images/{article.titleImage.id}/file"
          alt={article.titleImage.caption || article.titleImage.filename}
          class="title-img"
        />
        <figcaption>
          {article.titleImage.caption}
          {#if article.titleImage.authors}
            — by {oxford(article.titleImage.authors.map((au) => au.name))}
          {/if}
        </figcaption>
      </figure>
    {/if}

    {#if article.authors && article.authors.length > 0}
      <p class="authors">
        <span class="label">By</span>
        {oxford(article.authors.map((a) => a.name))}
      </p>
    {:else if article.authors}
      <p class="authors">
        <span class="label">By</span>
        {article.authors}
      </p>
    {/if}
  </div>

  <div class="article-body">
    {@html marked(article.body)}
  </div>
</article>

<style>
  .article-content {
    background: white;
    overflow: hidden;
    width: 400px;
  }

  figure {
    margin: 0;
    margin-bottom: calc(var(--unit) * 2);
    padding: 0;
    width: 400px;
  }

  figcaption {
    font-family: var(--font-body);
    font-size: var(--unit);
    font-style: italic;
    font-weight: 100;
    padding: 0 var(--unit);
  }

  .title-img {
    display: block;
    height: calc(400px * 9 / 16);
    object-fit: cover;
    width: 400px;
  }

  h1.article-hed {
    color: #111827;
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 3);
    font-weight: 900;
    line-height: 1;
    margin: var(--unit) 0 calc(var(--unit) * 1.5) 0;
    padding: 0 var(--unit);
    text-align: left;
    transform-origin: 0 0;
    transform: scaleX(75%);
    width: calc((400px - var(--unit) - var(--unit)) / 0.75);
  }

  .article-dek {
    font-size: calc(var(--unit) * 1.5);
    font-weight: 100;
    line-height: calc(var(--unit) * 1.5);
    margin: 0 0 calc(var(--unit) * 1.5) 0;
    padding: 0 var(--unit);
    transform-origin: 0 0;
    transform: scaleX(75%);
    width: calc((400px - var(--unit) - var(--unit)) / 0.75);
  }

  .article-body {
    padding: 0 var(--unit);
  }
</style>
