<script>
  import { onMount } from "svelte";

  import Header from "$lib/components/Header.svelte";

  let authors = $state([]);
  let isLoading = $state(false);
  let showAddForm = $state(false);
  let newAuthor = $state({ name: "", bio: "" });
  let isSubmitting = $state(false);
  let message = $state("");

  onMount(async () => {
    await loadAuthors();
  });

  async function loadAuthors() {
    isLoading = true;
    try {
      const response = await fetch("/api/authors");
      const data = await response.json();
      authors = data;
    } catch (error) {
      console.error("Error loading authors:", error);
      message = "Failed to load authors";
    } finally {
      isLoading = false;
    }
  }

  async function addAuthor(event) {
    event.preventDefault();
    if (!newAuthor.name.trim()) {
      message = "Author name is required";
      return;
    }

    isSubmitting = true;
    try {
      const response = await fetch("/api/authors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAuthor),
      });

      const result = await response.json();

      if (response.ok) {
        authors = [...authors, result];
        newAuthor = { name: "", bio: "" };
        showAddForm = false;
        message = "Author added successfully!";
        setTimeout(() => (message = ""), 3000);
      } else {
        message = result.error || "Failed to add author";
      }
    } catch (error) {
      console.error("Error adding author:", error);
      message = "Network error. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }

  function cancelAdd() {
    showAddForm = false;
    newAuthor = { name: "", bio: "" };
    message = "";
  }
</script>

<svelte:head>
  <title>Authors - The Daily Pilgrim</title>
</svelte:head>

<Header breadcrumbs={[{ href: "/", label: "Home" }, { label: "Authors" }]} />

<div class="main-content">
  <div class="header-actions">
    <button
      type="button"
      onclick={() => (showAddForm = true)}
      class="btn btn-primary"
      disabled={showAddForm}
    >
      Add Author
    </button>
  </div>

  {#if message}
    <div
      class="alert"
      class:error={message.includes("Failed") || message.includes("error")}
    >
      {message}
    </div>
  {/if}
  {#if showAddForm}
    <div class="card add-form">
      <h2>Add New Author</h2>
      <form onsubmit={addAuthor}>
        <div class="form-group">
          <label for="authorName">Name</label>
          <input
            id="authorName"
            type="text"
            bind:value={newAuthor.name}
            placeholder="Enter author name"
            class="form-input"
            disabled={isSubmitting}
          />
        </div>

        <div class="form-group">
          <label for="authorBio">Bio (optional)</label>
          <textarea
            id="authorBio"
            bind:value={newAuthor.bio}
            placeholder="Enter author bio"
            rows="3"
            class="form-textarea"
            disabled={isSubmitting}
          ></textarea>
        </div>

        <div class="form-actions">
          <button
            type="button"
            onclick={cancelAdd}
            class="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Author"}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if isLoading}
    <div class="loading">Loading authors...</div>
  {:else if authors.length === 0}
    <div class="empty-state">
      <p>No authors found.</p>
      <button
        type="button"
        onclick={() => (showAddForm = true)}
        class="btn btn-primary"
      >
        Add the first author
      </button>
    </div>
  {:else}
    <div class="card-grid">
      {#each authors as author}
        <div class="card">
          <h2>{author.name}</h2>
          {#if author.bio}
            <p class="bio">{author.bio}</p>
          {/if}
          <div class="meta">
            Added {new Date(author.createdAt).toLocaleDateString()}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .main-content {
    margin: 0 auto;
    max-width: 1200px;
    padding: var(--unit);
  }

  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: calc(var(--unit) * 2);
  }

  .alert {
    background-color: var(--color-off);
    color: var(--color-bg);
    padding: var(--unit);
    margin-bottom: calc(var(--unit) * 2);
    text-align: center;
    font-family: var(--font-body);
    font-weight: 600;
  }

  .alert.error {
    background-color: var(--color-warn);
  }

  .loading {
    text-align: center;
    padding: calc(var(--unit) * 2);
    font-family: var(--font-body);
    color: var(--color-fg);
  }

  .empty-state {
    text-align: center;
    padding: calc(var(--unit) * 3);
    font-family: var(--font-body);
    color: var(--color-fg);
  }

  .empty-state p {
    margin-bottom: var(--unit);
    font-size: calc(var(--unit) * 1.125);
  }

  .card-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .card {
    background-color: white;
    border: 1px solid var(--color-fg);
    padding: var(--unit);
  }

  .card h2 {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.125);
    font-weight: 900;
    line-height: 1;
    margin: 0 0 calc(var(--unit) * 0.5) 0;
  }

  .add-form {
    margin-bottom: calc(var(--unit) * 2);
  }

  .add-form h2 {
    margin: 0 0 calc(var(--unit) * 1.5) 0;
  }

  .form-group {
    margin-bottom: var(--unit);
  }

  .form-group label {
    display: block;
    margin-bottom: calc(var(--unit) * 0.5);
    font-family: var(--font-hed);
    font-weight: 600;
    color: var(--color-fg);
  }

  .form-input,
  .form-textarea {
    width: 100%;
    padding: calc(var(--unit) * 0.75);
    border: 1px solid var(--color-fg);
    border-radius: 0;
    font-size: var(--unit);
    font-family: var(--font-body);
    box-sizing: border-box;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--color-off);
    box-shadow: 0 0 0 1px var(--color-off);
  }

  .form-textarea {
    resize: vertical;
    line-height: 1.5;
  }

  .form-actions {
    display: flex;
    gap: var(--unit);
    justify-content: flex-end;
    margin-top: calc(var(--unit) * 1.5);
  }

  .bio {
    font-family: var(--font-body);
    line-height: 1.5;
    margin: 0 0 var(--unit) 0;
    opacity: 0.8;
  }

  .meta {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.875);
    opacity: 0.6;
    margin: 0;
  }
</style>
