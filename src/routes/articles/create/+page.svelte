<script>
  import { goto } from "$app/navigation";
  import ArticleForm from "$lib/components/ArticleForm.svelte";
  import Header from "$lib/components/Header.svelte";

  let isSubmitting = $state(false);
  let submitMessage = $state("");
  let submitError = $state("");

  async function handleSubmit(articleData) {
    isSubmitting = true;
    submitError = "";
    submitMessage = "";

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (response.ok) {
        submitMessage = "Article created successfully!";
        setTimeout(() => {
          goto("/articles");
        }, 1500);
      } else {
        submitError = result.error || "Failed to create article";
      }
    } catch (error) {
      console.error("Error creating article:", error);
      submitError = "Network error. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Create Article - The Daily Pilgrim</title>
</svelte:head>

<Header
  breadcrumbs={[
    { href: "/", label: "Home" },
    { href: "/articles", label: "Articles" },
    { label: "create" },
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

  <ArticleForm onSubmit={handleSubmit} {isSubmitting} />
</div>

<style>
  .main-content {
    margin: 0 auto;
    max-width: 800px;
    padding: var(--unit);
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
