<script>
  import Header from "$lib/components/Header.svelte";
</script>

<Header />

<div class="dashboard">
  <div class="card-grid">
    <div class="card">
      <h2>Articles</h2>
      <div class="card-actions">
        <a href="/articles/create" class="btn btn-primary">Create Article</a>
        <a href="/articles" class="btn btn-secondary">View All</a>
      </div>
    </div>

    <div class="card">
      <h2>Authors</h2>
      <div class="card-actions">
        <a href="/authors" class="btn btn-primary">Manage Authors</a>
      </div>
    </div>

    <div class="card">
      <h2>Poems</h2>
      <div class="card-actions">
        <a href="/poems/create" class="btn btn-primary">Create Poem</a>
        <a href="/poems" class="btn btn-secondary">View All</a>
      </div>
    </div>

    <div class="card">
      <h2>Images</h2>
      <div class="card-actions">
        <a href="/images/upload" class="btn btn-primary">Upload Images</a>
        <a href="/images" class="btn btn-secondary">View All</a>
      </div>
    </div>

    <div class="card">
      <h2>Editions</h2>
      <div class="card-actions">
        <a href="/editions/create" class="btn btn-primary">Create Edition</a>
        <a href="/editions" class="btn btn-secondary">View All</a>
      </div>
    </div>

    <div class="card">
      <h2>Processing Queue</h2>
      <div class="card-actions">
        <a href="/processing" class="btn btn-primary">View Queue</a>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    margin: 0 auto;
    max-width: 1200px;
    padding: var(--unit);
  }

  .card-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .card {
    background-color: white;
    border: 1px solid var(--color-fg);
    padding: var(--unit);
  }

  .card h2 {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1);
    font-weight: 900;
    line-height: 1;
    margin: 0 0 var(--unit) 0;
  }
  .card-actions {
    display: flex;
    gap: var(--unit);
    flex-wrap: wrap;
  }
</style>
