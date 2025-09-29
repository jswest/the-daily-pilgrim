<script>
  let { children } = $props();
</script>

<div class="main-content">
  {@render children?.()}
</div>

<style>
  .main-content {
    margin: 0 auto;
    max-width: 1200px;
    padding: var(--unit);
  }
</style>