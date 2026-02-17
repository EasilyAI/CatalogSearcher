import { buildSearchApiUrl } from '../config/apiConfig';
import { authenticatedFetch } from '../utils/apiClient';

/**
 * Execute a batch product search against the search API.
 *
 * For large batches (>50 items), the API returns a job ID and processes asynchronously.
 * Use pollBatchSearchStatus() and getBatchSearchResults() for async jobs.
 *
 * @param {Object} params
 * @param {Array} params.items - Array of items to search, each with:
 *   - orderingNumber (optional): Ordering number/SKU to search by
 *   - description (required if no orderingNumber): Description to search by
 *   - quantity (required): Quantity needed
 *   - productCategory (required): Product category from ProductCategory enum
 * @param {number} [params.size=30] - Number of results to retrieve before re-ranking (1–100)
 * @param {number} [params.minScore=0] - Minimum similarity score (0–1)
 * @param {boolean} [params.useAI=true] - Whether to enable LLM-based re-ranking (for description searches only)
 * @param {number} [params.resultSize=5] - Number of results to return after re-ranking
 * @param {string} [params.fileName] - Optional file name for job tracking
 * @param {Function} [params.onProgress] - Optional callback for progress updates (for async jobs)
 * @returns {Promise<Object>} Batch search response from the API
 */
export const batchSearchProducts = async ({
  items,
  size = 30,
  minScore = 0,
  useAI = true,
  resultSize = 5,
  fileName = '',
  onProgress = null,
} = {}) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Items array is required and must not be empty');
  }

  // Validate items structure
  const invalidItems = items.filter(
    (item) =>
      !item.description &&
      !item.orderingNumber
  );
  if (invalidItems.length > 0) {
    throw new Error(
      'All items must have either an orderingNumber or description'
    );
  }

  const url = buildSearchApiUrl('/batch-search');

  const response = await authenticatedFetch(
    url,
    {
      method: 'POST',
      body: JSON.stringify({
        items: items.map((item) => ({
          orderingNumber: item.orderingNumber || null,
          description: item.description || null,
          quantity: item.quantity || 1,
          productCategory: item.productType || item.productCategory,
        })),
        size,
        min_score: minScore,
        use_ai: useAI,
        result_size: resultSize,
        fileName,
      }),
    },
    'search'
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to execute batch search',
    }));
    throw new Error(
      error.message || `Failed to execute batch search: ${response.statusText}`
    );
  }

  const result = await response.json();

  // If async job, poll for completion
  if (result.async && result.jobId && result.status !== 'completed' && result.status !== 'partial') {
    return await pollBatchSearchUntilComplete(result.jobId, onProgress);
  }

  return result;
};

/**
 * List recent batch search jobs for the current user.
 * 
 * @param {number} [limit=10] - Maximum number of jobs to return
 * @returns {Promise<Object>} List of jobs
 */
