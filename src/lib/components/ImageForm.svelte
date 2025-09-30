<script>
    import Autocomplete from './Autocomplete.svelte';
    import Button from './base/Button.svelte';

    let { 
        onSubmit = () => {}, 
        isSubmitting = false,
        initialData = null,
        mode = 'edit' // Only edit mode for now since create is via upload
    } = $props();

    let formData = $state({
        caption: initialData?.caption || '',
        image_type: initialData?.image_type || 'inline'
    });

    let selectedAuthors = $state(initialData?.authors || []);
    let errors = $state({});

    function validateForm() {
        errors = {};
        
        if (!formData.image_type) {
            errors.image_type = 'Image type is required';
        }
        
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const imageData = {
            ...formData,
            authorIds: selectedAuthors.map(author => author.id)
        };

        try {
            await onSubmit(imageData);
        } catch (error) {
            console.error('Error submitting image:', error);
        }
    }

    function resetForm() {
        formData = {
            caption: initialData?.caption || '',
            image_type: initialData?.image_type || 'inline'
        };
        selectedAuthors = initialData?.authors || [];
        errors = {};
    }

    // Export reset function for parent component
    export function reset() {
        resetForm();
    }

    function getImageTypeLabel(type) {
        const types = {
            'background': 'Background (9:16)',
            'title': 'Title (16:9)',
            'inline': 'Inline'
        };
        return types[type] || type;
    }
</script>

<form onsubmit={handleSubmit} class="image-form">
    <div class="form-group">
        <label for="caption" class="form-label">Caption</label>
        <textarea
            id="caption"
            bind:value={formData.caption}
            placeholder="Enter image caption (optional)"
            rows="3"
            class="form-textarea"
            disabled={isSubmitting}
        ></textarea>
    </div>

    <div class="form-group">
        <label for="image_type" class="form-label">Image Type</label>
        <select
            id="image_type"
            bind:value={formData.image_type}
            class="form-select"
            class:error={errors.image_type}
            disabled={isSubmitting}
        >
            <option value="background">Background (9:16)</option>
            <option value="title">Title (16:9)</option>
            <option value="inline">Inline</option>
        </select>
        {#if errors.image_type}
            <span class="error-message">{errors.image_type}</span>
        {/if}
    </div>

    <div class="form-group">
        <label for="authors" class="form-label">Photographers/Artists</label>
        <Autocomplete
            bind:selectedItems={selectedAuthors}
            placeholder="Search for photographers or artists..."
            apiEndpoint="/api/authors"
            displayKey="name"
            valueKey="id"
            multiple={true}
        />
    </div>

    <div class="form-actions">
        <Button
            type="button"
            onclick={resetForm}
            variant="secondary"
            disabled={isSubmitting}
        >
            Reset
        </Button>
        <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
        >
            {isSubmitting ? 'Updating...' : 'Update Image'}
        </Button>
    </div>
</form>

<style>
    :global(:root) {
        --color-bg: #ffffff;
        --color-fg: #000000;
        --color-off: #0066cc;
        --color-warn: #cc6600;
        --font-body: "Cormorant";
        --font-dek: "Merriweather";
        --font-hed: "Merriweather";
        --font-masthead: "Bodoni Moda";
        --unit: 16px;
    }

    .image-form {
        background-color: white;
        border: 1px solid var(--color-fg);
        padding: calc(var(--unit) * 2);
        max-width: 600px;
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

    .form-textarea,
    .form-select {
        width: 100%;
        padding: calc(var(--unit) * 0.75);
        border: 1px solid var(--color-fg);
        border-radius: 0;
        font-size: var(--unit);
        font-family: var(--font-body);
        box-sizing: border-box;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-textarea:focus,
    .form-select:focus {
        outline: none;
        border-color: var(--color-off);
        box-shadow: 0 0 0 1px var(--color-off);
    }

    .form-textarea.error,
    .form-select.error {
        border-color: var(--color-warn);
    }

    .form-textarea {
        resize: vertical;
        min-height: calc(var(--unit) * 4);
        line-height: 1.5;
    }

    .form-select {
        background: var(--color-bg);
        cursor: pointer;
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

    /* Button styles are inherited from global styles */
</style>