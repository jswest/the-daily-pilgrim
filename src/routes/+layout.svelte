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
    --unit: 17px;
  }
  :global(.btn) {
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
  :global(.btn:hover) {
    opacity: 1;
  }

  :global(.btn-primary) {
    background-color: var(--color-off);
    color: var(--color-bg);
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

	:global(article h2) {
		font-family: var(--font-body);
		font-size: calc(var(--unit) * 1.5);
		font-weight: 900;
		line-height: 1;
		margin-bottom: calc(var(--unit) * 1.5);
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
</style>