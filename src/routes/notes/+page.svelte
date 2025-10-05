<script>
	import { onMount } from "svelte";
	import Header from "$lib/components/Header.svelte";
	import Button from "$lib/components/base/Button.svelte";
	import LoadingState from "$lib/components/base/LoadingState.svelte";
	import EmptyState from "$lib/components/base/EmptyState.svelte";
	import PageContainer from "$lib/components/base/PageContainer.svelte";
	import CardGrid from "$lib/components/base/CardGrid.svelte";
	import Card from "$lib/components/base/Card.svelte";

	let notes = $state([]);
	let isLoading = $state(false);
	let message = $state("");

	onMount(async () => {
		await loadNotes();
	});

	async function loadNotes() {
		isLoading = true;
		try {
			const response = await fetch("/api/notes");
			const data = await response.json();
			notes = data;
		} catch (error) {
			console.error("Error loading notes:", error);
			message = "Failed to load notes";
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Editorial Notes - The Daily Pilgrim</title>
</svelte:head>

<Header
	breadcrumbs={[
		{ href: "/", label: "Home" },
		{ label: "Notes" }
	]}
/>

<PageContainer>
	<div class="page-actions">
		<Button variant="primary" href="/notes/create">Create Note</Button>
	</div>

	{#if message}
		<div class="alert">
			{message}
		</div>
	{/if}

	{#if isLoading}
		<LoadingState message="Loading notes..." />
	{:else if notes.length === 0}
		<EmptyState
			message="No editorial notes found."
			actionText="Create the first note"
			actionHref="/notes/create"
		/>
	{:else}
		<CardGrid>
			{#each notes as note}
				<Card>
					<h2>{note.title}</h2>

					<div class="note-preview">
						{note.body.slice(0, 150)}{note.body.length > 150 ? '...' : ''}
					</div>

					<div class="meta">
						Created {new Date(note.createdAt).toLocaleDateString()}
					</div>

					<div class="card-actions">
						<Button variant="primary" href="/notes/{note.id}">View</Button>
						<Button variant="secondary" href="/notes/{note.id}/edit">Edit</Button>
					</div>
				</Card>
			{/each}
		</CardGrid>
	{/if}
</PageContainer>

<style>
	.note-preview {
		font-family: var(--font-body);
		line-height: 1.6;
		margin: 0 0 var(--unit) 0;
	}

	.meta {
		font-family: var(--font-body);
		font-size: calc(var(--unit) * 0.875);
		opacity: 0.6;
		margin: 0 0 calc(var(--unit) * 1.5) 0;
	}
</style>
