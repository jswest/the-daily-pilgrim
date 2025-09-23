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
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .header-content {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .site-title {
    font-family: var(--font-masthead);
    font-size: 2.5rem;
    font-weight: 400;
    margin: 0;
    color: var(--color-fg);
    text-align: center;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .breadcrumb a {
    color: #3b82f6;
    text-decoration: none;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }
</style>