<script>
  import { onMount } from "svelte";

  import Header from "$lib/components/Header.svelte";
  import ImageCard from "$lib/components/ImageCard.svelte";
  import Button from '$lib/components/base/Button.svelte';
  import LoadingState from '$lib/components/base/LoadingState.svelte';
  import EmptyState from '$lib/components/base/EmptyState.svelte';
  import PageContainer from '$lib/components/base/PageContainer.svelte';

  let images = $state([]);
  let isLoading = $state(false);
  let message = $state("");

  onMount(async () => {
    await loadImages();
  });

  async function loadImages() {
    isLoading = true;
    try {
      const response = await fetch("/api/images");
      const data = await response.json();
      if (response.ok) {
        images = data;
      } else {
        message = data.error || "Failed to load images";
      }
    } catch (error) {
      console.error("Error loading images:", error);
      message = "Failed to load images";
    } finally {
      isLoading = false;
    }
  }

  function getImageTypeLabel(type) {
    const types = {
      background: "Background (9:16)",
      title: "Title (16:9)",
      inline: "Inline",
    };
    return types[type] || type;
  }

  function getImageUrl(image) {
    // Show processed version if available and processing is completed
    if (image.is_processed && image.processing_status === "completed") {
      return `/api/images/${image.id}/file`; // This will automatically serve processed version
    }
    return `/api/images/${image.id}/file?original=true`; // Force original for unprocessed images
  }

  function getImagePlaceholder(image) {
    return `data:image/svg+xml;base64,${btoa(`
            <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="150" fill="#f3f4f6"/>
                <text x="100" y="75" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="#6b7280">
                    ${image.filename}
                </text>
            </svg>
        `)}`;
  }

  function handleImageError(event, image) {
    // Fallback to placeholder if image fails to load
    event.target.src = getImagePlaceholder(image);
  }

  function getProcessingStatusLabel(status) {
    const labels = {
      pending: "Pending",
      processing: "Processing",
      completed: "Processed",
      failed: "Failed",
    };
    return labels[status] || status;
  }

  function getProcessingStatusClass(status) {
    const classes = {
      pending: "status-pending",
      processing: "status-processing",
      completed: "status-completed",
      failed: "status-failed",
    };
    return classes[status] || "status-unknown";
  }
</script>

<svelte:head>
  <title>Images - The Daily Pilgrim</title>
</svelte:head>

<Header breadcrumbs={[{ href: "/", label: "Home" }, { label: "Images" }]} />

{#if isLoading}
  <PageContainer>
    <LoadingState message="Loading images..." />
  </PageContainer>
{:else}
  <PageContainer>
    <div class="header-actions">
      <Button variant="primary" href="/images/upload">Upload Image</Button>
    </div>

    {#if message}
      <div class="alert">{message}</div>
    {/if}

    {#if images.length === 0}
      <EmptyState
        message="No images found."
        actionText="Upload the first image"
        actionHref="/images/upload"
      />
    {:else}
      <div class="card-grid">
        {#each images as image}
          <ImageCard {image} />
        {/each}
      </div>
    {/if}
  </PageContainer>
{/if}

<style>
  .header-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: calc(var(--unit) * 2);
  }

  .card-grid {
    display: grid;
    gap: calc(var(--unit) * 2);
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
</style>