export const listBatchSearchJobs = async (limit = 10) => {
  const url = buildSearchApiUrl(`/batch-search/jobs?limit=${limit}`);

  const response = await authenticatedFetch(
    url,
    { method: 'GET' },
    'search'
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to list batch search jobs',
    }));
    throw new Error(error.message || `Failed to list jobs: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get the status of a batch search job.
 * 
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job status
 */
export const getBatchSearchStatus = async (jobId) => {
  if (!jobId) {
    throw new Error('jobId is required');
  }

  const url = buildSearchApiUrl(`/batch-search/status/${jobId}`);

  const response = await authenticatedFetch(
    url,
    { method: 'GET' },
    'search'
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to get batch search status',
    }));
    throw new Error(error.message || `Failed to get status: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get the full results of a completed batch search job.
 * 
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job results
 */
export const getBatchSearchResults = async (jobId) => {
  if (!jobId) {
    throw new Error('jobId is required');
  }

  const url = buildSearchApiUrl(`/batch-search/results/${jobId}`);

  const response = await authenticatedFetch(
    url,
    { method: 'GET' },
    'search'
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to get batch search results',
    }));
    throw new Error(error.message || `Failed to get results: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Retry failed items from a batch search job.
 * 
 * @param {string} jobId - Original job ID
 * @param {Function} [onProgress] - Optional progress callback
 * @returns {Promise<Object>} Retry job results
 */
export const retryBatchSearch = async (jobId, onProgress = null) => {
  if (!jobId) {
    throw new Error('jobId is required');
  }

  const url = buildSearchApiUrl(`/batch-search/retry/${jobId}`);

  const response = await authenticatedFetch(
    url,
    { method: 'POST' },
    'search'
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to retry batch search',
    }));
    throw new Error(error.message || `Failed to retry: ${response.statusText}`);
  }

  const result = await response.json();

  // If async, poll for completion
  if (result.jobId && result.status !== 'completed' && result.status !== 'partial') {
    return await pollBatchSearchUntilComplete(result.jobId, onProgress);
  }

  return result;
};

/**
 * Cancel an in-progress batch search job.
 * 
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Cancellation result
 */
export const cancelBatchSearch = async (jobId) => {
  if (!jobId) {
    throw new Error('jobId is required');
  }

  const url = buildSearchApiUrl(`/batch-search/cancel/${jobId}`);

  const response = await authenticatedFetch(
    url,
    { method: 'POST' },
    'search'
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to cancel batch search',
    }));
    throw new Error(error.message || `Failed to cancel: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Delete a batch search job from the database.
 * Only works for completed, failed, cancelled, or partial jobs.
 * 
 * @param {string} jobId - Job ID to delete
 * @returns {Promise<Object>} Delete result
 */
export const deleteBatchSearchJob = async (jobId) => {
  if (!jobId) {
    throw new Error('jobId is required');
  }

  const url = buildSearchApiUrl(`/batch-search/jobs/${jobId}`);

  const response = await authenticatedFetch(
    url,
    { method: 'DELETE' },
    'search'
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to delete batch search job',
    }));
    throw new Error(error.message || `Failed to delete: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Save user's match selections for a batch search job.
 * This allows users to save their progress and come back later.
 * 
 * @param {string} jobId - Job ID
 * @param {Object} selections - Object mapping item index to selected match ID
 * @returns {Promise<Object>} Save result
 */
export const saveBatchSearchSelections = async (jobId, selections) => {
  if (!jobId) {
    throw new Error('jobId is required');
  }

  const url = buildSearchApiUrl(`/batch-search/jobs/${jobId}/selections`);

  const response = await authenticatedFetch(
    url,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selections }),
    },
    'search'
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to save selections',
    }));
    throw new Error(error.message || `Failed to save: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Resume a partial or interrupted batch search job.
 * 
 * @param {string} jobId - Job ID to resume
 * @param {Function} [onProgress] - Optional progress callback
 * @returns {Promise<Object>} Resume result
 */
export const resumeBatchSearch = async (jobId, onProgress = null) => {
  if (!jobId) {
    throw new Error('jobId is required');
  }

  const url = buildSearchApiUrl(`/batch-search/resume/${jobId}`);

  const response = await authenticatedFetch(
    url,
    { method: 'POST' },
    'search'
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to resume batch search',
    }));
    throw new Error(error.message || `Failed to resume: ${response.statusText}`);
  }

  const result = await response.json();

  // If async (202), poll for completion
  if (response.status === 202 && result.jobId) {
    return await pollBatchSearchUntilComplete(result.jobId, onProgress);
  }

  return result;
};

/**
 * Poll a batch search job until it completes.
 * 
 * @param {string} jobId - Job ID to poll
 * @param {Function} [onProgress] - Optional callback for progress updates
 * @param {number} [maxAttempts=120] - Maximum polling attempts (default: 120 = 4 minutes at 2s intervals)
 * @param {number} [intervalMs=2000] - Polling interval in milliseconds
 * @returns {Promise<Object>} Final job results
 */
export const pollBatchSearchUntilComplete = async (
  jobId,
  onProgress = null,
  maxAttempts = 120,
  intervalMs = 2000
) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const status = await getBatchSearchStatus(jobId);

      // Call progress callback if provided
      if (onProgress) {
        onProgress({
          jobId,
          status: status.status,
          processed: status.progress?.processed || 0,
          total: status.progress?.total || 0,
          successful: status.progress?.successful || 0,
          failed: status.progress?.failed || 0,
        });
      }

      // Check if job is complete
      if (status.status === 'completed' || status.status === 'partial' || status.status === 'failed') {
        // Get full results
        const results = await getBatchSearchResults(jobId);
        return results;
      }

      // Check if cancelled
      if (status.status === 'cancelled') {
        throw new Error('Batch search was cancelled');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;

    } catch (error) {
      // If it's a terminal error (not network), throw immediately
      if (error.message && (
        error.message.includes('cancelled') ||
        error.message.includes('not found')
      )) {
        throw error;
      }

      // For network errors, retry up to maxAttempts
      console.warn(`[pollBatchSearch] Attempt ${attempts + 1}/${maxAttempts} failed:`, error.message);

      if (attempts >= maxAttempts - 1) {
        throw new Error(`Batch search polling failed after ${maxAttempts} attempts: ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    }
  }

  throw new Error(`Batch search timed out after ${maxAttempts * intervalMs / 1000} seconds`);
};

