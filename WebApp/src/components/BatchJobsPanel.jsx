import React, { useState, useEffect, useCallback, useRef } from 'react';
import { listBatchSearchJobs, getBatchSearchResults, resumeBatchSearch, cancelBatchSearch, deleteBatchSearchJob } from '../services/batchSearchService';
import './BatchJobsPanel.css';

/**
 * BatchJobsPanel - Shows batch search jobs with status and actions
 * 
 * Now supports two modes:
 * - sidebar: Permanent sidebar on the page (default)
 * - dropdown: Dropdown toggle button
 * 
 * Features:
 * - List recent jobs (last 10)
 * - Show job status with visual indicators
 * - Resume button for PARTIAL/PROCESSING jobs
 * - View Results button for COMPLETED jobs
 * - Cancel button for PROCESSING jobs
 * - Auto-refresh when jobs are in progress
 */
const BatchJobsPanel = ({ 
  onLoadJobResults, 
  onJobResumed,
  mode = 'sidebar' // 'sidebar' or 'dropdown'
}) => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef(null);

  // Fetch jobs on mount and periodically
  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listBatchSearchJobs(10);
      // Sort jobs by createdAt descending (most recent first)
      const sortedJobs = (response.jobs || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setJobs(sortedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    
    // Refresh more frequently when there are active jobs
    const hasActiveJobs = jobs.some(j => 
      j.status === 'processing' || j.status === 'pending'
    );
    const refreshInterval = hasActiveJobs ? 5000 : 30000;
    
    const interval = setInterval(fetchJobs, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchJobs, jobs.length]);

  // Close dropdown when clicking outside (only for dropdown mode)
  useEffect(() => {
    if (mode !== 'dropdown') return;
    
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, mode]);

  // Handle viewing results of a completed job
  const handleViewResults = async (jobId) => {
    try {
      setActionInProgress(jobId);
      const results = await getBatchSearchResults(jobId);
      if (onLoadJobResults) {
        onLoadJobResults(results);
      }
      setIsOpen(false);
    } catch (err) {
      console.error('Error loading job results:', err);
      setError(err.message || 'Failed to load results');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle resuming a partial/processing job
  const handleResumeJob = async (jobId) => {
    try {
      setActionInProgress(jobId);
      const result = await resumeBatchSearch(jobId, (progress) => {
        setJobs(prev => prev.map(j => 
          j.jobId === jobId 
            ? { ...j, processedItems: progress.processed, status: progress.status }
            : j
        ));
      });
      
      if (onJobResumed) {
        onJobResumed(result);
      }
      setIsOpen(false);
      await fetchJobs();
    } catch (err) {
      console.error('Error resuming job:', err);
      setError(err.message || 'Failed to resume job');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle cancelling a processing job
  const handleCancelJob = async (jobId) => {
    try {
      setActionInProgress(jobId);
      await cancelBatchSearch(jobId);
      await fetchJobs();
    } catch (err) {
      console.error('Error cancelling job:', err);
      setError(err.message || 'Failed to cancel job');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle deleting a job
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This cannot be undone.')) {
      return;
    }
    try {
      setActionInProgress(jobId);
      await deleteBatchSearchJob(jobId);
      await fetchJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err.message || 'Failed to delete job');
    } finally {
      setActionInProgress(null);
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'processing': return 'status-processing';
      case 'partial': return 'status-partial';
      case 'failed': return 'status-failed';
      case 'cancelled': return 'status-cancelled';
      case 'pending': return 'status-pending';
      default: return 'status-unknown';
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'processing': return 'Processing';
      case 'partial': return 'Partial';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending';
      default: return status || 'Unknown';
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Count jobs that need attention (processing or partial)
  const activeJobsCount = jobs.filter(j => 
    j.status === 'processing' || j.status === 'partial' || j.status === 'pending'
  ).length;

  // Render job item
  const renderJobItem = (job) => {
    const isActioning = actionInProgress === job.jobId;
    const canResume = job.status === 'partial' || job.status === 'processing';
    const canView = job.status === 'completed' || job.status === 'partial';
    const canCancel = job.status === 'processing' || job.status === 'pending';
    // Can delete if not actively processing
    const canDelete = !['processing', 'pending'].includes(job.status);
    const progress = job.totalItems > 0 
      ? Math.round((job.processedItems / job.totalItems) * 100) 
      : 0;

    return (
      <div key={job.jobId} className={`dropdown-job-item ${job.status}`}>
        <div className="job-main-info">
          <div className="job-top-row">
            <span className="job-name" title={job.fileName || job.jobId}>
              {job.fileName || `Job ${job.jobId.slice(0, 8)}...`}
            </span>
            <span className={`job-status-badge ${getStatusClass(job.status)}`}>
              {getStatusText(job.status)}
            </span>
          </div>
          <div className="job-bottom-row">
            <span className="job-items-count">
              {job.processedItems || 0}/{job.totalItems || 0} items
            </span>
            <span className="job-timestamp">{formatDate(job.createdAt)}</span>
          </div>
          {(job.status === 'processing' || job.status === 'partial') && (
            <div className="job-mini-progress">
              <div 
                className="job-mini-progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="job-action-buttons">
          {canView && (
            <button
              className="job-btn view"
              onClick={() => handleViewResults(job.jobId)}
              disabled={isActioning}
              title="View Results"
            >
              {isActioning ? (
                <div className="btn-mini-spinner" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
          {canResume && (
            <button
              className="job-btn resume"
              onClick={() => handleResumeJob(job.jobId)}
              disabled={isActioning}
              title="Resume Job"
            >
              {isActioning ? (
                <div className="btn-mini-spinner" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
          )}
          {canCancel && (
            <button
              className="job-btn cancel"
              onClick={() => handleCancelJob(job.jobId)}
              disabled={isActioning}
              title="Cancel Job"
            >
              {isActioning ? (
                <div className="btn-mini-spinner" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </button>
          )}
          {canDelete && (
            <button
              className="job-btn delete"
              onClick={() => handleDeleteJob(job.jobId)}
              disabled={isActioning}
              title="Delete Job"
            >
              {isActioning ? (
                <div className="btn-mini-spinner" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render jobs list
  const renderJobsList = () => {
    if (isLoading && jobs.length === 0) {
      return (
        <div className="dropdown-loading">
          <div className="loading-spinner" />
          <span>Loading jobs...</span>
        </div>
      );
    }

    if (jobs.length === 0) {
      return (
        <div className="dropdown-empty">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span>No recent jobs</span>
        </div>
      );
    }

    return jobs.map(renderJobItem);
  };

  // SIDEBAR MODE
  if (mode === 'sidebar') {
    return (
      <div className={`batch-jobs-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            {!isCollapsed && (
              <span className="sidebar-title">Recent Jobs</span>
            )}
            {isCollapsed && (
              <span className="sidebar-title-collapsed">Jobs</span>
            )}
            {activeJobsCount > 0 && !isCollapsed && (
              <span className="sidebar-badge active">{activeJobsCount}</span>
            )}
          </div>
          <div className="sidebar-actions">
            {!isCollapsed && (
              <button 
                className="sidebar-action-btn"
                onClick={fetchJobs}
                disabled={isLoading}
                title="Refresh"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLoading ? 'spinning' : ''}>
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            )}
            <button 
              className="sidebar-action-btn collapse-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isCollapsed ? (
                  <polyline points="9 18 15 12 9 6" />
                ) : (
                  <polyline points="15 18 9 12 15 6" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {error && !isCollapsed && (
          <div className="sidebar-error">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {!isCollapsed && (
          <div className="sidebar-jobs-list">
            {renderJobsList()}
          </div>
        )}
      </div>
    );
  }

  // DROPDOWN MODE (original behavior)
  return (
    <div className="batch-jobs-dropdown" ref={panelRef}>
      {/* Toggle Button */}
      <button 
        className={`jobs-toggle-btn ${isOpen ? 'active' : ''} ${activeJobsCount > 0 ? 'has-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Recent Jobs"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span>Recent Jobs</span>
        {jobs.length > 0 && (
          <span className={`jobs-count-badge ${activeJobsCount > 0 ? 'active' : ''}`}>
            {activeJobsCount > 0 ? activeJobsCount : jobs.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="jobs-dropdown-panel">
          <div className="dropdown-header">
            <h4 className="dropdown-title">Recent Jobs</h4>
            <button 
              className="dropdown-refresh-btn"
              onClick={fetchJobs}
              disabled={isLoading}
              title="Refresh"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLoading ? 'spinning' : ''}>
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="dropdown-error">
              <span>{error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          <div className="dropdown-jobs-list">
            {renderJobsList()}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchJobsPanel;
