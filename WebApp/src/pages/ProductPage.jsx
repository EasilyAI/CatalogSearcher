import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductByOrderingNo } from '../data/mockProducts';
import './ProductPage.css';

const ProductPage = () => {
  const { orderingNo } = useParams();
  const navigate = useNavigate();

  // Get product data from centralized mock data
  const product = getProductByOrderingNo(orderingNo);
  
  // If product not found, show default data
  const productDetails = product || {
    orderingNo: orderingNo,
    productName: 'Product Not Found',
    type: 'Unknown',
    manufacturer: 'Unknown',
    description: 'Product details not available.',
    specifications: {},
    price: 0,
    catalogPage: 'N/A',
    image: null,
    sources: []
  };

  // State for editable specifications
  const [specifications, setSpecifications] = useState(productDetails.specifications);
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const handleSpecChange = (key, value) => {
    setSpecifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRemoveSpec = (key) => {
    const newSpecs = { ...specifications };
    delete newSpecs[key];
    setSpecifications(newSpecs);
  };

  const handleAddSpec = () => {
    if (newSpecKey && newSpecValue) {
      setSpecifications(prev => ({
        ...prev,
        [newSpecKey]: newSpecValue
      }));
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const formatLabel = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="product-page">
      <div className="product-content">
        {/* Back Button */}
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Results
        </button>

        {/* Product Header */}
        <div className="product-header">
          <div className="product-title-section">
            <h1 className="product-title">{productDetails.productName}</h1>
            <p className="product-ordering-no">Ordering No: <span>{productDetails.orderingNo}</span></p>
            <div className="product-badges">
              <span className="product-badge type-badge">{productDetails.type}</span>
            </div>
          </div>
          <div className="product-price-section">
            <p className="product-price-label">Manufacturer's Price</p>
            <p className="product-price">${productDetails.price.toFixed(2)}</p>
            <p className="product-price-source">From {productDetails.sources.find(s => s.hasPrice)?.year || 'N/A'} Price List</p>
          </div>
        </div>

        {/* Product Details */}
        <div className="product-details-grid">
          {/* Product Image and Description */}
          <div className="product-image-section">
            <div className="product-image-wrapper">
              <img 
                src={productDetails.image} 
                alt={productDetails.productName}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="image-placeholder">📦<p>Product Image</p></div>';
                }}
              />
            </div>
            
            <div className="info-card">
              <h3 className="info-card-title">Description</h3>
              <p className="product-description">{productDetails.description}</p>
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info-section">
            <div className="info-card">
              <h3 className="info-card-title">Product Information & Sources</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Manufacturer:</span>
                  <span className="info-value">{productDetails.manufacturer}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Type:</span>
                  <span className="info-value">{productDetails.type}</span>
                </div>
              </div>
              
              <div className="sources-section">
                <h4 className="sources-title">Sources of Information</h4>
                <div className="sources-list">
                  {productDetails.sources.map((source, index) => (
                    <a key={index} href={source.link} className="source-item">
                      <div className="source-info">
                        <span className="source-type">{source.type} ({source.year})</span>
                        {source.pages && <span className="source-pages">{source.pages}</span>}
                        {source.hasPrice && <span className="source-badge">Current Price</span>}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="specs-header">
                <h3 className="info-card-title">Technical Specifications</h3>
                <button 
                  className="edit-specs-button"
                  onClick={() => setIsEditingSpecs(!isEditingSpecs)}
                >
                  {isEditingSpecs ? 'Done Editing' : 'Edit Specifications'}
                </button>
              </div>
              <div className="specs-grid-dense">
                {Object.entries(specifications).map(([key, value]) => (
                  <div key={key} className="spec-item-dense">
                    <span className="spec-label-dense">{formatLabel(key)}:</span>
                    {isEditingSpecs ? (
                      <div className="spec-edit-controls">
                        <input 
                          type="text"
                          className="spec-input"
                          value={value}
                          onChange={(e) => handleSpecChange(key, e.target.value)}
                        />
                        <button 
                          className="remove-spec-button"
                          onClick={() => handleRemoveSpec(key)}
                          title="Remove specification"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <span className="spec-value-dense">{value}</span>
                    )}
                  </div>
                ))}
              </div>
              {isEditingSpecs && (
                <div className="add-spec-section">
                  <input
                    type="text"
                    placeholder="Field name"
                    className="spec-input"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    className="spec-input"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                  />
                  <button 
                    className="add-spec-button"
                    onClick={handleAddSpec}
                  >
                    + Add Field
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="product-actions">
          <button className="btn-primary-large">
            Add to Quotation
          </button>
          <button className="btn-secondary-large">
            View in Catalog
          </button>
          <button className="btn-secondary-large">
            Download Specifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;

