import React, { useState } from 'react';
import './MultiItemSearch.css';

const MultiItemSearch = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [items, setItems] = useState([
    {
      id: 1,
      itemNumber: 1,
      productType: 'Sensor',
      requestedItem: 'Part Number 12345',
      quantity: 1,
      status: 'Match Found',
      isExpanded: false,
      matchDetails: {
        manufacturer: 'SensorTech Inc.',
        partNumber: 'ST-12345',
        price: '$45.99',
        availability: 'In Stock'
      }
    },
    {
      id: 2,
      itemNumber: 2,
      productType: 'Sensor',
      requestedItem: 'Description: Sensor X',
      quantity: 5,
      status: 'Match Found',
      isExpanded: false,
      matchDetails: {
        manufacturer: 'Industrial Sensors Ltd.',
        partNumber: 'IS-SX-100',
        price: '$32.50',
        availability: 'In Stock'
      }
    },
    {
      id: 3,
      itemNumber: 3,
      productType: 'Part',
      requestedItem: 'Part Number 98765',
      quantity: 2,
      status: 'Match Found',
      isExpanded: false,
      matchDetails: {
        manufacturer: 'Parts Pro',
        partNumber: 'PP-98765',
        price: '$125.00',
        availability: 'Limited Stock'
      }
    },
    {
      id: 4,
      itemNumber: 4,
      productType: 'Valve',
      requestedItem: 'Description: Valve A',
      quantity: 10,
      status: 'Match Found',
      isExpanded: false,
      matchDetails: {
        manufacturer: 'ValveCorp',
        partNumber: 'VC-A-200',
        price: '$89.99',
        availability: 'In Stock'
      }
    },
    {
      id: 5,
      itemNumber: 5,
      productType: 'Part',
      requestedItem: 'Part Number 45678',
      quantity: 3,
      status: 'Match Found',
      isExpanded: false,
      matchDetails: {
        manufacturer: 'Generic Parts Inc.',
        partNumber: 'GP-45678',
        price: '$15.75',
        availability: 'In Stock'
      }
    }
  ]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      console.log('File uploaded:', file.name);
    }
  };

  const toggleExpanded = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
    ));
  };

  const filteredItems = activeTab === 'all' ? items : items.filter(item => item.status !== 'Match Found');

  const processedCount = items.filter(item => item.status === 'Match Found').length;
  const totalCount = items.length;
  const progressPercentage = (processedCount / totalCount) * 100;

  return (
    <div className="multi-item-search-page">
      <div className="multi-item-search-main">
        <div className="multi-item-search-content">
          <div className="page-header">
            <div className="page-title-section">
              <h1 className="page-title">Batch Search & Verification</h1>
              <p className="page-description">
                Upload an Excel file with your product requests. Our system will search manufacturer catalogs and suggest matches.
              </p>
            </div>
          </div>

          <div className="upload-section">
            <input
              type="file"
              id="excel-upload"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="excel-upload" className="upload-button">
              <div className="upload-icon">
                <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path d="M240,136v64a16,16,0,0,1-16,16H32a16,16,0,0,1-16-16V136a16,16,0,0,1,16-16H80a8,8,0,0,1,0,16H32v64H224V136H176a8,8,0,0,1,0-16h48A16,16,0,0,1,240,136ZM85.66,77.66,120,43.31V128a8,8,0,0,0,16,0V43.31l34.34,34.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,77.66ZM200,168a12,12,0,1,0-12,12A12,12,0,0,0,200,168Z"></path>
                </svg>
              </div>
              <span>Upload Excel File</span>
            </label>
          </div>

          <div className="tabs-section">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Items
              </button>
              <button
                className={`tab ${activeTab === 'unmatched' ? 'active' : ''}`}
                onClick={() => setActiveTab('unmatched')}
              >
                Unmatched Items
              </button>
            </div>
          </div>

          <div className="table-section">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="expand-column"></th>
                    <th>Item #</th>
                    <th>Product Type</th>
                    <th>Requested Item</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr className={item.isExpanded ? 'row-expanded' : ''}>
                        <td className="expand-cell">
                          <button onClick={() => toggleExpanded(item.id)} className="expand-button">
                            <span className="expand-icon">
                              {item.isExpanded ? '−' : '+'}
                            </span>
                          </button>
                        </td>
                        <td>{item.itemNumber}</td>
                        <td>{item.productType}</td>
                        <td>{item.requestedItem}</td>
                        <td>{item.quantity}</td>
                        <td>
                          <div className="status-cell">
                            <span className="status-icon">✓</span>
                            <span>{item.status}</span>
                          </div>
                        </td>
                      </tr>
                      {item.isExpanded && (
                        <tr className="expanded-row">
                          <td colSpan="6">
                            <div className="expanded-content">
                              <div className="expanded-details">
                                <div className="detail-item">
                                  <span className="detail-label">Manufacturer:</span>
                                  <span className="detail-value">{item.matchDetails.manufacturer}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Part Number:</span>
                                  <span className="detail-value">{item.matchDetails.partNumber}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Price:</span>
                                  <span className="detail-value">{item.matchDetails.price}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Availability:</span>
                                  <span className="detail-value">{item.matchDetails.availability}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-header">
              <p className="progress-title">Batch Progress</p>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="progress-text">
              <span className="progress-number">{processedCount}/{totalCount}</span> Items Processed Correctly ({Math.round(progressPercentage)}% Complete)
            </p>
          </div>

          <p className="autosave-text">Autosaving...</p>

          <div className="action-buttons">
            <button className="discard-button">Discard</button>
            <button className="save-button">Save to Quotation</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiItemSearch;

