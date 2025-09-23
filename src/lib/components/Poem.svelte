<script>
  import { oxford } from "$lib/util.js";

  let { poem } = $props();
</script>

<article class="poem-content">
  <div class="poem-header">
    <h3>Poem</h3>
    <h1 class="poem-hed">{poem.title}</h1>
    {#if poem.authors && poem.authors.length > 0}
      <p class="authors">
        <span class="label">By</span>
        {oxford(poem.authors.map((a) => a.name))}
      </p>
    {:else if poem.authors}
      <p class="authors">
        <span class="label">By</span>
        {poem.authors}
      </p>
    {/if}
  </div>
  <div class="poem-body">
    <div class="poem-text">
      {poem.body}
    </div>
  </div>
</article>

<style>
  .poem-content {
    background: white;
    border-radius: 0;
    overflow: hidden;
  }

  h1.poem-hed {
    color: #111827;
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 2);
    font-weight: 100;
    line-height: 1;
    margin: var(--unit) 0 calc(var(--unit) * 1.5) 0;
    padding: 0 var(--unit);
    text-align: left;
    transform-origin: 0 0;
    transform: scaleX(75%);
    width: calc((400px - var(--unit) - var(--unit)) / 0.75);
  }

  .authors {
    font-family: var(--font-hed);
    font-size: var(--unit);
    font-weight: 900;
    padding: 0 var(--unit);
  }

  .poem-body {
    padding: 0 var(--unit);
  }

  .poem-text {
    font-family: var(--font-body);
    font-size: var(--unit);
    line-height: 1.5;
    white-space: pre-line;
    text-align: left;
    max-width: 400px;
    margin: 0 auto var(--unit) auto;
  }
</style>