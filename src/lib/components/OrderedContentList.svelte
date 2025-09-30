<script>
    import Button from './base/Button.svelte';

    let {
        orderedContent = [],
        onMoveUp,
        onMoveDown,
        onRemove
    } = $props();

    function getContentIcon(type) {
        switch(type) {
            case 'article': return '📄';
            case 'poem': return '✒️';
            case 'image': return '🖼️';
            default: return '📦';
        }
    }

    function getContentTitle(item) {
        if (item.type === 'article') return item.data.hed;
        if (item.type === 'poem') return item.data.title;
        if (item.type === 'image') return item.data.filename;
        return 'Unknown';
    }

    function getContentSubtitle(item) {
        return item.data.authors || '';
    }

    function getUsageTypeBadge(item) {
        if (item.type === 'image' && item.usageType) {
            return item.usageType.charAt(0).toUpperCase() + item.usageType.slice(1);
        }
        return null;
    }
</script>

<div class="ordered-content-list">
    <h3>Selected Content ({orderedContent.length} items)</h3>

    {#if orderedContent.length === 0}
        <div class="empty-state">
            <p>No content selected yet. Add articles, poems, or images from below.</p>
        </div>
    {:else}
        <div class="content-items">
            {#each orderedContent as item, index}
                <div class="content-item">
                    <div class="item-number">{index + 1}</div>

                    <div class="item-preview">
                        {#if item.type === 'image'}
                            <img
                                src="/api/images/{item.id}/file"
                                alt={item.data.filename}
                                class="preview-image"
                            />
                        {:else}
                            <div class="preview-icon">{getContentIcon(item.type)}</div>
                        {/if}
                    </div>

                    <div class="item-content">
                        <div class="item-header">
                            <span class="item-type">{item.type}</span>
                            {#if getUsageTypeBadge(item)}
                                <span class="usage-badge">{getUsageTypeBadge(item)}</span>
                            {/if}
                        </div>
                        <h4 class="item-title">{getContentTitle(item)}</h4>
                        {#if getContentSubtitle(item)}
                            <div class="item-subtitle">by {getContentSubtitle(item)}</div>
                        {/if}
                    </div>

                    <div class="item-controls">
                        <Button
                            type="button"
                            variant="secondary"
                            onclick={() => onMoveUp(index)}
                            disabled={index === 0}
                        >
                            ↑
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onclick={() => onMoveDown(index)}
                            disabled={index === orderedContent.length - 1}
                        >
                            ↓
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            onclick={() => onRemove(index)}
                        >
                            ×
                        </Button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .ordered-content-list {
        margin-bottom: calc(var(--unit) * 3);
        padding: calc(var(--unit) * 1.5);
        border: 1px solid var(--color-fg);
        background-color: var(--color-bg);
    }

    .ordered-content-list h3 {
        font-family: var(--font-hed);
        font-size: calc(var(--unit) * 1.25);
        font-weight: 700;
        margin: 0 0 calc(var(--unit) * 1.5) 0;
        color: var(--color-fg);
    }

    .empty-state {
        text-align: center;
        padding: calc(var(--unit) * 3);
        opacity: 0.6;
        font-style: italic;
    }

    .empty-state p {
        margin: 0;
        font-family: var(--font-body);
    }

    .content-items {
        display: flex;
        flex-direction: column;
        gap: calc(var(--unit) * 1);
    }

    .content-item {
        display: flex;
        gap: var(--unit);
        align-items: center;
        padding: var(--unit);
        border: 1px solid var(--color-fg);
        background-color: #f8f9fa;
    }

    .item-number {
        font-family: var(--font-hed);
        font-weight: 900;
        font-size: calc(var(--unit) * 1.25);
        color: var(--color-off);
        min-width: calc(var(--unit) * 2);
        text-align: center;
    }

    .item-preview {
        width: calc(var(--unit) * 4);
        height: calc(var(--unit) * 4);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--color-fg);
        background-color: var(--color-bg);
    }

    .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .preview-icon {
        font-size: calc(var(--unit) * 2);
    }

    .item-content {
        flex: 1;
        min-width: 0;
    }

    .item-header {
        display: flex;
        gap: calc(var(--unit) * 0.5);
        align-items: center;
        margin-bottom: calc(var(--unit) * 0.25);
    }

    .item-type {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.75);
        text-transform: uppercase;
        font-weight: 600;
        color: var(--color-off);
    }

    .usage-badge {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.65);
        padding: calc(var(--unit) * 0.125) calc(var(--unit) * 0.375);
        background-color: var(--color-off);
        color: var(--color-bg);
        border-radius: 2px;
        text-transform: uppercase;
        font-weight: 600;
    }

    .item-title {
        font-family: var(--font-hed);
        font-size: var(--unit);
        font-weight: 700;
        margin: 0 0 calc(var(--unit) * 0.25) 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .item-subtitle {
        font-family: var(--font-body);
        font-size: calc(var(--unit) * 0.85);
        color: var(--color-off);
        font-weight: 600;
    }

    .item-controls {
        display: flex;
        gap: calc(var(--unit) * 0.5);
        flex-shrink: 0;
    }
</style>
