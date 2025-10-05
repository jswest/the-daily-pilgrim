<script>
    let {
        selectedItems = $bindable([]),
        placeholder = "Search...",
        apiEndpoint = "/api/authors",
        displayKey = "name",
        valueKey = "id",
        multiple = true,
        allowCreate = true,
        createEndpoint = apiEndpoint
    } = $props();

    let searchQuery = $state("");
    let suggestions = $state([]);
    let showSuggestions = $state(false);
    let inputElement;
    let isCreating = $state(false);

    async function fetchSuggestions(query) {
        if (!query.trim()) {
            suggestions = [];
            return;
        }

        try {
            const response = await fetch(`${apiEndpoint}?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            suggestions = data.filter(item => 
                !selectedItems.some(selected => selected[valueKey] === item[valueKey])
            );
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            suggestions = [];
        }
    }

    function selectItem(item) {
        if (multiple) {
            selectedItems = [...selectedItems, item];
        } else {
            selectedItems = [item];
        }
        searchQuery = "";
        suggestions = [];
        showSuggestions = false;
        inputElement?.focus();
    }

    function removeItem(index) {
        selectedItems = selectedItems.filter((_, i) => i !== index);
    }

    async function createNewItem() {
        if (!searchQuery.trim() || isCreating) return;

        isCreating = true;
        try {
            const response = await fetch(createEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ [displayKey]: searchQuery.trim() })
            });

            if (response.ok) {
                const newItem = await response.json();
                selectItem(newItem);
            } else {
                console.error('Failed to create new item');
            }
        } catch (error) {
            console.error('Error creating new item:', error);
        } finally {
            isCreating = false;
        }
    }

    function handleKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (suggestions.length > 0) {
                selectItem(suggestions[0]);
            } else if (allowCreate && searchQuery.trim()) {
                createNewItem();
            }
        } else if (event.key === 'Escape') {
            showSuggestions = false;
            searchQuery = "";
        }
    }

    $effect(() => {
        if (searchQuery) {
            fetchSuggestions(searchQuery);
            showSuggestions = true;
        } else {
            suggestions = [];
            showSuggestions = false;
        }
    });
</script>

<div class="autocomplete">
    <div class="selected-items">
        {#each selectedItems as item, index}
            <span class="selected-item">
                {item[displayKey]}
                <button 
                    type="button" 
                    onclick={() => removeItem(index)}
                    class="remove-btn"
                >
                    ×
                </button>
            </span>
        {/each}
    </div>
    
    <div class="input-container">
        <input
            bind:this={inputElement}
            bind:value={searchQuery}
            onkeydown={handleKeydown}
            onfocus={() => showSuggestions = searchQuery.length > 0}
            onblur={() => setTimeout(() => showSuggestions = false, 150)}
            placeholder={selectedItems.length === 0 ? placeholder : "Add another..."}
            class="autocomplete-input"
        />
        
        {#if showSuggestions}
            {#if suggestions.length > 0}
                <ul class="suggestions">
                    {#each suggestions as suggestion}
                        <li
                            class="suggestion-item"
                            onclick={() => selectItem(suggestion)}
                        >
                            {suggestion[displayKey]}
                        </li>
                    {/each}
                </ul>
            {:else if allowCreate && searchQuery.trim()}
                <ul class="suggestions">
                    <li
                        class="suggestion-item create-new"
                        onclick={createNewItem}
                    >
                        {#if isCreating}
                            Creating...
                        {:else}
                            Create new: <strong>{searchQuery}</strong>
                        {/if}
                    </li>
                </ul>
            {/if}
        {/if}
    </div>
</div>

<style>
    .autocomplete {
        position: relative;
    }

    .selected-items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .selected-item {
        background: #e5e7eb;
        border-radius: 0.375rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .remove-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        color: #6b7280;
        padding: 0;
        width: 1rem;
        height: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .remove-btn:hover {
        color: #dc2626;
    }

    .input-container {
        position: relative;
    }

    .autocomplete-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 1rem;
    }

    .autocomplete-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }

    .suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        max-height: 200px;
        overflow-y: auto;
        z-index: 50;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .suggestion-item {
        padding: 0.5rem;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
    }

    .suggestion-item:hover {
        background: #f9fafb;
    }

    .suggestion-item:last-child {
        border-bottom: none;
    }

    .create-new {
        background-color: #f0f9ff;
        color: #0369a1;
        font-style: italic;
    }

    .create-new:hover {
        background-color: #e0f2fe;
    }

    .create-new strong {
        font-style: normal;
        font-weight: 600;
    }
</style>