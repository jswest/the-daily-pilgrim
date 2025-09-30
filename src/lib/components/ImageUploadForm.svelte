<script>
    import Autocomplete from './Autocomplete.svelte';
    import Button from './base/Button.svelte';

    let { onSubmit = () => {}, isSubmitting = false } = $props();

    let formData = $state({
        caption: '',
        imageType: 'inline'
    });

    let selectedAuthors = $state([]);
    let selectedFile = $state(null);
    let previewUrl = $state('');
    let errors = $state({});
    let dragOver = $state(false);

    const imageTypes = [
        { value: 'background', label: 'Background (9:16)' },
        { value: 'title', label: 'Title (16:9)' },
        { value: 'inline', label: 'Inline' }
    ];

    function validateForm() {
        errors = {};
        
        if (!selectedFile) {
            errors.file = 'Please select an image file';
        }
        
        if (!formData.imageType) {
            errors.imageType = 'Please select an image type';
        }
        
        return Object.keys(errors).length === 0;
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        dragOver = false;
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            setSelectedFile(files[0]);
        }
    }

    function setSelectedFile(file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            errors.file = 'Invalid file type. Please upload an image.';
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            errors.file = 'File size too large. Please upload an image smaller than 10MB.';
            return;
        }

        selectedFile = file;
        errors.file = '';
        
        // Create preview URL
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        previewUrl = URL.createObjectURL(file);
    }

    function removeFile() {
        selectedFile = null;
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = '';
        }
        // Reset file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
    }

    async function handleSubmit(event) {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const submitData = new FormData();
        submitData.append('file', selectedFile);
        submitData.append('caption', formData.caption);
        submitData.append('imageType', formData.imageType);
        submitData.append('authorIds', JSON.stringify(
            selectedAuthors.map(author => ({ authorId: author.id, role: 'photographer' }))
        ));

        try {
            await onSubmit(submitData);
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    }

    function resetForm() {
        formData = {
            caption: '',
            imageType: 'inline'
        };
        selectedAuthors = [];
        removeFile();
        errors = {};
    }

    // Export reset function for parent component
    export function reset() {
        resetForm();
    }
</script>

<form onsubmit={handleSubmit} class="image-upload-form">
    <div class="form-group">
        <label class="form-label">Image File</label>
        <div 
            class="file-drop-zone"
            class:drag-over={dragOver}
            class:has-file={selectedFile}
            ondragover={(e) => { e.preventDefault(); dragOver = true; }}
            ondragleave={() => dragOver = false}
            ondrop={handleDrop}
        >
            {#if selectedFile}
                <div class="file-preview">
                    <img src={previewUrl} alt="Preview" class="preview-image" />
                    <div class="file-info">
                        <p class="file-name">{selectedFile.name}</p>
                        <p class="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button 
                            type="button" 
                            onclick={removeFile}
                            class="remove-file-btn"
                            disabled={isSubmitting}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            {:else}
                <div class="drop-zone-content">
                    <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <p class="drop-text">Drop image here or click to browse</p>
                    <p class="drop-subtext">Supports: JPEG, PNG, GIF, WebP (max 10MB)</p>
                </div>
            {/if}
            
            <input
                id="fileInput"
                type="file"
                accept="image/*"
                onchange={handleFileSelect}
                class="file-input"
                disabled={isSubmitting}
            />
        </div>
        {#if errors.file}
            <span class="error-message">{errors.file}</span>
        {/if}
    </div>

    <div class="form-group">
        <label for="imageType" class="form-label">Image Type</label>
        <select
            id="imageType"
            bind:value={formData.imageType}
            class="form-select"
            class:error={errors.imageType}
            disabled={isSubmitting}
        >
            {#each imageTypes as type}
                <option value={type.value}>{type.label}</option>
            {/each}
        </select>
        {#if errors.imageType}
            <span class="error-message">{errors.imageType}</span>
        {/if}
    </div>

    <div class="form-group">
        <label class="form-label">Photographers/Artists</label>
        <Autocomplete
            bind:selectedItems={selectedAuthors}
            placeholder="Search for photographers or artists..."
            apiEndpoint="/api/authors"
            displayKey="name"
            valueKey="id"
            multiple={true}
        />
    </div>

    <div class="form-group">
        <label for="caption" class="form-label">Caption (optional)</label>
        <textarea
            id="caption"
            bind:value={formData.caption}
            placeholder="Enter image caption..."
            rows="3"
            class="form-textarea"
            disabled={isSubmitting}
        ></textarea>
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
            disabled={isSubmitting || !selectedFile}
        >
            {isSubmitting ? 'Uploading...' : 'Upload Image'}
        </Button>
    </div>
</form>

<style>
    .image-upload-form {
        max-width: 600px;
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

    .file-drop-zone {
        border: 2px dashed #d1d5db;
        border-radius: 0.5rem;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .file-drop-zone:hover,
    .file-drop-zone.drag-over {
        border-color: #3b82f6;
        background: #f8fafc;
    }

    .file-drop-zone.has-file {
        padding: 1rem;
        min-height: auto;
    }

    .file-input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
    }

    .drop-zone-content {
        pointer-events: none;
    }

    .upload-icon {
        width: 3rem;
        height: 3rem;
        color: #9ca3af;
        margin-bottom: 1rem;
    }

    .drop-text {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        color: #374151;
    }

    .drop-subtext {
        margin: 0;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .file-preview {
        display: flex;
        gap: 1rem;
        align-items: center;
        text-align: left;
    }

    .preview-image {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 0.375rem;
        border: 1px solid #e5e7eb;
    }

    .file-info {
        flex: 1;
    }

    .file-name {
        margin: 0 0 0.25rem 0;
        font-weight: 500;
        color: #111827;
    }

    .file-size {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .remove-file-btn {
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 0.25rem;
        padding: 0.25rem 0.75rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .remove-file-btn:hover:not(:disabled) {
        background: #b91c1c;
    }

    .form-select,
    .form-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-select:focus,
    .form-textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }

    .form-select.error,
    .form-textarea.error {
        border-color: #dc2626;
    }

    .form-textarea {
        resize: vertical;
        font-family: inherit;
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
</style>