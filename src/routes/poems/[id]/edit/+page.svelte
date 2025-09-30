<script>
  import { goto } from "$app/navigation";
  import PoemForm from "$lib/components/PoemForm.svelte";
  import Header from "$lib/components/Header.svelte";
  import PageContainer from "$lib/components/base/PageContainer.svelte";

  let { data } = $props();

  let isSubmitting = $state(false);
  let submitMessage = $state("");
  let submitError = $state("");

  async function handleSubmit(poemData) {
    isSubmitting = true;
    submitError = "";
    submitMessage = "";

    try {
      const response = await fetch(`/api/poems/${data.poemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(poemData),
      });

      const result = await response.json();

      if (response.ok) {
        submitMessage = "Poem updated successfully!";
        setTimeout(() => {
          goto(`/poems/${data.poemId}`);
        }, 1500);
      } else {
        submitError = result.error || "Failed to update poem";
      }
    } catch (error) {
      console.error("Error updating poem:", error);
      submitError = "Network error. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title
    >Edit Poem: {data.poem ? data.poem.title : "Loading..."} - The Daily Pilgrim</title
  >
</svelte:head>

<Header
  breadcrumbs={[
    { href: "/", label: "Home" },
    { href: "/poems", label: "Poems" },
    { href: `/poems/${data.poemId}`, label: data.poem?.title || "Loading..." },
    { label: "Edit" },
  ]}
/>

<PageContainer>
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

  <PoemForm
    onSubmit={handleSubmit}
    {isSubmitting}
    initialData={data.poem}
    mode="edit"
  />
</PageContainer>

<style>
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