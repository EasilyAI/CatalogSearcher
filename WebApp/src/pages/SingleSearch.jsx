import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddToQuotationDialog from '../components/AddToQuotationDialog';
import { mockSearchResults, getSearchResultsByType, getTopSearchResults } from '../data/mockSearchResults';
import './SingleSearch.css';

const SingleSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [productType, setProductType] = useState('All Types');
  const [resultsCount, setResultsCount] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCountDropdown, setShowCountDropdown] = useState(false);

  const productTypes = ['All Types', 'Valve', 'Tube', 'Cylinder', 'Fitting', 'Regulator', 'Seal', 'Gasket', 'Coupling', 'Hose'];

  // Get search results from centralized data
  const allSearchResults = getSearchResultsByType(productType);
  const searchResults = allSearchResults.slice(0, resultsCount);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setHasSearched(true);
      setLastSearchQuery(searchQuery);
      console.log('Searching for:', searchQuery);
    }
  };

  const handleClearResults = () => {
    setHasSearched(false);
    setSearchQuery('');
    setLastSearchQuery('');
    setProductType('All Types');
    setResultsCount(5);
  };

  const handleAddToQuotation = (product) => {
    setSelectedProduct({
      name: product.productName,
      orderingNo: product.orderingNo
    });
    setDialogOpen(true);
  };

  const handleSelectQuotation = (quotationId) => {
    // Create quotation item from selected product
    const quotationItem = {
      orderNo: 1, // Will be adjusted in the quotation page
      orderingNumber: selectedProduct?.orderingNo || '',
      requestedItem: selectedProduct?.name || '',
      productName: selectedProduct?.name || '',
      productType: 'Valve', // Default, can be changed in quotation
      quantity: 1,
      price: 0, // Price to be filled in quotation
      margin: 20,
      sketchFile: null,
      catalogLink: '',
      notes: 'Added from single search',
      isIncomplete: false
    };

    // Navigate to edit quotation with the new item
    navigate(`/quotations/edit/${quotationId}`, { 
      state: { 
        newItem: quotationItem,
        source: 'single-search'
      } 
    });
  };

  const handleCreateNew = () => {
    // Create quotation item from selected product
    const quotationItem = {
      orderNo: 1,
      orderingNumber: selectedProduct?.orderingNo || '',
      requestedItem: selectedProduct?.name || '',
      productName: selectedProduct?.name || '',
      productType: 'Valve',
      quantity: 1,
      price: 0,
      margin: 20,
      sketchFile: null,
      catalogLink: '',
      notes: 'Added from single search',
      isIncomplete: false
    };

    // Navigate to new quotation with this item
    navigate('/quotations/edit/new', { 
      state: { 
        items: [quotationItem],
        customer: 'New Customer',
        source: 'single-search'
      } 
    });
  };

  const handleProductClick = (orderingNo) => {
    navigate(`/product/${orderingNo}`);
  };

  return (
    <div className="single-search-page">
      <div className="single-search-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <button onClick={() => navigate('/dashboard')} className="breadcrumb-link">Home</button>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Single Search</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-next">Add to Quotation</span>
        </div>

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
            <div className="dropdown-wrapper">
              <button 
                className="filter-dropdown"
                onClick={() => setShowProductDropdown(!showProductDropdown)}
              >
                <span>{productType}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showProductDropdown && (
                <div className="dropdown-menu">
                  {productTypes.map(type => (
                    <div 
                      key={type}
                      className="dropdown-item"
                      onClick={() => {
                        setProductType(type);
                        setShowProductDropdown(false);
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="dropdown-wrapper">
              <button 
                className="filter-dropdown"
                onClick={() => setShowCountDropdown(!showCountDropdown)}
              >
                <span>Top {resultsCount}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showCountDropdown && (
                <div className="dropdown-menu">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(count => (
                    <div 
                      key={count}
                      className="dropdown-item"
                      onClick={() => {
                        setResultsCount(count);
                        setShowCountDropdown(false);
                      }}
                    >
                      Top {count}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

        {/* Search Results Section - Only shown after search */}
        {hasSearched && (
          <>
            {/* Search Results Header */}
            <div className="results-header">
              <div className="results-header-content">
                <div>
                  <h2 className="results-title">Search Results</h2>
                  {lastSearchQuery && (
                    <p className="search-query-display">
                      Showing results for: <span className="query-text">"{lastSearchQuery}"</span>
                    </p>
                  )}
                </div>
                <button className="clear-results-button" onClick={handleClearResults}>
                  Clear Results
                </button>
              </div>
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
                          <button 
                            className="ordering-link"
                            onClick={() => handleProductClick(result.orderingNo)}
                          >
                            {result.orderingNo}
                          </button>
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
                          <div className="action-buttons-wrapper">
                            <button 
                              className="action-btn-primary"
                              onClick={() => handleAddToQuotation(result)}
                            >
                              Add To Quotation
                            </button>
                            <div className="action-buttons-secondary">
                              <button className="action-btn-icon" title="Open Catalog">
                                📄
                              </button>
                              <button className="action-btn-icon" title="Swagelok Site">
                                🌐
                              </button>
                              <button className="action-btn-icon" title="Open Sketch">
                                📐
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
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
