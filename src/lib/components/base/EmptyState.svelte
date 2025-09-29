<script>
  let {
    message,
    actionText = null,
    actionHref = null,
    children
  } = $props();
</script>

<div class="empty-state">
  <p>{message}</p>
  {#if actionText && actionHref}
    <a href={actionHref} class="btn btn-primary">{actionText}</a>
  {/if}
  {@render children?.()}
</div>

<style>
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

  .btn-primary {
    background-color: var(--color-off);
    color: var(--color-bg);
  }
</style>