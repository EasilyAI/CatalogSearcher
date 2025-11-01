import React, { useState } from 'react';
import { mockCatalogItems } from './src/data/mockCatalogItems';
import './CatalogReview.css';

const CatalogReview = () => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editableTexts, setEditableTexts] = useState({});

  // Use centralized catalog items data
  const products = mockCatalogItems.map(item => ({ ...item }));

  const toggleRowExpansion = (productId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(productId)) {
      newExpandedRows.delete(productId);
    } else {
      newExpandedRows.add(productId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleManualInputChange = (productId, value) => {
    setEditableTexts(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const handleSave = (productId) => {
    // Handle save logic here
    console.log(`Saving product ${productId}:`, editableTexts[productId]);
    // You can add API call here
  };

  const handleRemove = (productId) => {
    // Handle remove logic here
    console.log(`Removing product ${productId}`);
    // You can add API call here
  };

  return (
    <div className="catalog-review">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon"></div>
            <h1 className="app-title">HB Quotation assistant</h1>
          </div>
          <nav className="navigation">
            <a href="#" className="nav-link">Dashboard</a>
            <a href="#" className="nav-link">Projects</a>
            <a href="#" className="nav-link active">Catalogs</a>
            <a href="#" className="nav-link">Quotations</a>
            <a href="#" className="nav-link">Customers</a>
          </nav>
          <div className="header-actions">
            <div className="notification-icon"></div>
            <div className="user-avatar"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-container">
          {/* Page Header */}
          <div className="page-header">
            <h2 className="page-title">Catalog Product Review & Verification</h2>
            <p className="product-count">Total Products: {products.length}</p>
          </div>

          {/* Products Table */}
          <div className="table-container">
            <div className="table">
              {/* Table Header */}
              <div className="table-header">
                <div className="header-cell ordering-number">Ordering number</div>
                <div className="header-cell description">Description</div>
                <div className="header-cell spec">Spec</div>
                <div className="header-cell manual-input">Manual input</div>
                <div className="header-cell actions">Actions</div>
              </div>

              {/* Table Body */}
              <div className="table-body">
                {products.map((product) => (
                  <div key={product.id} className="table-row">
                    <div className="row-content">
                      <div className="cell ordering-number">
                        <span className="product-number">{product.orderingNumber}</span>
                      </div>
                      <div className="cell description">
                        <span className="product-description">{product.description}</span>
                      </div>
                      <div className="cell spec">
                        <span className="product-spec">{product.spec}</span>
                      </div>
                      <div className="cell manual-input">
                        <input
                          type="text"
                          value={editableTexts[product.id] || product.manualInput}
                          onChange={(e) => handleManualInputChange(product.id, e.target.value)}
                          className="editable-input"
                        />
                      </div>
                      <div className="cell actions">
                        <button 
                          className="action-btn save-btn"
                          onClick={() => handleSave(product.id)}
                        >
                          Save
                        </button>
                        <span className="action-separator">|</span>
                        <button 
                          className="action-btn remove-btn"
                          onClick={() => handleRemove(product.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Expandable Content */}
                    {expandedRows.has(product.id) && (
                      <div className="expanded-content">
                        <div className="expanded-details">
                          <div className="detail-section">
                            <h4>Additional Specifications</h4>
                            <p>{product.expandedContent.additionalSpecs}</p>
                          </div>
                          <div className="detail-section">
                            <h4>Manufacturer</h4>
                            <p>{product.expandedContent.manufacturer}</p>
                          </div>
                          <div className="detail-section">
                            <h4>Certifications</h4>
                            <p>{product.expandedContent.certifications}</p>
                          </div>
                          <div className="detail-section">
                            <h4>Notes</h4>
                            <p>{product.expandedContent.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expand/Collapse Button */}
                    <button 
                      className="expand-btn"
                      onClick={() => toggleRowExpansion(product.id)}
                    >
                      {expandedRows.has(product.id) ? '−' : '+'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button className="pagination-btn prev-btn">‹</button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <button className="pagination-btn next-btn">›</button>
          </div>

          {/* Add New Product Button */}
          <div className="add-product-section">
            <button className="add-product-btn">Add New Product</button>
          </div>

          {/* PDF Preview Section */}
          <div className="pdf-preview-section">
            <h3 className="pdf-preview-title">PDF Preview</h3>
            <p className="pdf-preview-subtitle">Open in new tab</p>
            <div className="pdf-preview-container">
              <div className="pdf-preview-placeholder">
                <h4>No PDF Preview Available</h4>
                <p>Please save the product details to generate a preview.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogReview;
