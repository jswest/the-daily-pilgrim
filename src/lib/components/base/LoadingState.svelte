<script>
  let { message = "Loading..." } = $props();
</script>

<div class="loading">
  {message}
</div>

<style>
  .loading {
    text-align: center;
    padding: calc(var(--unit) * 2);
    font-family: var(--font-body);
    color: var(--color-fg);
  }
</style>