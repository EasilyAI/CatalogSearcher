import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockQuotations } from '../data/mockQuotations';
import './Quotations.css';

const Quotations = () => {
  const navigate = useNavigate();
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const statusLabels = {
    'searching items': 'Searching Items',
    'inventory check': 'Inventory Check',
    'sent for confirmation': 'Sent for Confirmation',
    'done': 'Done'
  };

  const filteredQuotations = mockQuotations.filter(q => {
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    const matchesSearch = q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: mockQuotations.length,
    'searching items': mockQuotations.filter(q => q.status === 'searching items').length,
    'inventory check': mockQuotations.filter(q => q.status === 'inventory check').length,
    'sent for confirmation': mockQuotations.filter(q => q.status === 'sent for confirmation').length,
    'done': mockQuotations.filter(q => q.status === 'done').length
  };

  const handleCreateNew = () => {
    navigate('/quotations/edit/new');
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
    <div className="quotations-page">
      <div className="quotations-content">
        {/* Header Section */}
        <div className="quotations-section header-section">
          <div className="header-content">
            <h1 className="page-title">Quotations</h1>
            <button onClick={handleCreateNew} className="btn-primary">
              New Quotation
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="quotations-section filters-section">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search quotations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="quotations-section tabs-section">
          <div className="tabs-container">
            <button
              className={`tab ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({statusCounts.all})
            </button>
            <button
              className={`tab ${filterStatus === 'searching items' ? 'active' : ''}`}
              onClick={() => setFilterStatus('searching items')}
            >
              Searching ({statusCounts['searching items']})
            </button>
            <button
              className={`tab ${filterStatus === 'inventory check' ? 'active' : ''}`}
              onClick={() => setFilterStatus('inventory check')}
            >
              Inventory ({statusCounts['inventory check']})
            </button>
            <button
              className={`tab ${filterStatus === 'sent for confirmation' ? 'active' : ''}`}
              onClick={() => setFilterStatus('sent for confirmation')}
            >
              Confirmation ({statusCounts['sent for confirmation']})
            </button>
            <button
              className={`tab ${filterStatus === 'done' ? 'active' : ''}`}
              onClick={() => setFilterStatus('done')}
            >
              Done ({statusCounts.done})
            </button>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="quotations-section table-section">
          <div className="table-wrapper">
            <table className="quotations-table">
              <thead>
                <tr>
                  <th className="col-quotation-name">Quotation Name</th>
                  <th className="col-customer">Customer</th>
                  <th className="col-items">Items</th>
                  <th className="col-value">Total Value</th>
                  <th className="col-status">Status</th>
                  <th className="col-created">Created</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p>No quotations found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((quotation) => (
                    <tr key={quotation.id}>
                      <td className="col-quotation-name">
                        <div className="quotation-name-cell">
                          <span className="quotation-number">{quotation.quotationNumber}</span>
                          <span className="quotation-name">{quotation.name}</span>
                        </div>
                      </td>
                      <td className="col-customer text-secondary">{quotation.customer}</td>
                      <td className="col-items text-secondary">{quotation.itemCount}</td>
                      <td className="col-value">${quotation.totalValue.toFixed(2)}</td>
                      <td className="col-status">
                        <div className={`status-badge status-${quotation.status.replace(/ /g, '-')}`}>
                          {statusLabels[quotation.status]}
                        </div>
                      </td>
                      <td className="col-created text-secondary">{quotation.createdDate}</td>
                      <td className="col-actions">
                        <div className="action-links">
                          <button 
                            className="action-link"
                            onClick={() => handleEditQuotation(quotation.id)}
                          >
                            Edit
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quotations;
