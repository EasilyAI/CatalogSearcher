import React, { useState, useMemo } from 'react';
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

  // Mock data for quotations
  const mockQuotations = [
    { id: "Q-2024-001", name: "Industrial Valve Project", createdDate: "2024-10-20", itemCount: 15, status: "open" },
    { id: "Q-2024-002", name: "High Pressure Systems", createdDate: "2024-10-22", itemCount: 8, status: "open" },
    { id: "Q-2024-003", name: "NPT Valve Assembly", createdDate: "2024-10-23", itemCount: 12, status: "open" },
    { id: "Q-2024-004", name: "Swaglok Components Q4", createdDate: "2024-10-25", itemCount: 23, status: "open" },
    { id: "Q-2024-005", name: "Motor and Valve Package", createdDate: "2024-10-26", itemCount: 6, status: "draft" },
    { id: "Q-2024-006", name: "SS360 Materials Order", createdDate: "2024-10-27", itemCount: 18, status: "open" },
  ];

  const filteredQuotations = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockQuotations;
    }
    
    const query = searchQuery.toLowerCase();
    return mockQuotations.filter(
      (q) =>
        q.name.toLowerCase().includes(query) ||
        q.id.toLowerCase().includes(query)
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
                  <span className={`quotation-status status-${quotation.status}`}>
                    {quotation.status.toUpperCase()}
                  </span>
                </div>
                <div className="quotation-details">
                  <span>{quotation.id}</span>
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
