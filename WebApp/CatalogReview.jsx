import React, { useState } from 'react';
import './CatalogReview.css';

const CatalogReview = () => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editableTexts, setEditableTexts] = useState({});

  // Sample data based on the Figma design
  const products = [
    {
      id: 1,
      orderingNumber: "PN-12345",
      description: "High-Pressure Valve, Stainless Steel",
      spec: "Pressure: 1000psi, Material: 316SS",
      manualInput: "Editable Text",
      expandedContent: {
        additionalSpecs: "Thread: 1/2in NPT, Temperature Range: -40°C to 200°C",
        manufacturer: "Industrial Valves Inc.",
        certifications: "ASME B16.34, API 6D",
        notes: "Suitable for high-pressure applications in industrial settings"
      }
    },
    {
      id: 2,
      orderingNumber: "ORD-67890",
      description: "Standard Copper Tube, 1/2 inch",
      spec: "Diameter: 0.5in, Material: Copper",
      manualInput: "Editable Text",
      expandedContent: {
        additionalSpecs: "Wall Thickness: 0.035in, Length: 20ft",
        manufacturer: "CopperWorks Ltd.",
        certifications: "ASTM B88, NSF 61",
        notes: "Ideal for plumbing and HVAC applications"
      }
    },
    {
      id: 3,
      orderingNumber: "PN-98765",
      description: "Industrial Grade Sealant",
      spec: "Temp Range: -40C to 200C, Type: Silicone",
      manualInput: "Editable Text",
      expandedContent: {
        additionalSpecs: "Viscosity: 100,000 cP, Cure Time: 24 hours",
        manufacturer: "SealTech Industries",
        certifications: "UL 94 V-0, FDA Approved",
        notes: "High-performance sealant for industrial applications"
      }
    },
    {
      id: 4,
      orderingNumber: "ORD-54321",
      description: "Heavy Duty Steel Bolt, M12",
      spec: "Size: M12, Length: 50mm",
      manualInput: "Editable Text",
      expandedContent: {
        additionalSpecs: "Thread Pitch: 1.75mm, Head Type: Hex",
        manufacturer: "BoltMaster Corp.",
        certifications: "ISO 4017, DIN 933",
        notes: "Grade 8.8 steel bolt for heavy-duty applications"
      }
    },
    {
      id: 5,
      orderingNumber: "PN-11223",
      description: "Precision Flow Meter",
      spec: "Flow Rate: 0-100L/min, Accuracy: +/- 0.5%",
      manualInput: "Editable Text",
      expandedContent: {
        additionalSpecs: "Connection: 1/2in NPT, Display: Digital LCD",
        manufacturer: "FlowTech Solutions",
        certifications: "CE, RoHS Compliant",
        notes: "High-precision flow measurement for process control"
      }
    },
    {
      id: 6,
      orderingNumber: "ORD-44556",
      description: "Insulated Electrical Wire, 14 AWG",
      spec: "Gauge: 14 AWG, Insulation: PVC",
      manualInput: "Editable Text",
      expandedContent: {
        additionalSpecs: "Conductor: Copper, Voltage: 600V",
        manufacturer: "WireWorks Inc.",
        certifications: "UL 83, CSA C22.2",
        notes: "Multi-purpose electrical wire for residential and commercial use"
      }
    },
    {
      id: 7,
      orderingNumber: "PN-77889",
      description: "Chemical Resistant Hose, 1 inch",
      spec: "Diameter: 1in, Material: PTFE",
      manualInput: "Editable Text",
      expandedContent: {
        additionalSpecs: "Working Pressure: 150 PSI, Temperature: -70°C to 260°C",
        manufacturer: "HoseMaster Ltd.",
        certifications: "FDA, NSF 51",
        notes: "Excellent chemical resistance for industrial applications"
      }
    },
    {
      id: 8,
      orderingNumber: "ORD-99001",
      description: "Digital Pressure Gauge",
      spec: "Range: 0-1000psi, Display: LCD",
      manualInput: "Editable Text",
      expandedContent: {
        additionalSpecs: "Accuracy: ±0.25% FS, Power: 9V Battery",
        manufacturer: "GaugeTech Systems",
        certifications: "CE, ATEX Zone 1",
        notes: "Digital pressure measurement with data logging capability"
      }
    },
    {
      id: 9,
      orderingNumber: "PN-22334",
      description: "Safety Relief Valve",
      spec: "Set Pressure: 500psi, Connection: 1/2in NPT",
      manualInput: "Editable Text",
      expandedContent: {
        additionalSpecs: "Blowdown: 7%, Capacity: 1000 SCFH",
        manufacturer: "SafetyValve Corp.",
        certifications: "ASME VIII, API 526",
        notes: "Critical safety component for pressure vessel protection"
      }
    },
    {
      id: 10,
      orderingNumber: "ORD-66778",
      description: "Stainless Steel Pipe Fitting, 90 Degree Elbow",
      spec: "Size: 1/2in, Material: 316SS",
      manualInput: "Editable Text",
      expandedContent: {
        additionalSpecs: "Schedule: 40, Finish: Polished",
        manufacturer: "PipeFittings Inc.",
        certifications: "ASTM A403, ASME B16.9",
        notes: "High-quality stainless steel fitting for corrosive environments"
      }
    }
  ];

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
