<script>
  let { breadcrumbs = [] } = $props();
</script>

<header class="page-header">
  <div class="header-content">
    <h1 class="site-title">THE DAILY PILGRIM</h1>

    {#if breadcrumbs.length > 0}
      <nav class="breadcrumb">
        {#each breadcrumbs as crumb, index}
          {#if index > 0}
            <span>→</span>
          {/if}
          {#if crumb.href}
            <a href={crumb.href}>{crumb.label}</a>
          {:else}
            <span>{crumb.label}</span>
          {/if}
        {/each}
      </nav>
    {/if}
  </div>
</header>

<style>
  .page-header {
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-fg);
    padding: calc(var(--unit) * 2);
    margin-bottom: calc(var(--unit) * 2);
  }

  .header-content {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--unit);
  }

  .site-title {
    font-family: var(--font-masthead);
    font-size: calc(var(--unit) * 2.5);
    font-weight: 400;
    margin: 0;
    color: var(--color-fg);
    text-align: center;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--unit) * 0.5);
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.875);
    color: var(--color-fg);
    opacity: 0.6;
  }

  .breadcrumb a {
    color: var(--color-off);
    text-decoration: none;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }
</style>