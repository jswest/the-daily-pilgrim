<script>
  import { marked } from "marked";
  import Header from "$lib/components/Header.svelte";
  import Article from "$lib/components/Article.svelte";
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
      <a href="/articles/{article.id}/edit" class="btn btn-secondary"
        >Edit</a
      >
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
    background: #f9fafb;
  }

  .page-actions {
    max-width: 800px;
    margin: 0 auto 2rem auto;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 0 2rem;
  }

  .alert {
    max-width: 800px;
    margin: 0 auto 2rem auto;
    padding: 1rem;
    border-radius: 0.375rem;
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
    text-align: center;
  }

  .back-link {
    display: inline-block;
    margin-top: 0.5rem;
    color: #3b82f6;
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
