import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductPage.css';

const ProductPage = () => {
  const { orderingNo } = useParams();
  const navigate = useNavigate();

  // Mock product data
  const productDetails = {
    orderingNo: orderingNo,
    productName: 'Advanced Industrial Motor',
    type: 'Valve',
    manufacturer: 'SwagelokPro Industries',
    description: 'High-performance industrial valve designed for demanding applications. Features precision engineering and durable construction for long-lasting performance.',
    specifications: {
      material: 'SS360 Stainless Steel',
      pressure: '230 psi',
      temperature: '-20°C to 150°C',
      connectionType: 'NPT Thread',
      portSize: '1/4 inch',
      weight: '0.5 kg'
    },
    price: '$125.99',
    availability: 'In Stock',
    leadTime: '2-3 business days',
    catalogPage: 'Catalog Page 47',
    image: '/images/HB 100 - digital.JPG'
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
              <span className="product-badge availability-badge">{productDetails.availability}</span>
            </div>
          </div>
          <div className="product-price-section">
            <p className="product-price-label">Price</p>
            <p className="product-price">{productDetails.price}</p>
            <p className="product-lead-time">Lead Time: {productDetails.leadTime}</p>
          </div>
        </div>

        {/* Product Details */}
        <div className="product-details-grid">
          {/* Product Image */}
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
          </div>

          {/* Product Info */}
          <div className="product-info-section">
            <div className="info-card">
              <h3 className="info-card-title">Product Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Manufacturer:</span>
                  <span className="info-value">{productDetails.manufacturer}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Type:</span>
                  <span className="info-value">{productDetails.type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Catalog Reference:</span>
                  <span className="info-value">{productDetails.catalogPage}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3 className="info-card-title">Description</h3>
              <p className="product-description">{productDetails.description}</p>
            </div>

            <div className="info-card">
              <h3 className="info-card-title">Technical Specifications</h3>
              <div className="specs-grid">
                {Object.entries(productDetails.specifications).map(([key, value]) => (
                  <div key={key} className="spec-item">
                    <span className="spec-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                    <span className="spec-value">{value}</span>
                  </div>
                ))}
              </div>
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

