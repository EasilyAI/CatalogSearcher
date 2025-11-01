// Mock data for batch search (multi-item upload)
export const mockBatchItems = [
  {
    id: 1,
    itemNumber: 1,
    productType: 'Valve',
    requestedItem: 'High pressure NPT valve SS316',
    quantity: 2,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M1-1',
        productName: 'High Pressure Ball Valve',
        orderingNo: 'SS-109-12345',
        confidence: 92,
        type: 'Valve',
        specifications: 'Material: SS316 Pressure: 6000 psi'
      },
      {
        id: 'M1-2',
        productName: 'Stainless Steel Ball Valve 1/4"',
        orderingNo: 'SS-10-2345',
        confidence: 88,
        type: 'Valve',
        specifications: 'Material: SS316 Pressure: 4000 psi'
      },
      {
        id: 'M1-3',
        productName: 'Needle Valve High Precision',
        orderingNo: 'NV-360-S98FT',
        confidence: 85,
        type: 'Valve',
        specifications: 'Material: SS316 Cv: 0.02'
      }
    ]
  },
  {
    id: 2,
    itemNumber: 2,
    productType: 'Cylinder',
    requestedItem: 'Standard Cylinder 50mm bore',
    quantity: 5,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M2-1',
        productName: 'Standard Pneumatic Cylinder',
        orderingNo: 'CYL-450-X',
        confidence: 92,
        type: 'Cylinder',
        specifications: 'Bore: 50mm Stroke: 100mm'
      },
      {
        id: 'M2-2',
        productName: 'Compact Cylinder Double Acting',
        orderingNo: 'CYL-C50-200',
        confidence: 78,
        type: 'Cylinder',
        specifications: 'Bore: 50mm Stroke: 200mm'
      }
    ]
  },
  {
    id: 3,
    itemNumber: 3,
    productType: 'Tube',
    requestedItem: 'Stainless steel tubing 20mm diameter',
    quantity: 10,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M3-1',
        productName: 'SS304 Seamless Tubing',
        orderingNo: 'TUB-SS-20',
        confidence: 91,
        type: 'Tube',
        specifications: 'OD: 20mm Wall: 2mm Material: SS304'
      },
      {
        id: 'M3-2',
        productName: 'SS316 Precision Tubing',
        orderingNo: 'TUB-SS316-20',
        confidence: 88,
        type: 'Tube',
        specifications: 'OD: 20mm Wall: 1.5mm Material: SS316'
      }
    ]
  },
  {
    id: 4,
    itemNumber: 4,
    productType: 'Fitting',
    requestedItem: '3/4 NPT elbow fitting brass',
    quantity: 15,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M4-1',
        productName: '90° Elbow Fitting',
        orderingNo: 'FTG-ELB-90',
        confidence: 95,
        type: 'Fitting',
        specifications: 'Thread: 3/4" NPT Material: Brass'
      }
    ]
  },
  {
    id: 5,
    itemNumber: 5,
    productType: 'Regulator',
    requestedItem: 'Pressure regulator 0-150 psi',
    quantity: 3,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M5-1',
        productName: 'Compact Air Regulator',
        orderingNo: 'REG-C-777',
        confidence: 90,
        type: 'Regulator',
        specifications: 'Max Pressure: 150 psi with Gauge'
      },
      {
        id: 'M5-2',
        productName: 'Industrial Regulator Heavy Duty',
        orderingNo: 'REG-HD-888',
        confidence: 85,
        type: 'Regulator',
        specifications: 'Max Pressure: 300 psi Brass Body'
      }
    ]
  },
  {
    id: 6,
    itemNumber: 6,
    productType: 'Valve',
    requestedItem: 'Check valve spring loaded',
    quantity: 8,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M6-1',
        productName: 'Check Valve Spring-Loaded',
        orderingNo: 'CV-SS-106',
        confidence: 87,
        type: 'Valve',
        specifications: 'Material: SS316 Cracking Pressure: 5 psi'
      }
    ]
  },
  {
    id: 7,
    itemNumber: 7,
    productType: 'Seal',
    requestedItem: 'O-ring NBR 100mm ID',
    quantity: 50,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M7-1',
        productName: 'NBR O-Ring 100x5mm',
        orderingNo: 'SEAL-OR-100',
        confidence: 94,
        type: 'Seal',
        specifications: 'ID: 100mm CS: 5mm Material: NBR'
      },
      {
        id: 'M7-2',
        productName: 'NBR O-Ring 100x6mm',
        orderingNo: 'SEAL-OR-100-6',
        confidence: 89,
        type: 'Seal',
        specifications: 'ID: 100mm CS: 6mm Material: NBR'
      }
    ]
  },
  {
    id: 8,
    itemNumber: 8,
    productType: 'Valve',
    requestedItem: 'Ball valve 1/2 inch stainless',
    quantity: 6,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M8-1',
        productName: 'Stainless Steel Ball Valve 1/2"',
        orderingNo: 'BV-SS-500',
        confidence: 93,
        type: 'Valve',
        specifications: 'Size: 1/2" NPT Material: SS316'
      },
      {
        id: 'M8-2',
        productName: 'Ball Valve Economy 1/2"',
        orderingNo: 'BV-ECO-500',
        confidence: 88,
        type: 'Valve',
        specifications: 'Size: 1/2" NPT Material: Brass'
      }
    ]
  },
  {
    id: 9,
    itemNumber: 9,
    productType: 'Gasket',
    requestedItem: 'Spiral wound gasket 150mm',
    quantity: 12,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M9-1',
        productName: 'Spiral Wound Gasket',
        orderingNo: 'GKT-FLNG-150',
        confidence: 92,
        type: 'Gasket',
        specifications: 'Size: 150mm PN16 SS316/Graphite'
      }
    ]
  },
  {
    id: 10,
    itemNumber: 10,
    productType: 'Tube',
    requestedItem: 'Flexible polyurethane tube 8mm',
    quantity: 20,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M10-1',
        productName: 'Flexible Nylon Tubing',
        orderingNo: 'TB-NY-8',
        confidence: 88,
        type: 'Tube',
        specifications: 'OD: 8mm ID: 6mm Material: PA12'
      }
    ]
  },
  {
    id: 11,
    itemNumber: 11,
    productType: 'Coupling',
    requestedItem: 'Quick disconnect 12mm',
    quantity: 25,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M11-1',
        productName: 'Quick Disconnect Coupling',
        orderingNo: 'QC-PRO-12',
        confidence: 90,
        type: 'Coupling',
        specifications: 'Size: 12mm Push-Pull Type'
      }
    ]
  },
  {
    id: 12,
    itemNumber: 12,
    productType: 'Hose',
    requestedItem: 'Hydraulic hose 16mm high pressure',
    quantity: 7,
    status: 'Match Found',
    isExpanded: false,
    selectedMatch: null,
    matches: [
      {
        id: 'M12-1',
        productName: 'Hydraulic Hose High Pressure',
        orderingNo: 'HOSE-HY-16',
        confidence: 86,
        type: 'Hose',
        specifications: 'Size: 16mm Pressure: 400 bar SAE 100R2'
      }
    ]
  }
];

// Export helper functions
export const getBatchItemById = (id) => {
  return mockBatchItems.find(item => item.id === id);
};

export const getBatchItemsByStatus = (status) => {
  if (status === 'unmatched') {
    return mockBatchItems.filter(item => item.matches.length === 0);
  }
  return mockBatchItems;
};

