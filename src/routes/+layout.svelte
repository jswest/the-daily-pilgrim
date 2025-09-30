<script>
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<style>
  :global(html),
  :global(body) {
    color: var(--color-fg);
    margin: 0;
    padding: 0;
  }

  :global(:root) {
    --color-bg: #ffffff;
    --color-fg: #000000;
    --color-off: #0066cc;
    --color-warn: #cc6600;
    --font-body: "Cormorant";
    --font-dek: "Merriweather";
    --font-hed: "Merriweather";
    --font-masthead: "Bodoni Moda";
    --font-sans: "Neue Regrade";
    --unit: 17px;
  }

  /* Button styles */
  :global(.btn) {
    border: none;
    border-radius: 0;
    box-sizing: border-box;
    cursor: pointer;
    display: inline-block;
    font-family: var(--font-sans);
    font-size: calc(var(--unit) * 0.75);
    font-weight: 600;
    line-height: var(--unit);
    opacity: 0.5;
    padding: calc(var(--unit) * 0.5);
    text-decoration: none;
    transition: opacity 0.2s;
    text-align: center;
  }

  :global(.btn:hover) {
    opacity: 1;
  }

  :global(.btn:disabled) {
    opacity: 0.25;
    cursor: not-allowed;
  }

  :global(.btn-primary) {
    background-color: var(--color-off);
    color: var(--color-bg);
    font-weight: 900;
  }

  :global(.btn-secondary) {
    background-color: var(--color-bg);
    border: 1px solid var(--color-fg);
    color: var(--color-fg);
  }

  :global(.btn-danger) {
    background-color: var(--color-warn);
    color: white;
  }

  /* Content typography */
  :global(article h2) {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 1.5);
    font-weight: 900;
    line-height: 1;
    margin-bottom: calc(var(--unit) * 1.5);
  }

  :global(article blockquote) {
    border-left: calc(var(--unit) * 0.25) solid black;
    margin-left: var(--unit);
    padding-left: var(--unit);
  }

  :global(article p) {
    font-family: var(--font-body);
    font-size: var(--unit);
    font-weight: 500;
    line-height: 1.5;
    margin-bottom: calc(var(--unit) * 1.5);
  }

  :global(article h3) {
    font-family: var(--font-masthead);
    font-size: calc(var(--unit) * 0.75);
    letter-spacing: calc(var(--unit) * 0.1);
    text-align: center;
    text-transform: uppercase;
  }

  :global(article .authors) {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 0.75);
    font-weight: 100;
    letter-spacing: calc(var(--unit) * 0.75 * 0.1);
    padding: 0 var(--unit);
    text-transform: uppercase;
  }

  /* Layout utilities */
  :global(.main-content) {
    margin: 0 auto;
    max-width: 1200px;
    padding: var(--unit);
  }

  :global(.page-actions) {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: calc(var(--unit) * 2);
  }

  :global(.card-grid) {
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  :global(.card) {
    background-color: white;
    border: 1px solid var(--color-fg);
    padding: var(--unit);
  }

  :global(.card h2) {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.125);
    font-weight: 900;
    line-height: 1;
    margin: 0 0 calc(var(--unit) * 0.5) 0;
  }

  :global(.card-actions) {
    display: flex;
    gap: var(--unit);
    flex-wrap: wrap;
  }

  /* State styles */
  :global(.loading) {
    text-align: center;
    padding: calc(var(--unit) * 2);
    font-family: var(--font-body);
    color: var(--color-fg);
  }

  :global(.empty-state) {
    text-align: center;
    padding: calc(var(--unit) * 3);
    font-family: var(--font-body);
    color: var(--color-fg);
  }

  :global(.empty-state p) {
    margin-bottom: var(--unit);
    font-size: calc(var(--unit) * 1.125);
  }

  :global(.alert) {
    background-color: var(--color-warn);
    color: var(--color-bg);
    padding: var(--unit);
    margin-bottom: calc(var(--unit) * 2);
    text-align: center;
  }

  /* Breadcrumb styles */
  :global(.breadcrumb) {
    display: flex;
    align-items: center;
    gap: calc(var(--unit) * 0.5);
    font-family: var(--font-body);
    color: var(--color-fg);
  }

  :global(.breadcrumb a) {
    color: var(--color-off);
    text-decoration: none;
  }

  :global(.breadcrumb a:hover) {
    text-decoration: underline;
  }
</style>