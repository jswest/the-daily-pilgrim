<script>
    import { onMount } from 'svelte';

    let status = $state({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        currentJobs: 0,
        isRunning: false
    });
    
    let isLoading = $state(false);
    let message = $state('');
    let isSubmitting = $state(false);

    onMount(async () => {
        await loadStatus();
        
        // Auto-refresh every 5 seconds
        const interval = setInterval(loadStatus, 5000);
        
        return () => clearInterval(interval);
    });

    async function loadStatus() {
        if (isSubmitting) return; // Don't refresh while performing actions
        
        try {
            const response = await fetch('/api/processing/status');
            const data = await response.json();
            status = data;
        } catch (error) {
            console.error('Error loading status:', error);
        }
    }

    async function performAction(action, imageId = null) {
        isSubmitting = true;
        message = '';
        
        try {
            const body = { action };
            if (imageId) body.imageId = imageId;
            
            const response = await fetch('/api/processing/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (response.ok) {
                message = result.message;
                setTimeout(() => message = '', 3000);
                
                // Refresh status after action
                setTimeout(loadStatus, 1000);
            } else {
                message = `Error: ${result.error}`;
            }
        } catch (error) {
            console.error('Error performing action:', error);
            message = 'Network error. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }

    async function startWorker() {
        await performAction('start_worker');
    }

    async function stopWorker() {
        await performAction('stop_worker');
    }

    async function resetFailed() {
        if (confirm('Reset all failed images to pending status?')) {
            await performAction('reset_failed');
        }
    }

    function getTotalImages() {
        return status.pending + status.processing + status.completed + status.failed;
    }

    function getCompletionPercentage() {
        const total = getTotalImages();
        return total > 0 ? Math.round((status.completed / total) * 100) : 0;
    }
</script>

<svelte:head>
    <title>Processing Queue - The Daily Pilgrim</title>
</svelte:head>

<div class="page-container">
    <header class="page-header">
        <div class="header-content">
            <div>
                <h1>Image Processing Queue</h1>
                <nav class="breadcrumb">
                    <a href="/">Home</a>
                    <span>→</span>
                    <span>Processing</span>
                </nav>
            </div>
            <div class="header-actions">
                {#if status.isRunning}
                    <button 
                        onclick={stopWorker}
                        class="btn btn-secondary"
                        disabled={isSubmitting}
                    >
                        Stop Worker
                    </button>
                {:else}
                    <button 
                        onclick={startWorker}
                        class="btn btn-primary"
                        disabled={isSubmitting}
                    >
                        Start Worker
                    </button>
                {/if}
            </div>
        </div>
    </header>

    {#if message}
        <div class="alert" class:alert-error={message.includes('Error')}>
            {message}
        </div>
    {/if}

    <main>
        <div class="dashboard">
            <!-- Worker Status -->
            <div class="status-card">
                <h2>Worker Status</h2>
                <div class="status-info">
                    <div class="status-item">
                        <span class="label">Status:</span>
                        <span class="value worker-status" class:running={status.isRunning}>
                            {status.isRunning ? 'Running' : 'Stopped'}
                        </span>
                    </div>
                    <div class="status-item">
                        <span class="label">Current Jobs:</span>
                        <span class="value">{status.currentJobs}</span>
                    </div>
                </div>
            </div>

            <!-- Queue Statistics -->
            <div class="status-card">
                <h2>Queue Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-item pending">
                        <div class="stat-number">{status.pending}</div>
                        <div class="stat-label">Pending</div>
                    </div>
                    <div class="stat-item processing">
                        <div class="stat-number">{status.processing}</div>
                        <div class="stat-label">Processing</div>
                    </div>
                    <div class="stat-item completed">
                        <div class="stat-number">{status.completed}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="stat-item failed">
                        <div class="stat-number">{status.failed}</div>
                        <div class="stat-label">Failed</div>
                    </div>
                </div>
                
                <div class="progress-section">
                    <div class="progress-header">
                        <span>Overall Progress</span>
                        <span>{getCompletionPercentage()}%</span>
                    </div>
                    <div class="progress-bar">
                        <div 
                            class="progress-fill" 
                            style="width: {getCompletionPercentage()}%"
                        ></div>
                    </div>
                    <div class="progress-details">
                        {status.completed} of {getTotalImages()} images processed
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="status-card">
                <h2>Actions</h2>
                <div class="actions-grid">
                    <button 
                        onclick={resetFailed}
                        class="action-btn"
                        disabled={isSubmitting || status.failed === 0}
                    >
                        <div class="action-title">Reset Failed Images</div>
                        <div class="action-description">
                            Reset {status.failed} failed images to pending status
                        </div>
                    </button>
                    
                    <a href="/images" class="action-btn link">
                        <div class="action-title">View Images</div>
                        <div class="action-description">
                            See all images and their processing status
                        </div>
                    </a>
                    
                    <a href="/images/upload" class="action-btn link">
                        <div class="action-title">Upload Images</div>
                        <div class="action-description">
                            Add new images to the processing queue
                        </div>
                    </a>
                </div>
            </div>
        </div>
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

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        max-width: 1200px;
        margin: 0 auto;
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

    .header-actions {
        display: flex;
        gap: 0.75rem;
    }

    .alert {
        max-width: 1200px;
        margin: 0 auto 2rem auto;
        padding: 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
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
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem 2rem 2rem;
    }

    .dashboard {
        display: grid;
        gap: 2rem;
    }

    .status-card {
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        padding: 2rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .status-card h2 {
        margin: 0 0 1.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
    }

    .status-info {
        display: grid;
        gap: 1rem;
    }

    .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .status-item .label {
        font-weight: 500;
        color: #6b7280;
    }

    .status-item .value {
        color: #111827;
        font-weight: 500;
    }

    .worker-status {
        padding: 0.25rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background: #ef4444;
        color: white;
    }

    .worker-status.running {
        background: #10b981;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .stat-item {
        text-align: center;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 2px solid;
    }

    .stat-item.pending {
        border-color: #f59e0b;
        background: #fef3c7;
    }

    .stat-item.processing {
        border-color: #3b82f6;
        background: #dbeafe;
    }

    .stat-item.completed {
        border-color: #10b981;
        background: #d1fae5;
    }

    .stat-item.failed {
        border-color: #ef4444;
        background: #fee2e2;
    }

    .stat-number {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
    }

    .stat-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        margin-top: 0.25rem;
    }

    .progress-section {
        border-top: 1px solid #e5e7eb;
        padding-top: 1.5rem;
    }

    .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
    }

    .progress-bar {
        width: 100%;
        height: 0.5rem;
        background: #e5e7eb;
        border-radius: 0.25rem;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: #10b981;
        transition: width 0.3s ease;
    }

    .progress-details {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .action-btn {
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        background: #f9fafb;
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s;
        text-align: left;
    }

    .action-btn:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #d1d5db;
    }

    .action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .action-btn.link {
        text-decoration: none;
        color: inherit;
        display: block;
    }

    .action-title {
        font-weight: 600;
        color: #111827;
        margin-bottom: 0.5rem;
    }

    .action-description {
        font-size: 0.875rem;
        color: #6b7280;
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

    .btn-primary {
        background: #3b82f6;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: #2563eb;
    }

    .btn-secondary {
        background: #f3f4f6;
        color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #e5e7eb;
    }

    @media (max-width: 768px) {
        .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .actions-grid {
            grid-template-columns: 1fr;
        }
    }
</style>