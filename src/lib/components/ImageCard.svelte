<script>
  import { oxford } from "$lib/util";

  const { image } = $props();

  console.log(image)
</script>

<div class="ImageCard">
  <figure>
    <img
      src="/api/images/{image.id}/file"
      alt={image.caption || image.filename}
    />
  </figure>
  <div class="guts">
    <div class="details">
      <p><em>{image.caption}</em></p>
      {#if image.author}
        <p>{image.author}</p>
      {/if}
    </div>
    <div class="meta">
      <p>Image type: <span class="detail">{image.imageType}</span></p>
      <p>
        Processing status: <span class="detail">{image.processingStatus}</span>
      </p>
    </div>
    <div class="card-actions">
      <a href="/images/{image.id}" class="btn btn-primary">View</a>
      <a href="/images/{image.id}/edit" class="btn btn-secondary">Edit</a>
    </div>
  </div>
</div>

<style>
  .ImageCard {
    border: 1px solid black;
    width: 400px;
  }
  figure {
    height: calc(400px * 9 / 16);
    margin: 0;
    width: 400px;
  }
  figure img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
  .guts {
    padding: var(--unit);
  }
  .detail {
    font-weight: 900;
  }
</style>
