// Mock catalog items for catalog review page
export const mockCatalogItems = [
  {
    id: 1,
    orderingNumber: 'HB-100-25',
    description: 'Pneumatic Cylinder, Double Acting',
    spec: 'Bore: 100mm, Stroke: 200mm, Pressure: 10 bar',
    manualInput: 'Hirschberg HB Series',
    expandedContent: {
      additionalSpecs: 'Material: SS316, Connection: G 1/4", Piston Rod: 25mm',
      manufacturer: 'Hirschberg Industries',
      certifications: 'ISO 15552, CE Marked',
      notes: 'High-performance pneumatic cylinder for industrial automation'
    }
  },
  {
    id: 2,
    orderingNumber: 'SS-109-12345',
    description: 'High Pressure Ball Valve, 1/4" NPT',
    spec: 'Pressure: 6000 psi, Material: SS316',
    manualInput: 'Swagelok Series',
    expandedContent: {
      additionalSpecs: 'Cv Factor: 0.6, Port Size: 6.4mm, Temperature: -53°C to 232°C',
      manufacturer: 'Swagelok',
      certifications: 'ISO 9001, API 6D',
      notes: 'Precision ball valve for high-pressure fluid control'
    }
  },
  {
    id: 3,
    orderingNumber: 'TUB-SS-20',
    description: 'Seamless Stainless Steel Tubing, 20mm OD',
    spec: 'OD: 20mm, Wall: 2mm, Material: SS304',
    manualInput: 'Parker Tube Series',
    expandedContent: {
      additionalSpecs: 'Max Pressure: 400 bar, Temperature: -269°C to 400°C, Length: 6m',
      manufacturer: 'Parker Hannifin',
      certifications: 'ASTM A269, EN 10216-5',
      notes: 'Bright annealed finish for high-purity applications'
    }
  },
  {
    id: 4,
    orderingNumber: 'FTG-ELB-90',
    description: '90° Elbow Fitting, Brass',
    spec: 'Size: 3/4" NPT, Material: Brass',
    manualInput: 'Standard Elbow',
    expandedContent: {
      additionalSpecs: 'Tube OD: 12mm, Pressure: 150 bar, Finish: Nickel-plated',
      manufacturer: 'Swagelok',
      certifications: 'ISO 9001, RoHS Compliant',
      notes: 'Compact 90-degree fitting for tight installations'
    }
  },
  {
    id: 5,
    orderingNumber: 'SEAL-OR-100',
    description: 'NBR O-Ring, 100mm ID',
    spec: 'ID: 100mm, CS: 5mm, Material: NBR',
    manualInput: 'Trelleborg Sealing',
    expandedContent: {
      additionalSpecs: 'Hardness: 70 Shore A, Temperature: -30°C to 100°C, Color: Black',
      manufacturer: 'Trelleborg Sealing Solutions',
      certifications: 'ISO 3601, FDA Approved',
      notes: 'Excellent resistance to petroleum oils and hydraulic fluids'
    }
  },
  {
    id: 6,
    orderingNumber: 'CYL-450-X',
    description: 'ISO Standard Pneumatic Cylinder',
    spec: 'Bore: 50mm, Stroke: 100mm, Pressure: 1-10 bar',
    manualInput: 'Festo DSBC Series',
    expandedContent: {
      additionalSpecs: 'Material: Anodized Aluminum, Rod: Chrome-plated Steel, Mounting: Through-hole',
      manufacturer: 'Festo',
      certifications: 'ISO 15552, CE Marked',
      notes: 'Reliable standard cylinder with adjustable cushioning'
    }
  },
  {
    id: 7,
    orderingNumber: 'REG-C-777',
    description: 'Compact Air Regulator with Gauge',
    spec: 'Max Pressure: 150 psi, Port: 1/4" NPT',
    manualInput: 'SMC AR Series',
    expandedContent: {
      additionalSpecs: 'Flow: 1800 L/min, Adjustment: Locking Knob, Gauge Range: 0-160 psi',
      manufacturer: 'SMC Corporation',
      certifications: 'CE, RoHS',
      notes: 'Compact design for space-constrained installations'
    }
  },
  {
    id: 8,
    orderingNumber: 'GKT-FLNG-150',
    description: 'Spiral Wound Gasket, 150mm',
    spec: 'Size: 150mm, Rating: PN16',
    manualInput: 'Flexitallic CGI',
    expandedContent: {
      additionalSpecs: 'Material: SS316/Graphite, Temperature: -200°C to 550°C, Thickness: 4.5mm',
      manufacturer: 'Flexitallic',
      certifications: 'ASME B16.20, EN 1514-2',
      notes: 'High-performance gasket for critical sealing applications'
    }
  },
  {
    id: 9,
    orderingNumber: 'NV-360-S98FT',
    description: 'Needle Valve, High Precision',
    spec: 'Material: SS316, Cv: 0.02',
    manualInput: 'Precision Control',
    expandedContent: {
      additionalSpecs: 'Connection: 1/4" NPT, Pressure: 5000 psi, Temperature: -40°C to 200°C',
      manufacturer: 'Swagelok',
      certifications: 'ISO 9001, NACE MR0175',
      notes: 'Fine metering control for precise flow adjustment'
    }
  },
  {
    id: 10,
    orderingNumber: 'QC-PRO-12',
    description: 'Quick Disconnect Coupling, 12mm',
    spec: 'Size: 12mm, Type: Push-Pull',
    manualInput: 'Stucchi QRC',
    expandedContent: {
      additionalSpecs: 'Flow: 120 L/min, Pressure: 250 bar, Material: Hardened Steel',
      manufacturer: 'Stucchi',
      certifications: 'ISO 7241-1, ISO 16028',
      notes: 'Push-pull type for quick connection and disconnection'
    }
  }
];

// Helper functions
export const getCatalogItemById = (id) => {
  return mockCatalogItems.find(item => item.id === id);
};

export const getCatalogItemByOrderingNumber = (orderingNumber) => {
  return mockCatalogItems.find(item => item.orderingNumber === orderingNumber);
};

export const getAllCatalogItems = () => {
  return mockCatalogItems;
};

// Paginate catalog items
export const paginateCatalogItems = (page = 1, itemsPerPage = 10) => {
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return mockCatalogItems.slice(start, end);
};

