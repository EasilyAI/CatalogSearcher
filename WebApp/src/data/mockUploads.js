// Mock upload/file processing data for Dashboard
export const mockUploads = [
  {
    id: 1,
    fileName: 'ValvesCatalog_2025',
    productType: 'valve',
    createdAt: '2024-01-22',
    status: 'In Progress',
    totalItems: 156,
    processedItems: 89
  },
  {
    id: 2,
    fileName: 'CylindersAndActuators',
    productType: 'cylinder',
    createdAt: '2024-01-21',
    status: 'In Progress',
    totalItems: 78,
    processedItems: 45
  },
  {
    id: 3,
    fileName: 'TubingAndFittings_Q1',
    productType: 'tube',
    createdAt: '2024-01-20',
    status: 'Completed',
    totalItems: 234,
    processedItems: 234
  },
  {
    id: 4,
    fileName: 'SealsAndGaskets_Master',
    productType: 'seal',
    createdAt: '2024-01-18',
    status: 'Completed',
    totalItems: 412,
    processedItems: 412
  }
];

// Helper functions
export const getUploadById = (id) => {
  return mockUploads.find(upload => upload.id === id);
};

export const getInProgressUploads = () => {
  return mockUploads.filter(upload => upload.status === 'In Progress');
};

export const getCompletedUploads = () => {
  return mockUploads.filter(upload => upload.status === 'Completed');
};

export const getUploadProgress = (upload) => {
  if (!upload.totalItems) return 0;
  return Math.round((upload.processedItems / upload.totalItems) * 100);
};

