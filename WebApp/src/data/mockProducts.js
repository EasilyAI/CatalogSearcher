// Mock product data for detailed product pages
export const mockProducts = {
  'HB-100-25': {
    orderingNo: 'HB-100-25',
    productName: 'Pneumatic Cylinder HB 100',
    type: 'Cylinder',
    manufacturer: 'Hirschberg Industries',
    description: 'High-performance pneumatic cylinder designed for demanding applications. Features precision engineering and durable construction for long-lasting performance. Suitable for automation, manufacturing, and industrial control systems.',
    specifications: {
      material: 'SS316 Stainless Steel',
      pressure: '10 bar (145 psi)',
      temperature: '-20°C to 80°C',
      connectionType: 'G 1/4"',
      bore: '100 mm',
      stroke: '200 mm',
      pistonRodDiameter: '25 mm',
      weight: '2.8 kg'
    },
    price: 445.00,
    catalogPage: 'Page 47',
    image: '/images/HB 100 - digital.JPG',
    sources: [
      { type: 'Price List', year: 2025, link: '#', hasPrice: true },
      { type: 'Price List', year: 2024, link: '#', hasPrice: false },
      { type: 'Technical Catalog', year: 2024, link: '#', hasPrice: false, pages: 'Pages 45-52' },
      { type: 'Specification Sheet', year: 2025, link: '#', hasPrice: false }
    ]
  },
  'SS-109-12345': {
    orderingNo: 'SS-109-12345',
    productName: 'High Pressure Ball Valve',
    type: 'Valve',
    manufacturer: 'Swagelok',
    description: 'Precision ball valve for high-pressure applications. Features stainless steel construction with excellent corrosion resistance. Ideal for process control and fluid handling systems.',
    specifications: {
      material: 'SS316 Stainless Steel',
      pressure: '6000 psi (414 bar)',
      temperature: '-53°C to 232°C',
      connectionType: '1/4" NPT',
      cvFactor: '0.6',
      portSize: '6.4 mm',
      weight: '0.3 kg'
    },
    price: 285.00,
    catalogPage: 'Page 23',
    image: null,
    sources: [
      { type: 'Price List', year: 2025, link: '#', hasPrice: true },
      { type: 'Technical Catalog', year: 2024, link: '#', hasPrice: false, pages: 'Pages 20-28' }
    ]
  },
  'TUB-SS-20': {
    orderingNo: 'TUB-SS-20',
    productName: 'SS304 Seamless Tubing',
    type: 'Tube',
    manufacturer: 'Parker Hannifin',
    description: 'Seamless stainless steel tubing for precision fluid and gas handling. Excellent for high-purity applications with superior corrosion resistance.',
    specifications: {
      material: 'SS304 Stainless Steel',
      outerDiameter: '20 mm',
      wallThickness: '2 mm',
      maxPressure: '400 bar',
      temperature: '-269°C to 400°C',
      finish: 'Bright Annealed',
      standardLength: '6 meters'
    },
    price: 45.00,
    catalogPage: 'Page 156',
    image: null,
    sources: [
      { type: 'Price List', year: 2025, link: '#', hasPrice: true },
      { type: 'Technical Catalog', year: 2025, link: '#', hasPrice: false, pages: 'Pages 150-165' }
    ]
  },
  'CYL-450-X': {
    orderingNo: 'CYL-450-X',
    productName: 'Standard Pneumatic Cylinder',
    type: 'Cylinder',
    manufacturer: 'Festo',
    description: 'ISO 15552 standard pneumatic cylinder with adjustable cushioning. Reliable performance for general industrial automation applications.',
    specifications: {
      material: 'Anodized Aluminum Body',
      bore: '50 mm',
      stroke: '100 mm',
      pressure: '1-10 bar',
      temperature: '-20°C to 80°C',
      pistonRodMaterial: 'Chrome-plated Steel',
      mounting: 'Through-hole mounting'
    },
    price: 195.00,
    catalogPage: 'Page 89',
    image: null,
    sources: [
      { type: 'Price List', year: 2025, link: '#', hasPrice: true },
      { type: 'Technical Catalog', year: 2024, link: '#', hasPrice: false, pages: 'Pages 85-95' }
    ]
  },
  'FTG-ELB-90': {
    orderingNo: 'FTG-ELB-90',
    productName: '90° Elbow Fitting',
    type: 'Fitting',
    manufacturer: 'Swagelok',
    description: 'Precision 90-degree elbow tube fitting for compact installations. Leak-tight performance with easy installation.',
    specifications: {
      material: 'Brass',
      connectionType: '3/4" NPT Female',
      tubeOD: '12 mm',
      pressure: '150 bar',
      temperature: '-40°C to 120°C',
      finish: 'Nickel-plated'
    },
    price: 38.50,
    catalogPage: 'Page 234',
    image: null,
    sources: [
      { type: 'Price List', year: 2025, link: '#', hasPrice: true }
    ]
  },
  'SEAL-OR-100': {
    orderingNo: 'SEAL-OR-100',
    productName: 'NBR O-Ring 100x5mm',
    type: 'Seal',
    manufacturer: 'Trelleborg',
    description: 'Nitrile rubber O-ring for general sealing applications. Excellent resistance to petroleum oils and hydraulic fluids.',
    specifications: {
      material: 'NBR (Nitrile)',
      innerDiameter: '100 mm',
      crossSection: '5 mm',
      hardness: '70 Shore A',
      temperature: '-30°C to 100°C',
      color: 'Black',
      standard: 'ISO 3601'
    },
    price: 4.25,
    catalogPage: 'Page 412',
    image: null,
    sources: [
      { type: 'Price List', year: 2025, link: '#', hasPrice: true },
      { type: 'Technical Catalog', year: 2024, link: '#', hasPrice: false, pages: 'Pages 400-420' }
    ]
  }
};

// Helper function to get product by ordering number
export const getProductByOrderingNo = (orderingNo) => {
  return mockProducts[orderingNo] || null;
};

// Get all products as array
export const getAllProducts = () => {
  return Object.values(mockProducts);
};

// Get products by type
export const getProductsByType = (type) => {
  return Object.values(mockProducts).filter(p => p.type === type);
};

