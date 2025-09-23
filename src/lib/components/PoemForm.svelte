<script>
    import Autocomplete from './Autocomplete.svelte';

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
        <button
            type="button"
            onclick={resetForm}
            class="btn btn-secondary"
            disabled={isSubmitting}
        >
            Reset
        </button>
        <button
            type="submit"
            class="btn btn-primary"
            disabled={isSubmitting}
        >
            {isSubmitting ? 'Saving...' : 'Save Poem'}
        </button>
    </div>
</form>

<style>
    .poem-form {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #374151;
    }

    .form-input,
    .form-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-input:focus,
    .form-textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }

    .form-input.error,
    .form-textarea.error {
        border-color: #dc2626;
    }

    .poem-textarea {
        resize: vertical;
        min-height: 300px;
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 1.125rem;
        line-height: 1.6;
        white-space: pre-wrap;
    }

    .form-help {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
        font-style: italic;
    }

    .error-message {
        display: block;
        margin-top: 0.25rem;
        color: #dc2626;
        font-size: 0.875rem;
    }

    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-secondary {
        background: #f3f4f6;
        color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #e5e7eb;
    }

    .btn-primary {
        background: #3b82f6;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: #2563eb;
    }
</style>