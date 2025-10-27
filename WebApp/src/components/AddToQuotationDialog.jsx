import React, { useState, useMemo } from 'react';
import { mockQuotations } from '../data/mockQuotations';
import './AddToQuotationDialog.css';

const AddToQuotationDialog = ({
  open,
  onOpenChange,
  productName,
  orderingNo,
  onSelectQuotation,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuotations = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockQuotations;
    }
    
    const query = searchQuery.toLowerCase();
    return mockQuotations.filter(
      (q) =>
        q.name.toLowerCase().includes(query) ||
        q.quotationNumber.toLowerCase().includes(query) ||
        q.customer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelectQuotation = (quotationId) => {
    onSelectQuotation?.(quotationId);
    onOpenChange(false);
    setSearchQuery('');
  };

  const handleCreateNew = () => {
    onCreateNew?.();
    onOpenChange(false);
    setSearchQuery('');
  };

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={() => onOpenChange(false)}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">Add to Quotation</h2>
          {(productName || orderingNo) && (
            <p className="dialog-subtitle">
              {productName && <span>{productName}</span>}
              {productName && orderingNo && <span> • </span>}
              {orderingNo && <span>{orderingNo}</span>}
            </p>
          )}
          <button 
            className="dialog-close"
            onClick={() => onOpenChange(false)}
          >
            ×
          </button>
        </div>

        <div className="dialog-body">
          {/* Search Input */}
          <div className="search-container">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              placeholder="Search quotations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Quotation List */}
          <div className="quotation-list">
            {filteredQuotations.map((quotation, index) => (
              <button
                key={quotation.id}
                onClick={() => handleSelectQuotation(quotation.id)}
                className={`quotation-item ${index !== 0 ? 'quotation-item-border' : ''}`}
              >
                <div className="quotation-header">
                  <span className="quotation-name">{quotation.name}</span>
                  <span className={`quotation-status status-${quotation.status.replace(/ /g, '-')}`}>
                    {quotation.status.replace(/-/g, ' ').toUpperCase()}
                  </span>
                </div>
                <div className="quotation-details">
                  <span>{quotation.quotationNumber}</span>
                  <span>•</span>
                  <span>{quotation.customer}</span>
                  <span>•</span>
                  <span>{quotation.itemCount} items</span>
                  <span>•</span>
                  <span>{quotation.createdDate}</span>
                </div>
              </button>
            ))}

            {/* No Results Message */}
            {filteredQuotations.length === 0 && searchQuery && (
              <div className="no-results">
                No quotations found matching "{searchQuery}"
              </div>
            )}

            {/* New Quotation Option */}
            <button
              onClick={handleCreateNew}
              className="create-new-quotation"
            >
              <div className="create-new-icon">+</div>
              <span>Create New Quotation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToQuotationDialog;
