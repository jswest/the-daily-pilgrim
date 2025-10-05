<script>
  import Autocomplete from "./Autocomplete.svelte";
  import Button from "./base/Button.svelte";
  import ImageSelector from "./ImageSelector.svelte";

  let {
    onSubmit = () => {},
    isSubmitting = false,
    initialData = null,
    mode = "create", // 'create' or 'edit'
  } = $props();

  let formData = $state({
    hed: initialData?.hed || "",
    dek: initialData?.dek || "",
    body: initialData?.body || "",
    url: initialData?.url || "",
  });

  let selectedAuthors = $state(initialData?.authors || []);
  let selectedImageId = $state(initialData?.title_image_id || null);
  let selectedSourcePublication = $state(
    initialData?.sourcePublication ? [{ name: initialData.sourcePublication }] : []
  );
  let errors = $state({});

  function validateForm() {
    errors = {};

    if (!formData.hed.trim()) {
      errors.hed = "Headline is required";
    }

    if (!formData.body.trim()) {
      errors.body = "Body is required";
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const articleData = {
      ...formData,
      authorIds: selectedAuthors.map((author) => author.id),
      title_image_id: selectedImageId,
      sourcePublication: selectedSourcePublication[0]?.name || null,
    };

    try {
      await onSubmit(articleData);
    } catch (error) {
      console.error("Error submitting article:", error);
    }
  }

  function resetForm() {
    formData = {
      hed: initialData?.hed || "",
      dek: initialData?.dek || "",
      body: initialData?.body || "",
      url: initialData?.url || "",
    };
    selectedAuthors = initialData?.authors || [];
    selectedImageId = initialData?.title_image_id || null;
    selectedSourcePublication = initialData?.sourcePublication
      ? [{ name: initialData.sourcePublication }]
      : [];
    errors = {};
  }

  function handleImageSelect(image) {
    selectedImageId = image ? image.id : null;
  }

  // Export reset function for parent component
  export function reset() {
    resetForm();
  }
</script>

<form onsubmit={handleSubmit} class="article-form">
  <div class="form-group">
    <label for="hed" class="form-label">Headline</label>
    <input
      id="hed"
      type="text"
      bind:value={formData.hed}
      placeholder="Enter article headline"
      class="form-input"
      class:error={errors.hed}
      disabled={isSubmitting}
    />
    {#if errors.hed}
      <span class="error-message">{errors.hed}</span>
    {/if}
  </div>

  <div class="form-group">
    <label for="dek" class="form-label">Deck (subtitle)</label>
    <input
      id="dek"
      type="text"
      bind:value={formData.dek}
      placeholder="Enter article subtitle or summary"
      class="form-input"
      disabled={isSubmitting}
    />
  </div>

  <div class="form-group">
    <label for="authors" class="form-label">Authors</label>
    <Autocomplete
      bind:selectedItems={selectedAuthors}
      placeholder="Search for authors..."
      apiEndpoint="/api/authors"
      displayKey="name"
      valueKey="id"
      multiple={true}
    />
  </div>

  <ImageSelector
    bind:selectedImageId
    onImageSelect={handleImageSelect}
    imageType="title"
  />

  <div class="form-group">
    <label for="url" class="form-label">URL (optional)</label>
    <input
      id="url"
      type="text"
      bind:value={formData.url}
      placeholder="https://example.com/article"
      class="form-input"
      disabled={isSubmitting}
    />
  </div>

  <div class="form-group">
    <label for="source-publication" class="form-label">Source Publication (optional)</label>
    <Autocomplete
      bind:selectedItems={selectedSourcePublication}
      placeholder="Search for source publication..."
      apiEndpoint="/api/source-publications"
      displayKey="name"
      valueKey="name"
      multiple={false}
      allowCreate={false}
    />
  </div>

  <div class="form-group">
    <label for="body" class="form-label">Body</label>
    <textarea
      id="body"
      bind:value={formData.body}
      placeholder="Enter article content..."
      rows="12"
      class="form-textarea"
      class:error={errors.body}
      disabled={isSubmitting}
    ></textarea>
    {#if errors.body}
      <span class="error-message">{errors.body}</span>
    {/if}
  </div>

  <div class="form-actions">
    <Button type="button" disabled={isSubmitting} onclick={resetForm} variant="secondary">
      Reset
    </Button>
    <Button type="submit" disabled={isSubmitting} variant="primary">
      {#if isSubmitting}
        {mode === "edit" ? "Updating..." : "Creating..."}
      {:else}
        {mode === "edit" ? "Update Article" : "Create Article"}
      {/if}
    </Button>
  </div>
</form>

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

  .article-form {
    background-color: white;
    border: 1px solid var(--color-fg);
    padding: calc(var(--unit) * 2);
    max-width: 800px;
    margin: 0 auto;
  }

  .form-group {
    margin-bottom: calc(var(--unit) * 1.5);
  }

  .form-label {
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
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--color-off);
    box-shadow: 0 0 0 1px var(--color-off);
  }

  .form-input.error,
  .form-textarea.error {
    border-color: var(--color-warn);
  }

  .form-textarea {
    resize: vertical;
    min-height: calc(var(--unit) * 12);
    line-height: 1.5;
  }

  .error-message {
    display: block;
    margin-top: calc(var(--unit) * 0.25);
    color: var(--color-warn);
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.875);
  }

  .form-actions {
    display: flex;
    gap: var(--unit);
    justify-content: flex-end;
    margin-top: calc(var(--unit) * 2);
  }

  /* Button styles are inherited from global styles */
</style>
