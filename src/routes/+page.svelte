<script>
  import Header from "$lib/components/Header.svelte";
  import PageContainer from "$lib/components/base/PageContainer.svelte";
  import CardGrid from "$lib/components/base/CardGrid.svelte";
  import Card from "$lib/components/base/Card.svelte";
  import Button from "$lib/components/base/Button.svelte";
</script>

<svelte:head>
  <title>The Daily Pilgrim</title>
</svelte:head>

<Header />

<PageContainer>
  <CardGrid>
    <Card>
      <h2>Articles</h2>
      <div class="card-actions">
        <Button variant="primary" href="/articles/create">Create Article</Button>
        <Button variant="secondary" href="/articles">View All</Button>
      </div>
    </Card>

    <Card>
      <h2>Authors</h2>
      <div class="card-actions">
        <Button variant="primary" href="/authors">Manage Authors</Button>
      </div>
    </Card>

    <Card>
      <h2>Poems</h2>
      <div class="card-actions">
        <Button variant="primary" href="/poems/create">Create Poem</Button>
        <Button variant="secondary" href="/poems">View All</Button>
      </div>
    </Card>

    <Card>
      <h2>Notes</h2>
      <div class="card-actions">
        <Button variant="primary" href="/notes/create">Create Note</Button>
        <Button variant="secondary" href="/notes">View All</Button>
      </div>
    </Card>

    <Card>
      <h2>Images</h2>
      <div class="card-actions">
        <Button variant="primary" href="/images/upload">Upload Images</Button>
        <Button variant="secondary" href="/images">View All</Button>
      </div>
    </Card>

    <Card>
      <h2>Editions</h2>
      <div class="card-actions">
        <Button variant="primary" href="/editions/create">Create Edition</Button>
        <Button variant="secondary" href="/editions">View All</Button>
      </div>
    </Card>

    <Card>
      <h2>Processing Queue</h2>
      <div class="card-actions">
        <Button variant="primary" href="/processing">View Queue</Button>
      </div>
    </Card>
  </CardGrid>
</PageContainer>
