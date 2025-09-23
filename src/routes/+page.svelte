<div class="hero">
  <h1>The Daily Pilgrim</h1>
  <p>Content management system for creating mobile-first magazine editions</p>
</div>

<div class="dashboard">
  <div class="card-grid">
    <div class="card">
      <h2>Articles</h2>
      <p>Create and manage articles with headlines, decks, and body content.</p>
      <div class="card-actions">
        <a href="/articles/create" class="btn btn-primary">Create Article</a>
        <a href="/articles" class="btn btn-secondary">View All</a>
      </div>
    </div>

    <div class="card">
      <h2>Authors</h2>
      <p>Manage writers, photographers, and other content contributors.</p>
      <div class="card-actions">
        <a href="/authors" class="btn btn-primary">Manage Authors</a>
      </div>
    </div>

    <div class="card">
      <h2>Poems</h2>
      <p>Add and organize poetry content for your magazine editions.</p>
      <div class="card-actions">
        <a href="/poems/create" class="btn btn-primary">Create Poem</a>
        <a href="/poems" class="btn btn-secondary">View All</a>
      </div>
    </div>

    <div class="card">
      <h2>Images</h2>
      <p>Upload and manage images with captions and author attribution.</p>
      <div class="card-actions">
        <a href="/images/upload" class="btn btn-primary">Upload Images</a>
        <a href="/images" class="btn btn-secondary">View All</a>
      </div>
    </div>

    <div class="card">
      <h2>Editions</h2>
      <p>Create magazine editions and generate PDFs from your content.</p>
      <div class="card-actions">
        <a href="/editions/create" class="btn btn-primary">Create Edition</a>
        <a href="/editions" class="btn btn-secondary">View All</a>
      </div>
    </div>

    <div class="card">
      <h2>Processing Queue</h2>
      <p>Monitor and manage image processing with 1-bit dithering.</p>
      <div class="card-actions">
        <a href="/processing" class="btn btn-primary">View Queue</a>
      </div>
    </div>
  </div>
</div>

<style>
  .hero {
    background-color: var(--color-fg);
    color: var(--color-bg);
    text-align: center;
    margin-bottom: calc(var(--unit) * 3);
    padding: var(--unit);
  }
  .hero h1 {
    font-family: var(--font-masthead);
    font-size: calc(var(--unit) * 2);
    font-weight: 600;
    line-height: 1;
    margin: 0 0 var(--unit) 0;
    text-transform: uppercase;
    transform-origin: 50% 50%;
    transform: scaleY(75%);
  }
  .hero p {
    font-family: var(--font-hed);
    font-size: var(--unit);
    font-weight: 900;
    margin: 0;
  }

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
    margin: 0;
  }
  .card p {
    font-family: var(--font-body);
    line-height: 1.5;
    margin: 0 0 calc(var(--unit) * 1.5) 0;
  }

  .card-actions {
    display: flex;
    gap: var(--unit);
    flex-wrap: wrap;
  }
</style>
