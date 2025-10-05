<script>
	import { goto } from '$app/navigation';
	import Header from "$lib/components/Header.svelte";
	import PageContainer from "$lib/components/base/PageContainer.svelte";
	import NoteForm from '$lib/components/NoteForm.svelte';

	let isSubmitting = $state(false);
	let submitMessage = $state('');
	let submitError = $state('');

	async function handleSubmit(noteData) {
		isSubmitting = true;
		submitError = '';
		submitMessage = '';

		try {
			const response = await fetch('/api/notes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(noteData)
			});

			const result = await response.json();

			if (response.ok) {
				submitMessage = 'Note created successfully!';
				setTimeout(() => {
					goto('/notes');
				}, 1500);
			} else {
				submitError = result.error || 'Failed to create note';
			}
		} catch (error) {
			console.error('Error creating note:', error);
			submitError = 'Network error. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Create Note - The Daily Pilgrim</title>
</svelte:head>

<Header
	breadcrumbs={[
		{ href: "/", label: "Home" },
		{ href: "/notes", label: "Notes" },
		{ label: "Create" }
	]}
/>

<PageContainer>
	{#if submitMessage}
		<div class="alert alert-success">
			{submitMessage}
		</div>
	{/if}

	{#if submitError}
		<div class="alert alert-error">
			{submitError}
		</div>
	{/if}

	<NoteForm
		onSubmit={handleSubmit}
		isSubmitting={isSubmitting}
	/>
</PageContainer>

<style>
	.alert {
		padding: var(--unit);
		margin-bottom: calc(var(--unit) * 2);
		font-family: var(--font-body);
		font-weight: 500;
	}

	.alert-success {
		background: #d1fae5;
		color: #065f46;
		border: 1px solid #a7f3d0;
	}

	.alert-error {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}
</style>
