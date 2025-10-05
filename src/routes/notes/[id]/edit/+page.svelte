<script>
	import { goto } from "$app/navigation";
	import NoteForm from "$lib/components/NoteForm.svelte";
	import Header from "$lib/components/Header.svelte";
	import PageContainer from "$lib/components/base/PageContainer.svelte";

	let { data } = $props();

	let isSubmitting = $state(false);
	let submitMessage = $state("");
	let submitError = $state("");

	async function handleSubmit(noteData) {
		isSubmitting = true;
		submitError = "";
		submitMessage = "";

		try {
			const response = await fetch(`/api/notes/${data.noteId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(noteData),
			});

			const result = await response.json();

			if (response.ok) {
				submitMessage = "Note updated successfully!";
				setTimeout(() => {
					goto(`/notes/${data.noteId}`);
				}, 1500);
			} else {
				submitError = result.error || "Failed to update note";
			}
		} catch (error) {
			console.error("Error updating note:", error);
			submitError = "Network error. Please try again.";
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Note: {data.note ? data.note.title : "Loading..."} - The Daily Pilgrim</title>
</svelte:head>

<Header
	breadcrumbs={[
		{ href: "/", label: "Home" },
		{ href: "/notes", label: "Notes" },
		{ href: `/notes/${data.noteId}`, label: data.note?.title || "Loading..." },
		{ label: "Edit" },
	]}
/>

<PageContainer>
	{#if submitMessage}
		<div class="alert success">
			{submitMessage}
		</div>
	{/if}

	{#if submitError}
		<div class="alert error">
			{submitError}
		</div>
	{/if}

	<NoteForm
		onSubmit={handleSubmit}
		{isSubmitting}
		initialData={data.note}
		mode="edit"
	/>
</PageContainer>

<style>
	.alert {
		padding: var(--unit);
		margin-bottom: calc(var(--unit) * 2);
		text-align: center;
		font-family: var(--font-body);
		font-weight: 600;
	}

	.alert.success {
		background-color: var(--color-off);
		color: var(--color-bg);
	}

	.alert.error {
		background-color: var(--color-warn);
		color: var(--color-bg);
	}
</style>
