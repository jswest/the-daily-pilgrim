<script>
    import Autocomplete from './Autocomplete.svelte';
    import Button from './base/Button.svelte';

    let { onSubmit = () => {}, isSubmitting = false } = $props();

    let formData = $state({
        title: '',
        body: ''
    });

    let selectedAuthors = $state([]);
    let errors = $state({});

    function validateForm() {
        errors = {};

        if (!formData.title.trim()) {
            errors.title = 'Title is required';
        }

        if (!formData.body.trim()) {
            errors.body = 'Body is required';
        }

        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const poemData = {
            ...formData,
            authorIds: selectedAuthors.map(author => author.id)
        };

        try {
            await onSubmit(poemData);
        } catch (error) {
            console.error('Error submitting poem:', error);
        }
    }

    function resetForm() {
        formData = {
            title: '',
            body: ''
        };
        selectedAuthors = [];
        errors = {};
    }

    // Export reset function for parent component
    export function reset() {
        resetForm();
    }
</script>

<form onsubmit={handleSubmit} class="poem-form">
    <div class="form-group">
        <label for="title" class="form-label">Title</label>
        <input
            id="title"
            type="text"
            bind:value={formData.title}
            placeholder="Enter poem title"
            class="form-input"
            class:error={errors.title}
            disabled={isSubmitting}
        />
        {#if errors.title}
            <span class="error-message">{errors.title}</span>
        {/if}
    </div>

    <div class="form-group">
        <label for="authors" class="form-label">Authors</label>
        <Autocomplete
            bind:selectedItems={selectedAuthors}
            placeholder="Search for poets or authors..."
            apiEndpoint="/api/authors"
            displayKey="name"
            valueKey="id"
            multiple={true}
        />
    </div>

    <div class="form-group">
        <label for="body" class="form-label">Poem</label>
        <textarea
            id="body"
            bind:value={formData.body}
            placeholder="Enter poem text..."
            rows="16"
            class="form-textarea poem-textarea"
            class:error={errors.body}
            disabled={isSubmitting}
        ></textarea>
        {#if errors.body}
            <span class="error-message">{errors.body}</span>
        {/if}
        <div class="form-help">
            Tip: Line breaks will be preserved as written
        </div>
    </div>

    <div class="form-actions">
        <Button
            type="button"
            variant="secondary"
            onclick={resetForm}
            disabled={isSubmitting}
        >
            Reset
        </Button>
        <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
        >
            {isSubmitting ? 'Saving...' : 'Save Poem'}
        </Button>
    </div>
</form>

<style>
    .poem-form {
        max-width: 800px;
        margin: 0 auto;
    }

    .form-group {
        margin-bottom: calc(var(--unit) * 1.5);
    }

    .form-label {
        display: block;
        margin-bottom: calc(var(--unit) * 0.5);
        font-family: var(--font-hed);
        font-weight: 600;
        color: var(--color-fg);
    }

    .form-input,
    .form-textarea {
        width: 100%;
        padding: calc(var(--unit) * 0.75);
        border: 1px solid var(--color-fg);
        font-family: var(--font-body);
        font-size: var(--unit);
        transition: border-color 0.2s, box-shadow 0.2s;
        box-sizing: border-box;
    }

    .form-input:focus,
    .form-textarea:focus {
        outline: none;
        border-color: var(--color-off);
        box-shadow: 0 0 0 1px var(--color-off);
    }

    .form-input.error,
    .form-textarea.error {
        border-color: var(--color-warn);
    }

    .poem-textarea {
        resize: vertical;
        min-height: 300px;
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 1.125);
        line-height: 1.6;
        white-space: pre-wrap;
    }

    .form-help {
        margin-top: calc(var(--unit) * 0.5);
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.875);
        opacity: 0.6;
        font-style: italic;
    }

    .error-message {
        display: block;
        margin-top: calc(var(--unit) * 0.25);
        color: var(--color-warn);
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.875);
    }

    .form-actions {
        display: flex;
        gap: var(--unit);
        justify-content: flex-end;
        margin-top: calc(var(--unit) * 2);
    }
</style>