import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDraftQuotations, getRecentQuotations } from '../data/mockQuotations';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('open-drafts');

  const draftQuotations = getDraftQuotations();
  const recentQuotations = getRecentQuotations(3);
  
  const displayedQuotations = activeTab === 'open-drafts' ? draftQuotations : recentQuotations;

  const uploads = [
    {
      id: 1,
      fileName: 'OringSwaglok',
      productType: 'o-ring',
      createdAt: '2024-01-22',
      status: 'In Progress'
    },
    {
      id: 2,
      fileName: 'CylindersV2',
      productType: 'cylinder',
      createdAt: '2024-01-21',
      status: 'In Progress'
    }
  ];

  const handleNewQuotation = () => {
    navigate('/quotations/edit/new');
  };

  const handleSearchProduct = () => {
    navigate('/search');
  };

  const handleUploadFile = () => {
    navigate('/multi-search');
  };

  const handleEditQuotation = (id) => {
    navigate(`/quotations/edit/${id}`);
  };

  const handleDeleteQuotation = (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      // TODO: Implement delete API call
      console.log('Delete quotation:', id);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="dashboard-section welcome-section">
          <h1 className="dashboard-title">Welcome back, Yehuda</h1>
        </div>

        {/* Quick Actions Section */}
        <div className="dashboard-section quick-actions-header">
          <h2 className="section-title">Quick Actions</h2>
        </div>

        <div className="dashboard-section quick-actions">
          <div className="quick-actions-buttons">
            <button className="btn-primary" onClick={handleNewQuotation}>
              New Quotation
            </button>
            <button className="btn-secondary" onClick={handleSearchProduct}>
              Search Product
            </button>
            <button className="btn-secondary" onClick={handleUploadFile}>
              Upload file
            </button>
          </div>
        </div>

        {/* Quotations Section */}
        <div className="dashboard-section quotations-header">
          <h2 className="section-title">Continue Your Work</h2>
          <p className="section-subtitle">Pick up where you left off with your quotations</p>
        </div>

        {/* Tabs */}
        <div className="dashboard-section tabs-section">
          <div className="tabs-container">
            <button
              className={`tab ${activeTab === 'open-drafts' ? 'active' : ''}`}
              onClick={() => setActiveTab('open-drafts')}
            >
              <span className="tab-icon">✏️</span>
              Open Drafts ({draftQuotations.length})
            </button>
            <button
              className={`tab ${activeTab === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveTab('recent')}
            >
              <span className="tab-icon">📋</span>
              Recent
            </button>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="dashboard-section table-section">
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="col-quotation-name">Quotation Name</th>
                  <th className="col-created-at">Created at</th>
                  <th className="col-customer">Customer</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedQuotations.map((quotation) => (
                  <tr key={quotation.id} className={quotation.incompleteItems > 0 ? 'has-incomplete' : ''}>
                    <td className="col-quotation-name">
                      <div className="quotation-name-cell">
                        {quotation.name}
                        {quotation.incompleteItems > 0 && (
                          <span className="incomplete-badge-small">{quotation.incompleteItems} incomplete</span>
                        )}
                      </div>
                    </td>
                    <td className="col-created-at text-secondary">{quotation.createdDate}</td>
                    <td className="col-customer text-secondary">{quotation.customer}</td>
                    <td className="col-actions">
                      <div className="action-links">
                        <button 
                          className="action-link primary-action"
                          onClick={() => handleEditQuotation(quotation.id)}
                        >
                          {quotation.incompleteItems > 0 ? 'Continue →' : 'Edit'}
                        </button>
                        <button 
                          className="action-link danger"
                          onClick={() => handleDeleteQuotation(quotation.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* See All Link */}
        <div className="dashboard-section see-all-section">
          <button className="see-all-link" onClick={() => navigate('/quotations')}>
            See all quotations
          </button>
        </div>

        {/* Uploads Section */}
        <div className="dashboard-section uploads-header">
          <h2 className="section-title">Uploads - In progress</h2>
        </div>

        {/* Uploads Table */}
        <div className="dashboard-section table-section">
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="col-file-name">File Name</th>
                  <th className="col-product-type">Product Type</th>
                  <th className="col-created-at">Created at</th>
                  <th className="col-status">Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr key={upload.id}>
                    <td className="col-file-name">{upload.fileName}</td>
                    <td className="col-product-type text-secondary">{upload.productType}</td>
                    <td className="col-created-at text-secondary">{upload.createdAt}</td>
                    <td className="col-status">
                      <div className="status-badge info">
                        {upload.status}
                      </div>
                    </td>
                    <td className="col-actions">
                      <div className="action-links">
                        <button className="action-link">Keep</button>
                        <button className="action-link">Edit</button>
                        <button className="action-link">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* See All Link */}
        <div className="dashboard-section see-all-section">
          <button className="see-all-link" onClick={() => navigate('/files')}>
            See all catalogs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

