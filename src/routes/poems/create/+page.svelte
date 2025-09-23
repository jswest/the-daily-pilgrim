<script>
    import { goto } from '$app/navigation';
    import PoemForm from '$lib/components/PoemForm.svelte';

    let isSubmitting = $state(false);
    let submitMessage = $state('');
    let submitError = $state('');

    async function handleSubmit(poemData) {
        isSubmitting = true;
        submitError = '';
        submitMessage = '';

        try {
            const response = await fetch('/api/poems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(poemData)
            });

            const result = await response.json();

            if (response.ok) {
                submitMessage = 'Poem created successfully!';
                setTimeout(() => {
                    goto('/poems');
                }, 1500);
            } else {
                submitError = result.error || 'Failed to create poem';
            }
        } catch (error) {
            console.error('Error creating poem:', error);
            submitError = 'Network error. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<svelte:head>
    <title>Create Poem - The Daily Pilgrim</title>
</svelte:head>

<div class="page-container">
    <header class="page-header">
        <h1>Create New Poem</h1>
        <nav class="breadcrumb">
            <a href="/">Home</a>
            <span>→</span>
            <a href="/poems">Poems</a>
            <span>→</span>
            <span>Create</span>
        </nav>
    </header>

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

    <main>
        <PoemForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
        />
    </main>
</div>

<style>
    .page-container {
        min-height: 100vh;
        background: #f9fafb;
    }

    .page-header {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 2rem;
        margin-bottom: 2rem;
    }

    .page-header h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
    }

    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .breadcrumb a {
        color: #3b82f6;
        text-decoration: none;
    }

    .breadcrumb a:hover {
        text-decoration: underline;
    }

    .alert {
        max-width: 800px;
        margin: 0 auto 2rem auto;
        padding: 1rem;
        border-radius: 0.375rem;
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

    main {
        padding: 0 2rem 2rem 2rem;
    }
</style>