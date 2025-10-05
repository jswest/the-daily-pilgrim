<script>
	import { marked } from "marked";
	import Header from "$lib/components/Header.svelte";
	import Button from "$lib/components/base/Button.svelte";
	import PageContainer from "$lib/components/base/PageContainer.svelte";
	import { goto } from "$app/navigation";

	let { data } = $props();

	let note = $state(data.note);
	let error = $state(data.error || "");
	let noteId = $state(data.noteId);

	let renderedBody = $derived(note ? marked(note.body) : "");

	async function deleteNote() {
		if (!confirm("Are you sure you want to delete this note?")) {
			return;
		}

		try {
			const response = await fetch(`/api/notes/${noteId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				goto("/notes");
			} else {
				error = "Failed to delete note";
			}
		} catch (err) {
			console.error("Error deleting note:", err);
			error = "Network error. Please try again.";
		}
	}
</script>

<svelte:head>
	<title>{note ? note.title : "Note"} - The Daily Pilgrim</title>
</svelte:head>

<Header
	breadcrumbs={[
		{ href: "/", label: "Home" },
		{ href: "/notes", label: "Notes" },
		{ label: note ? note.title : "Loading..." },
	]}
/>

<PageContainer>
	{#if note}
		<div class="page-actions">
			<Button variant="secondary" href="/notes/{note.id}/edit">
				Edit
			</Button>
			<Button variant="danger" onclick={deleteNote}>Delete</Button>
		</div>
	{/if}

	<main>
		{#if error}
			<div class="alert alert-error">
				{error}
				<a href="/notes" class="back-link">← Back to Notes</a>
			</div>
		{:else if note}
			<article class="note">
				<h1 class="note-title">{note.title}</h1>
				<div class="note-meta">
					Created {new Date(note.createdAt).toLocaleDateString()}
					{#if note.updatedAt && note.updatedAt !== note.createdAt}
						· Updated {new Date(note.updatedAt).toLocaleDateString()}
					{/if}
				</div>
				<div class="note-body">
					{@html renderedBody}
				</div>
			</article>
		{/if}
	</main>
</PageContainer>

<style>
	.page-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--unit);
		margin-bottom: calc(var(--unit) * 2);
	}

	.alert {
		padding: var(--unit);
		background-color: #fee2e2;
		color: #991b1b;
		border: 1px solid #fca5a5;
		text-align: center;
		margin-bottom: calc(var(--unit) * 2);
	}

	.back-link {
		display: inline-block;
		margin-top: calc(var(--unit) * 0.5);
		color: var(--color-off);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	main {
		max-width: 800px;
		margin: 0 auto;
	}

	.note {
		background: var(--color-bg);
		padding: calc(var(--unit) * 2);
		border: 1px solid var(--color-fg);
	}

	.note-title {
		font-family: var(--font-hed);
		font-size: calc(var(--unit) * 2);
		font-weight: 900;
		line-height: 1.2;
		margin: 0 0 calc(var(--unit) * 0.5) 0;
	}

	.note-meta {
		font-family: var(--font-body);
		font-size: calc(var(--unit) * 0.875);
		opacity: 0.6;
		margin: 0 0 calc(var(--unit) * 2) 0;
	}

	.note-body {
		font-family: var(--font-body);
		font-size: var(--unit);
		line-height: 1.6;
	}

	.note-body :global(p) {
		margin-bottom: calc(var(--unit) * 1.5);
	}

	.note-body :global(h2) {
		font-family: var(--font-hed);
		font-size: calc(var(--unit) * 1.5);
		font-weight: 700;
		margin: calc(var(--unit) * 2) 0 calc(var(--unit) * 1) 0;
	}

	.note-body :global(h3) {
		font-family: var(--font-hed);
		font-size: calc(var(--unit) * 1.25);
		font-weight: 700;
		margin: calc(var(--unit) * 1.5) 0 calc(var(--unit) * 0.75) 0;
	}

	.note-body :global(em) {
		font-style: italic;
	}

	.note-body :global(strong) {
		font-weight: 700;
	}

	.note-body :global(blockquote) {
		border-left: calc(var(--unit) * 0.25) solid var(--color-fg);
		margin-left: var(--unit);
		padding-left: var(--unit);
		opacity: 0.8;
	}
</style>
