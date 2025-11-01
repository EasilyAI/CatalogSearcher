# Mock Data Refactoring Summary

## Overview
This document summarizes the centralization and standardization of all mock data across the webApp folder. All mock data has been relocated to a centralized location and made relevant to industrial fluid and pneumatic products.

## Changes Made

### 1. Centralized Mock Data Structure

Created a new centralized data structure under `/webApp/src/data/` with the following files:

#### Core Data Files:

1. **`mockProducts.js`**
   - Contains detailed product information for product pages
   - Includes: Pneumatic Cylinders, Ball Valves, Tubing, Fittings, O-Rings, Gaskets
   - Helper functions: `getProductByOrderingNo()`, `getAllProducts()`, `getProductsByType()`

2. **`mockSearchResults.js`**
   - Contains search results for single and batch search functionality
   - 25 diverse products covering: Valves, Tubes, Cylinders, Fittings, Regulators, Seals, Gaskets, Couplings, Hoses
   - Helper functions: `getSearchResultsByType()`, `getTopSearchResults()`, `searchProducts()`

3. **`mockBatchItems.js`**
   - Contains batch search/upload items with match results
   - 12 items with various matching states (matched, unmatched, multiple matches)
   - Helper functions: `getBatchItemById()`, `getBatchItemsByStatus()`

4. **`mockQuotationItems.js`**
   - Contains line items for quotations
   - 8 items including complete and incomplete entries
   - Helper functions: `createQuotationItemFromProduct()`, `getIncompleteItems()`, `calculateQuotationTotals()`

5. **`mockCatalogItems.js`**
   - Contains catalog review items
   - 10 items with detailed specifications and expandable content
   - Helper functions: `getCatalogItemById()`, `getCatalogItemByOrderingNumber()`, `paginateCatalogItems()`

6. **`mockUploads.js`**
   - Contains file upload tracking data
   - Helper functions: `getUploadById()`, `getInProgressUploads()`, `getCompletedUploads()`

7. **`mockQuotations.js`** (Already existed, kept intact)
   - Contains quotation metadata

8. **`index.js`**
   - Central export point for all mock data modules

### 2. Product Data Transformation

All products have been changed from irrelevant items (motors, sensors, wires, bolts, gauges, filters) to industry-relevant items:

**New Product Categories:**
- **Valves**: Ball valves, needle valves, check valves, relief valves
- **Cylinders**: Pneumatic cylinders, hydraulic cylinders (various bores and strokes)
- **Tubes/Tubing**: Stainless steel tubing, flexible tubing, PTFE tubing
- **Fittings**: Elbows, tees, unions, bulkhead fittings
- **Seals**: O-rings (NBR, Viton), various sizes
- **Gaskets**: Spiral wound gaskets, PTFE gaskets
- **Regulators**: Pressure regulators, air regulators
- **Couplings**: Quick disconnect couplings
- **Hoses**: Pneumatic hoses, hydraulic hoses

### 3. Updated Files

#### Pages Updated:
1. **`ProductPage.jsx`**
   - Now imports from `mockProducts.js`
   - Uses `getProductByOrderingNo()` function
   - Handles product not found gracefully

2. **`Dashboard.jsx`**
   - Now imports from `mockUploads.js`
   - Uses `getInProgressUploads()` function

3. **`SingleSearch.jsx`**
   - Now imports from `mockSearchResults.js`
   - Uses `getSearchResultsByType()` function
   - Expanded product type dropdown to include all relevant types

4. **`MultiItemSearch.jsx`**
   - Now imports from `mockBatchItems.js`
   - Uses centralized batch items data
   - Maintains session storage functionality

5. **`EditQuotation.jsx`**
   - Now imports from `mockQuotationItems.js`
   - Uses centralized quotation items
   - Updated product type dropdown to include all relevant categories

6. **`CatalogReview.jsx`**
   - Now imports from `mockCatalogItems.js`
   - Uses centralized catalog items data

#### Components Updated:
7. **`MultiItemUpload.jsx`**
   - Now imports from `mockBatchItems.js`
   - Uses first 5 items from centralized data

8. **`AddToQuotationDialog.jsx`**
   - Already used centralized `mockQuotations.js` - no changes needed

## Data Type Classification

The mock data has been organized into the following data types:

### 1. **Products** (`mockProducts.js`)
- Detailed product specifications
- Manufacturer information
- Pricing and catalog references
- Technical specifications
- Source documents

### 2. **Quotations** (`mockQuotations.js`)
- Quotation metadata
- Status tracking
- Customer information
- Item counts and totals

### 3. **Quotation Items** (`mockQuotationItems.js`)
- Line items within quotations
- Quantities and pricing
- Margin calculations
- Complete/incomplete status

