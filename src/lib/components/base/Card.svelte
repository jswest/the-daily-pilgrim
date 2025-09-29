<script>
  let { children } = $props();
</script>

<article class="card">
  {@render children?.()}
</article>

<style>
  .card {
    background-color: white;
    border: 1px solid var(--color-fg);
    padding: var(--unit);
  }
</style>