<script>
  let {
    variant = 'primary',
    href = null,
    type = 'button',
    onclick = null,
    disabled = false,
    children
  } = $props();

  const Tag = href ? 'a' : 'button';
</script>

<svelte:element
  this={Tag}
  class="btn btn-{variant}"
  {href}
  {type}
  {onclick}
  {disabled}
>
  {@render children?.()}
</svelte:element>

<style>
  .btn {
    border: none;
    border-radius: 0;
    box-sizing: border-box;
    cursor: pointer;
    display: inline-block;
    font-family: var(--font-hed);
    font-size: var(--unit);
    font-weight: 400;
    line-height: 1;
    opacity: 0.5;
    padding: calc(var(--unit) * 0.5);
    text-decoration: none;
    transition: opacity 0.2s;
    text-align: center;
  }

  .btn:hover {
    opacity: 1;
  }

  .btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: var(--color-off);
    color: var(--color-bg);
  }

  .btn-secondary {
    background-color: var(--color-bg);
    border: 1px solid var(--color-fg);
    color: var(--color-fg);
  }

  .btn-danger {
    background-color: var(--color-warn);
    color: white;
  }
</style>