### 4. **Search Results** (`mockSearchResults.js`)
- Product search results
- Confidence scores
- Brief specifications
- Multiple product types

### 5. **Batch Items** (`mockBatchItems.js`)
- Bulk upload items
- Match results
- Multiple match options
- Status tracking

### 6. **Catalog Items** (`mockCatalogItems.js`)
- Catalog product entries
- Expandable detailed information
- Manufacturer and certification data

### 7. **Uploads** (`mockUploads.js`)
- File upload tracking
- Processing status
- Progress indicators

## Consistency Improvements

### Ordering Numbers
Standardized format across all mock data:
- Valves: `SS-XXX-XXXXX`, `CV-XXX-XXX`, `NV-XXX-XXXXX`
- Cylinders: `CYL-XXX-X`, `HC-XXX-XXX`
- Tubes: `TUB-XX-XX`, `TB-XX-XX`
- Fittings: `FTG-XXX-XX`
- Seals: `SEAL-XX-XXX`
- Gaskets: `GKT-XXXX-XXX`
- Regulators: `REG-X-XXX`
- Couplings: `QC-XXX-XX`
- Hoses: `HOSE-XX-XX`

### Product Types
Standardized across all pages:
- Valve
- Tube
- Cylinder
- Fitting
- Seal
- Gasket
- Regulator
- Coupling
- Hose
- Other

### Specifications Format
Consistent specification formatting:
- Material specifications (SS316, SS304, Brass, etc.)
- Pressure ratings (psi, bar)
- Temperature ranges (°C)
- Dimensions (mm, inches)
- Standards and certifications

## Benefits

1. **Single Source of Truth**: All mock data is now in one centralized location
2. **Easy Maintenance**: Changes to mock data only need to be made in one place
3. **Consistency**: All pages use the same data structure and product types
4. **Relevance**: All products are now industry-relevant (valves, tubes, cylinders, fittings, etc.)
5. **Scalability**: Easy to add new products or data types
6. **Type Safety**: Helper functions provide consistent data access patterns
7. **Database Readiness**: Clear data structure ready for real API/database integration

## Next Steps for Database Integration

When moving to a real database, the following data types should be created:

1. **Products Table**
   - Fields: orderingNo, productName, type, manufacturer, description, specifications (JSON), price, catalogPage, image, sources (JSON)

2. **Quotations Table**
   - Fields: id, quotationNumber, name, customer, status, itemCount, totalValue, incompleteItems, createdDate, lastModified

3. **QuotationItems Table**
   - Fields: id, quotationId (FK), orderNo, orderingNumber, requestedItem, productName, productType, quantity, price, margin, sketchFile, catalogLink, notes, isIncomplete

4. **SearchResults/ProductIndex Table**
   - Fields: id, productName, orderingNo, confidence, type, specifications
   - (This might be a view or search index rather than a table)

5. **CatalogItems Table**
   - Fields: id, orderingNumber, description, spec, additionalSpecs, manufacturer, certifications, notes

6. **Uploads Table**
   - Fields: id, fileName, productType, createdAt, status, totalItems, processedItems

## Import Paths

All mock data can now be imported from the centralized location:

```javascript
// Individual imports
import { mockProducts, getProductByOrderingNo } from '../data/mockProducts';
import { mockSearchResults, getSearchResultsByType } from '../data/mockSearchResults';
import { mockBatchItems } from '../data/mockBatchItems';
import { mockQuotationItems } from '../data/mockQuotationItems';
import { mockCatalogItems } from '../data/mockCatalogItems';
import { mockUploads } from '../data/mockUploads';
import { mockQuotations } from '../data/mockQuotations';

// Or import everything at once
import * as mockData from '../data';
```

## Files Changed

### New Files Created (7):
- `/webApp/src/data/mockProducts.js`
- `/webApp/src/data/mockSearchResults.js`
- `/webApp/src/data/mockBatchItems.js`
- `/webApp/src/data/mockQuotationItems.js`
- `/webApp/src/data/mockCatalogItems.js`
- `/webApp/src/data/mockUploads.js`
- `/webApp/src/data/index.js`

### Files Modified (8):
- `/webApp/src/pages/ProductPage.jsx`
- `/webApp/src/pages/Dashboard.jsx`
- `/webApp/src/pages/SingleSearch.jsx`
- `/webApp/src/pages/MultiItemSearch.jsx`
- `/webApp/src/pages/EditQuotation.jsx`
- `/webApp/CatalogReview.jsx`
- `/webApp/src/components/MultiItemUpload.jsx`
- `/webApp/src/data/mockQuotations.js` (unchanged, already centralized)

Total: **15 files affected** (7 new, 8 modified)

