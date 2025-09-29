<script>
  import { marked } from "marked";
  import Header from "$lib/components/Header.svelte";
  import Article from "$lib/components/Article.svelte";
  import Button from "$lib/components/base/Button.svelte";
  import { goto } from "$app/navigation";
  import { oxford } from "$lib/util.js";

  let { data } = $props();

  let article = $state(data.article);
  let error = $state(data.error || "");
  let articleId = $state(data.articleId);

  async function deleteArticle() {
    if (!confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        goto("/articles");
      } else {
        error = "Failed to delete article";
      }
    } catch (err) {
      console.error("Error deleting article:", err);
      error = "Network error. Please try again.";
    }
  }
</script>

<svelte:head>
  <title>{article ? article.hed : "Article"} - The Daily Pilgrim</title>
</svelte:head>

<Header
  breadcrumbs={[
    { href: "/", label: "Home" },
    { href: "/articles", label: "Articles" },
    { label: article ? article.hed : "Loading..." }
  ]}
/>

<div class="page-container">
  {#if article}
    <div class="page-actions">
      <Button variant="secondary" href="/articles/{article.id}/edit">Edit</Button>
      <button onclick={deleteArticle} class="btn btn-danger">Delete</button>
    </div>
  {/if}

  <main>
    {#if error}
      <div class="alert alert-error">
        {error}
        <a href="/articles" class="back-link">← Back to Articles</a>
      </div>
    {:else if article}
      <Article {article} />
    {/if}
  </main>
</div>

<style>
  .page-container {
    min-height: 100vh;
    background-color: var(--color-bg);
  }

  .page-actions {
    max-width: 800px;
    margin: 0 auto calc(var(--unit) * 2) auto;
    display: flex;
    justify-content: flex-end;
    gap: var(--unit);
    padding: 0 calc(var(--unit) * 2);
  }

  .btn-danger {
    background-color: #dc2626;
    color: var(--color-bg);
    border: none;
    padding: calc(var(--unit) * 0.5) var(--unit);
    font-family: var(--font-hed);
    font-size: var(--unit);
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .btn-danger:hover {
    opacity: 1;
  }

  .alert {
    max-width: 800px;
    margin: 0 auto calc(var(--unit) * 2) auto;
    padding: var(--unit);
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
    text-align: center;
  }

  .back-link {
    display: inline-block;
    margin-top: calc(var(--unit) * 0.5);
    color: var(--color-off);
    text-decoration: none;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  main {
    max-width: 400px;
    margin: 0 auto;
    padding: 0 2rem 3rem 2rem;
  }

  .article-content {
    background: white;
    border: 1px solid var(--color-fg);
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
  .authors {
    font-family: var(--font-hed);
    font-size: var(--unit);
    font-weight: 900;
    padding: 0 var(--unit);
  }
  .article-body {
    padding: 0 var(--unit);
  }
</style>
