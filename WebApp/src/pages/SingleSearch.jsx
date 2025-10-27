import React, { useState } from 'react';
import AddToQuotationDialog from '../components/AddToQuotationDialog';
import './SingleSearch.css';

const SingleSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [productType, setProductType] = useState('All Types');
  const [resultsCount, setResultsCount] = useState('Top 5');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const searchResults = [
    {
      id: 1,
      productName: 'Advanced Industrial Motor',
      orderingNo: 'SS-109-12345',
      confidence: 85,
      type: 'Valve',
      specifications: 'Material: SS360 Pressure: 230 psi'
    },
    {
      id: 2,
      productName: 'high pressure NPT valve',
      orderingNo: 'SS-10-2345',
      confidence: 85,
      type: 'Valve',
      specifications: 'Material: SS360 Pressure: 230 psi'
    },
    {
      id: 3,
      productName: 'half tube valve',
      orderingNo: 'HT-360-S98FT',
      confidence: 85,
      type: 'Valve',
      specifications: 'Material: SS360 Pressure: 230 psi'
    },
    {
      id: 4,
      productName: 'king of valves',
      orderingNo: 'KOV-SS-106',
      confidence: 85,
      type: 'Valve',
      specifications: 'Material: SS360 Pressure: 230 psi'
    },
    {
      id: 5,
      productName: 'valvushuvi',
      orderingNo: 'A12345',
      confidence: 85,
      type: 'Valve',
      specifications: 'Material: SS360 Pressure: 230 psi'
    }
  ];

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
  };

  const handleAddToQuotation = (product) => {
    setSelectedProduct({
      name: product.productName,
      orderingNo: product.orderingNo
    });
    setDialogOpen(true);
  };

  const handleSelectQuotation = (quotationId) => {
    console.log(`Product added to quotation: ${quotationId}`);
    alert(`Product "${selectedProduct?.name}" added to ${quotationId}`);
  };

  const handleCreateNew = () => {
    console.log('Creating new quotation...');
    alert('Creating new quotation...');
  };

  return (
    <div className="single-search-page">
      <div className="single-search-content">
        {/* Page Header */}
        <div className="search-header">
          <div className="search-header-text">
            <h1 className="search-title">Single Product Search & Verification</h1>
            <p className="search-subtitle">
              Locate and verify a single product using a free-text query or ordering number.
            </p>
          </div>
        </div>

        {/* Search Bar Section */}
        <div className="search-bar-section">
          <div className="search-input-wrapper">
            <div className="search-icon-container">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="Search by free-text query or ordering number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="search-filters">
            <button className="filter-dropdown">
              <span>Product type</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="filter-dropdown">
              <span>Top 5</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search Results Header */}
        <div className="results-header">
          <h2 className="results-title">Search Results</h2>
        </div>

        {/* Search Results Table */}
        <div className="results-table-section">
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th className="col-product-name">Product Name</th>
                  <th className="col-ordering-no">Ordering No.</th>
                  <th className="col-confidence">Confidence</th>
                  <th className="col-type">Type</th>
                  <th className="col-specifications">Specifications</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result) => (
                  <tr key={result.id}>
                    <td className="col-product-name">{result.productName}</td>
                    <td className="col-ordering-no">
                      <a href="#" className="ordering-link">{result.orderingNo}</a>
                    </td>
                    <td className="col-confidence">
                      <div className="confidence-wrapper">
                        <div className="confidence-bar-bg">
                          <div 
                            className="confidence-bar-fill" 
                            style={{ width: `${result.confidence}%` }}
                          ></div>
                        </div>
                        <span className="confidence-value">{result.confidence}</span>
                      </div>
                    </td>
                    <td className="col-type text-secondary">{result.type}</td>
                    <td className="col-specifications text-secondary">{result.specifications}</td>
                    <td className="col-actions">
                      <div className="action-buttons-grid">
                        <button 
                          className="btn-primary action-btn"
                          onClick={() => handleAddToQuotation(result)}
                        >
                          Add To Quotation
                        </button>
                        <button className="btn-secondary action-btn">
                          Open Catalog
                        </button>
                        <button className="btn-secondary action-btn">
                          Swaglok Site
                        </button>
                        <button className="btn-secondary action-btn">
                          Open Sketch
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add to Quotation Dialog */}
      <AddToQuotationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productName={selectedProduct?.name}
        orderingNo={selectedProduct?.orderingNo}
        onSelectQuotation={handleSelectQuotation}
        onCreateNew={handleCreateNew}
      />
    </div>
  );
};

export default SingleSearch;
