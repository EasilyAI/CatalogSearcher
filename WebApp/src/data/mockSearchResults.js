// Mock search results for single search and multi-item search
export const mockSearchResults = [
  {
    id: 1,
    productName: 'High Pressure Ball Valve',
    orderingNo: 'SS-109-12345',
    confidence: 92,
    type: 'Valve',
    specifications: 'Material: SS316 Pressure: 6000 psi'
  },
  {
    id: 2,
    productName: 'Stainless Steel Ball Valve 1/4"',
    orderingNo: 'SS-10-2345',
    confidence: 88,
    type: 'Valve',
    specifications: 'Material: SS316 Pressure: 4000 psi'
  },
  {
    id: 3,
    productName: 'Needle Valve High Precision',
    orderingNo: 'NV-360-S98FT',
    confidence: 85,
    type: 'Valve',
    specifications: 'Material: SS316 Cv: 0.02'
  },
  {
    id: 4,
    productName: 'Check Valve Spring-Loaded',
    orderingNo: 'CV-SS-106',
    confidence: 82,
    type: 'Valve',
    specifications: 'Material: SS316 Cracking Pressure: 5 psi'
  },
  {
    id: 5,
    productName: 'Relief Valve Adjustable',
    orderingNo: 'RV-A12345',
    confidence: 78,
    type: 'Valve',
    specifications: 'Material: Brass Set Pressure: 10-150 psi'
  },
  {
    id: 6,
    productName: 'Standard Pneumatic Cylinder',
    orderingNo: 'CYL-450-X',
    confidence: 90,
    type: 'Cylinder',
    specifications: 'Bore: 50mm Stroke: 100mm'
  },
  {
    id: 7,
    productName: 'Compact Cylinder Double Acting',
    orderingNo: 'CYL-C50-200',
    confidence: 87,
    type: 'Cylinder',
    specifications: 'Bore: 50mm Stroke: 200mm'
  },
  {
    id: 8,
    productName: 'Heavy Duty Hydraulic Cylinder',
    orderingNo: 'HC-100-300',
    confidence: 84,
    type: 'Cylinder',
    specifications: 'Bore: 100mm Stroke: 300mm Pressure: 250 bar'
  },
  {
    id: 9,
    productName: 'SS304 Seamless Tubing',
    orderingNo: 'TUB-SS-20',
    confidence: 91,
    type: 'Tube',
    specifications: 'OD: 20mm Wall: 2mm Material: SS304'
  },
  {
    id: 10,
    productName: 'Flexible Nylon Tubing',
    orderingNo: 'TB-NY-8',
    confidence: 88,
    type: 'Tube',
    specifications: 'OD: 8mm ID: 6mm Material: PA12'
  },
  {
    id: 11,
    productName: 'PTFE Tubing Chemical Resistant',
    orderingNo: 'TB-PTFE-10',
    confidence: 86,
    type: 'Tube',
    specifications: 'OD: 10mm Material: PTFE Temp: -200 to 260°C'
  },
  {
    id: 12,
    productName: '90° Elbow Fitting',
    orderingNo: 'FTG-ELB-90',
    confidence: 95,
    type: 'Fitting',
    specifications: 'Thread: 3/4" NPT Material: Brass'
  },
  {
    id: 13,
    productName: 'T-Piece Fitting Equal',
    orderingNo: 'FTG-TEE-12',
    confidence: 92,
    type: 'Fitting',
    specifications: 'Size: 12mm Push-to-Connect'
  },
  {
    id: 14,
    productName: 'Straight Union Coupling',
    orderingNo: 'FTG-UNI-8',
    confidence: 89,
    type: 'Fitting',
    specifications: 'Size: 8mm Tube-to-Tube'
  },
  {
    id: 15,
    productName: 'Bulkhead Union Fitting',
    orderingNo: 'FTG-BH-10',
    confidence: 87,
    type: 'Fitting',
    specifications: 'Size: 10mm Panel Mount'
  },
  {
    id: 16,
    productName: 'Pressure Regulator Precision',
    orderingNo: 'REG-P-1000',
    confidence: 93,
    type: 'Regulator',
    specifications: 'Input: 0-300 psi Output: 0-150 psi'
  },
  {
    id: 17,
    productName: 'Compact Air Regulator',
    orderingNo: 'REG-C-777',
    confidence: 90,
    type: 'Regulator',
    specifications: 'Max Pressure: 150 psi with Gauge'
  },
  {
    id: 18,
    productName: 'Industrial Regulator Heavy Duty',
    orderingNo: 'REG-HD-888',
    confidence: 88,
    type: 'Regulator',
    specifications: 'Max Pressure: 300 psi Brass Body'
  },
  {
    id: 19,
    productName: 'NBR O-Ring 100x5mm',
    orderingNo: 'SEAL-OR-100',
    confidence: 94,
    type: 'Seal',
    specifications: 'ID: 100mm CS: 5mm Material: NBR'
  },
  {
    id: 20,
    productName: 'Viton O-Ring High Temp',
    orderingNo: 'SEAL-VT-100',
    confidence: 91,
    type: 'Seal',
    specifications: 'ID: 100mm CS: 5mm Material: FKM'
  },
  {
    id: 21,
    productName: 'PTFE Gasket Sheet',
    orderingNo: 'GKT-PTFE-150',
    confidence: 89,
    type: 'Gasket',
    specifications: 'Size: 150mm Thickness: 3mm'
  },
  {
    id: 22,
    productName: 'Spiral Wound Gasket',
    orderingNo: 'GKT-FLNG-150',
    confidence: 92,
    type: 'Gasket',
    specifications: 'Size: 150mm PN16 SS316/Graphite'
  },
  {
    id: 23,
    productName: 'Quick Disconnect Coupling',
    orderingNo: 'QC-PRO-12',
    confidence: 90,
    type: 'Coupling',
    specifications: 'Size: 12mm Push-Pull Type'
  },
  {
    id: 24,
    productName: 'Pneumatic Hose 8mm',
    orderingNo: 'HOSE-PU-8',
    confidence: 88,
    type: 'Hose',
    specifications: 'OD: 8mm Material: Polyurethane Pressure: 10 bar'
  },
  {
    id: 25,
    productName: 'Hydraulic Hose High Pressure',
    orderingNo: 'HOSE-HY-16',
    confidence: 86,
    type: 'Hose',
    specifications: 'Size: 16mm Pressure: 400 bar SAE 100R2'
  }
];

// Get search results by type
export const getSearchResultsByType = (type) => {
  if (type === 'All Types') return mockSearchResults;
  return mockSearchResults.filter(r => r.type === type);
};

// Get top N search results
export const getTopSearchResults = (count) => {
  return mockSearchResults.slice(0, count);
};

// Search by query (simple text matching)
export const searchProducts = (query, type = 'All Types', limit = 10) => {
  let results = mockSearchResults;
  
  if (type !== 'All Types') {
    results = results.filter(r => r.type === type);
  }
  
  if (query && query.trim()) {
    const searchTerm = query.toLowerCase();
    results = results.filter(r => 
      r.productName.toLowerCase().includes(searchTerm) ||
      r.orderingNo.toLowerCase().includes(searchTerm) ||
      r.specifications.toLowerCase().includes(searchTerm)
    );
  }
  
  return results.slice(0, limit);
};

