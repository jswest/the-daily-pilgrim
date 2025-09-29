<script>
  let { children, columns = "auto-fit", minWidth = "300px" } = $props();
</script>

<div class="card-grid" style:--min-width={minWidth}>
  {@render children?.()}
</div>

<style>
  .card-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(var(--min-width), 1fr));
  }
</style>