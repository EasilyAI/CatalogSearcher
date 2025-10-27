// Shared mock quotations data
export const mockQuotations = [
  {
    id: '12345',
    quotationNumber: '#12345',
    name: 'Leon levi 10 valves',
    customer: 'Leon levi',
    status: 'searching items',
    itemCount: 5,
    totalValue: 1025.00,
    incompleteItems: 2,
    createdDate: '2024-01-20',
    lastModified: '2024-10-27'
  },
  {
    id: '12344',
    quotationNumber: '#12344',
    name: 'Intel December 2025',
    customer: 'Intel',
    status: 'inventory check',
    itemCount: 8,
    totalValue: 3250.00,
    incompleteItems: 0,
    createdDate: '2024-01-20',
    lastModified: '2024-10-26'
  },
  {
    id: '12343',
    quotationNumber: '#12343',
    name: 'Quotation 2',
    customer: 'Customer B',
    status: 'sent for confirmation',
    itemCount: 12,
    totalValue: 5780.00,
    incompleteItems: 0,
    createdDate: '2024-01-18',
    lastModified: '2024-10-25'
  },
  {
    id: '12342',
    quotationNumber: '#12342',
    name: 'Industrial Parts Co Order',
    customer: 'Industrial Parts Co',
    status: 'done',
    itemCount: 6,
    totalValue: 2100.00,
    incompleteItems: 0,
    createdDate: '2024-01-10',
    lastModified: '2024-01-20'
  },
  {
    id: '12341',
    quotationNumber: '#12341',
    name: 'Global Manufacturing Q4',
    customer: 'Global Manufacturing',
    status: 'done',
    itemCount: 15,
    totalValue: 8900.00,
    incompleteItems: 0,
    createdDate: '2024-01-05',
    lastModified: '2024-01-15'
  }
];

export const getQuotationsByStatus = (status) => {
  if (status === 'all') return mockQuotations;
  return mockQuotations.filter(q => q.status === status);
};

export const getDraftQuotations = () => {
  return mockQuotations.filter(q => 
    q.status === 'searching items' || q.incompleteItems > 0
  );
};

export const getRecentQuotations = (limit = 10) => {
  return [...mockQuotations]
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
    .slice(0, limit);
};

