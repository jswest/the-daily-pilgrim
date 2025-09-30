<script>
  import { goto } from "$app/navigation";
  import ArticleForm from "$lib/components/ArticleForm.svelte";
  import Header from "$lib/components/Header.svelte";

  let { data } = $props();

  let isSubmitting = $state(false);
  let submitMessage = $state("");
  let submitError = $state("");

  async function handleSubmit(articleData) {
    isSubmitting = true;
    submitError = "";
    submitMessage = "";

    try {
      const response = await fetch(`/api/articles/${data.articleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (response.ok) {
        submitMessage = "Article updated successfully!";
        setTimeout(() => {
          goto(`/articles/${data.articleId}`);
        }, 1500);
      } else {
        submitError = result.error || "Failed to update article";
      }
    } catch (error) {
      console.error("Error updating article:", error);
      submitError = "Network error. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title
    >Edit Article: {data.article ? data.article.hed : "Loading..."} - The Daily Pilgrim</title
  >
</svelte:head>

<Header
  breadcrumbs={[
    { href: "/", label: "Home" },
    { href: "/articles", label: "Articles" },
    { label: data?.article ? data?.article.hed : "Loading..." },
  ]}
/>

<div class="main-content">
  {#if submitMessage}
    <div class="alert success">
      {submitMessage}
    </div>
  {/if}

  {#if submitError}
    <div class="alert error">
      {submitError}
    </div>
  {/if}

  <ArticleForm
    onSubmit={handleSubmit}
    {isSubmitting}
    initialData={data.article}
    mode="edit"
  />
</div>

<style>
  :global(:root) {
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

  .hero {
    background-color: var(--color-fg);
    color: var(--color-bg);
    text-align: center;
    margin-bottom: calc(var(--unit) * 3);
    padding: var(--unit);
  }

  .hero h1 {
    font-family: var(--font-masthead);
    font-size: calc(var(--unit) * 2);
    font-weight: 600;
    line-height: 1;
    margin: 0 0 var(--unit) 0;
    text-transform: uppercase;
    transform-origin: 50% 50%;
    transform: scaleY(75%);
  }

  .hero p {
    font-family: var(--font-hed);
    font-size: var(--unit);
    font-weight: 900;
    margin: 0;
  }

  .main-content {
    margin: 0 auto;
    max-width: 800px;
    padding: var(--unit);
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: calc(var(--unit) * 0.5);
    font-family: var(--font-body);
    color: var(--color-fg);
    margin-bottom: calc(var(--unit) * 2);
  }

  .breadcrumb a {
    color: var(--color-off);
    text-decoration: none;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }

  .alert {
    padding: var(--unit);
    margin-bottom: calc(var(--unit) * 2);
    text-align: center;
    font-family: var(--font-body);
    font-weight: 600;
  }

  .alert.success {
    background-color: var(--color-off);
    color: var(--color-bg);
  }

  .alert.error {
    background-color: var(--color-warn);
    color: var(--color-bg);
  }
</style>
