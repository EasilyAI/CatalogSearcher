// Mock quotation line items for EditQuotation page
export const mockQuotationItems = [
  {
    orderNo: 1,
    orderingNumber: 'CYL-100-25',
    requestedItem: 'Hydraulic cylinder 100mm bore, 25mm stroke',
    productName: 'Hydraulic Cylinder HC-100-25',
    productType: 'Cylinder',
    quantity: 10,
    price: 445.00,
    margin: 20,
    sketchFile: 'https://example.com/sketches/cyl-100-25.pdf',
    catalogLink: 'https://example.com/catalog/cyl-100-25',
    notes: 'Standard hydraulic cylinder',
    isIncomplete: false
  },
  {
    orderNo: 2,
    orderingNumber: 'SS-109-12345',
    requestedItem: 'High pressure ball valve SS316',
    productName: 'High Pressure Ball Valve 1/4"',
    productType: 'Valve',
    quantity: 5,
    price: 285.00,
    margin: 25,
    sketchFile: 'https://example.com/sketches/valve-ball.pdf',
    catalogLink: 'https://example.com/catalog/ss-109',
    notes: 'Stainless steel construction',
    isIncomplete: false
  },
  {
    orderNo: 3,
    orderingNumber: 'TUB-SS-20',
    requestedItem: 'Stainless steel tubing 20mm OD',
    productName: 'SS304 Tubing 20mm OD',
    productType: 'Tube',
    quantity: 25,
    price: 45.00,
    margin: 15,
    sketchFile: null,
    catalogLink: 'https://example.com/catalog/tub-ss-20',
    notes: 'Per meter, bright annealed finish',
    isIncomplete: false
  },
  {
    orderNo: 4,
    orderingNumber: 'FTG-ELB-90',
    requestedItem: '90 degree elbow fitting 3/4"',
    productName: '90° Elbow Fitting 3/4"',
    productType: 'Fitting',
    quantity: 75,
    price: 38.50,
    margin: 20,
    sketchFile: 'https://example.com/sketches/ftg-elb-90.pdf',
    catalogLink: 'https://example.com/catalog/ftg-elb-90',
    notes: 'Brass, nickel-plated',
    isIncomplete: false
  },
  {
    orderNo: 5,
    orderingNumber: 'SEAL-OR-100',
    requestedItem: 'O-ring 100mm ID NBR',
    productName: 'O-Ring NBR 100x5mm',
    productType: 'Seal',
    quantity: 200,
    price: 4.25,
    margin: 30,
    sketchFile: null,
    catalogLink: 'https://example.com/catalog/seal-or-100',
    notes: 'NBR material, black, 70 Shore A',
    isIncomplete: false
  },
  {
    orderNo: 6,
    orderingNumber: 'GKT-FLNG-150',
    requestedItem: 'Flange gasket 150mm PN16',
    productName: 'Spiral Wound Gasket 150mm',
    productType: 'Gasket',
    quantity: 30,
    price: 62.00,
    margin: 18,
    sketchFile: 'https://example.com/sketches/gkt-flng-150.pdf',
    catalogLink: 'https://example.com/catalog/gkt-flng-150',
    notes: 'PN16 rating, SS316/Graphite',
    isIncomplete: false
  },
  {
    orderNo: 7,
    orderingNumber: '',
    requestedItem: 'Custom pressure regulator 0-200 bar',
    productName: '',
    productType: 'Regulator',
    quantity: 10,
    price: 0,
    margin: 20,
    sketchFile: null,
    catalogLink: '',
    notes: 'Need to find matching product',
    isIncomplete: true
  },
  {
    orderNo: 8,
    orderingNumber: 'QC-PRO-12',
    requestedItem: 'Quick disconnect coupling 12mm',
    productName: 'Quick Disconnect Coupling 12mm',
    productType: 'Coupling',
    quantity: 100,
    price: 18.50,
    margin: 25,
    sketchFile: null,
    catalogLink: 'https://example.com/catalog/qc-pro-12',
    notes: 'Push-pull type, stainless steel',
    isIncomplete: false
  }
];

// Create a quotation item from a product
export const createQuotationItemFromProduct = (product, quantity = 1) => {
  return {
    orderNo: 0, // Will be set when added to quotation
    orderingNumber: product.orderingNo,
    requestedItem: product.productName,
    productName: product.productName,
    productType: product.type,
    quantity: quantity,
    price: product.price || 0,
    margin: 20,
    sketchFile: null,
    catalogLink: '#',
    notes: `From ${product.manufacturer || 'catalog'}`,
    isIncomplete: false
  };
};

// Get incomplete items
export const getIncompleteItems = (items) => {
  return items.filter(item => item.isIncomplete || !item.orderingNumber);
};

// Calculate quotation totals
export const calculateQuotationTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = items.reduce((sum, item) => {
    const itemPrice = item.price * (1 + item.margin / 100);
    return sum + (itemPrice * item.quantity);
  }, 0);
  const marginTotal = total - subtotal;
  
  return { subtotal, marginTotal, total };
};

