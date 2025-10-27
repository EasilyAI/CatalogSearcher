# User Flow Guide - Complete Integration

This document outlines the complete user flow implementation for the Catalog Searcher application, connecting all screens in a coherent workflow.

## 🎯 High-Level Flow

```
Dashboard → Search (Single/Batch) → Verify Matches → Add to Quotation → Edit Prices → Export
```

## 📋 Detailed User Journeys

### Journey 1: Single Product Search → Quotation

1. **Dashboard** (`/dashboard`)
   - User clicks "Search Product" button
   - Navigates to Single Search page

2. **Single Search** (`/search`)
   - **Breadcrumbs**: Home › Single Search › Add to Quotation
   - User enters search query (e.g., "high pressure valve")
   - System shows ranked results with confidence scores
   - User reviews matches and clicks "Add To Quotation" on desired product

3. **Add to Quotation Dialog**
   - Dialog shows all existing quotations (from `mockQuotations.js`)
   - User can:
     - **Option A**: Select existing quotation → navigates to `/quotations/edit/{id}` with item added
     - **Option B**: Click "Create New Quotation" → navigates to `/quotations/edit/new` with item

4. **Edit Quotation** (`/quotations/edit/{id}`)
   - **Breadcrumbs**: Home › Quotations › Edit #{id} • From single search
   - Item appears in quotation table
   - User adds pricing, margins, and additional details
   - User can export or finalize quotation

### Journey 2: Batch Upload → Quotation

1. **Dashboard** (`/dashboard`)
   - User clicks "Upload file" button
   - Navigates to Multi-Item Search page

2. **Multi-Item Search** (`/multi-search`)
   - **Breadcrumbs**: Home › Batch Search & Verification › Add to Quotation
   - User uploads Excel file with product requests
   - System processes file and shows all items in table
   - For each item:
     - Click "+" to expand and see matched products
     - Click "Choose This" to select preferred match
     - Selected items show green checkmark
   - **Progress indicator** shows "{X}/{Y} Items Processed Correctly (Z% Complete)"

3. **Verification Phase**
   - User reviews all matches
   - Uses "All Items" / "Unmatched Items" tabs to filter view
   - User clicks "Save to Quotation" button

4. **Edit Quotation** (`/quotations/edit/new`)
   - **Breadcrumbs**: Home › Quotations › New Quotation • From batch search
   - All selected items appear in quotation table
   - User adds pricing and margins
   - User can export or finalize quotation

### Journey 3: Continue Previous Work

1. **Dashboard** (`/dashboard`)
   - Section titled "Continue Your Work"
   - Tabs: "Open Drafts (2)" and "Recent"
   - Quotations with incomplete items:
     - Highlighted with yellow background
     - Show badge: "{X} incomplete"
     - Action button shows "Continue →" instead of "Edit"
   - User clicks "Continue →" on a quotation

2. **Edit Quotation** (`/quotations/edit/{id}`)
   - Opens with existing items
   - User can use "Show Incomplete Only" filter
   - For incomplete items, "Search" button navigates to single search
   - User completes pricing and finalizes

## 🔄 Key Integration Points

### 1. Unified Mock Data
- **Single source**: All components use `/src/data/mockQuotations.js`
- **Consistent data**: Same quotations appear in Dashboard, Quotations list, and Add to Quotation dialog

### 2. Navigation with State
All navigation passes relevant data via `state`:

```javascript
// From Single Search
navigate('/quotations/edit/new', { 
  state: { 
    items: [quotationItem],
    customer: 'New Customer',
    source: 'single-search'
  } 
});

// From Multi-Item Search
navigate('/quotations/edit/new', { 
  state: { 
    items: quotationItems,
    customer: 'New Customer',
    source: 'batch-search'
  } 
});

// Adding to existing quotation
navigate(`/quotations/edit/${quotationId}`, { 
  state: { 
    newItem: quotationItem,
    source: 'single-search'
  } 
});
```

### 3. Breadcrumb Navigation
Every page shows contextual breadcrumbs:
- Links are clickable for easy navigation
- Current page is highlighted
- Source information shown when coming from search

### 4. Flow Indicators
- **Breadcrumbs**: Show current position in workflow
- **Progress bars**: In Multi-Item Search show completion percentage
- **Status badges**: On Dashboard show work-in-progress quotations
- **Source tags**: In Edit Quotation show where items came from

## 🎨 Visual Indicators

### Dashboard
- 🟡 Yellow highlight for quotations with incomplete items
- 📝 "Continue →" button for in-progress work
- 📊 Item count and incomplete count visible

### Search Pages
- 📍 Breadcrumbs at top
- 🔄 Next step preview (grayed out in breadcrumbs)
- 📈 Confidence scores with visual bars

### Edit Quotation
- 🏷️ Source badge showing origin (single-search / batch-search)
- ⚠️ Incomplete badge with count
- 🔍 "Search" button for incomplete items
- 💾 Unsaved changes indicator

## 📊 Mock Data Structure

### Quotations (`mockQuotations.js`)
```javascript
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
}
```

### Quotation Items (in EditQuotation)
```javascript
{
  orderNo: 1,
  orderingNumber: 'SS-109-12345',
  requestedItem: 'High pressure NPT valve',
  productName: 'Advanced Industrial Motor',
  productType: 'Valve',
  quantity: 2,
  price: 60.00,
  margin: 20,
  sketchFile: 'https://...',
  catalogLink: 'https://...',
  notes: 'Added from single search',
  isIncomplete: false
}
```

## 🧪 Testing the Flow

### Test Scenario 1: Single Search Flow
1. Start at Dashboard
2. Click "Search Product"
3. Search for "valve"
4. Click "Add To Quotation" on first result
5. Select "Leon levi 10 valves" quotation
6. Verify item appears in quotation
7. Check breadcrumb shows "From single search"

### Test Scenario 2: Batch Upload Flow
1. Start at Dashboard
2. Click "Upload file"
3. Upload any Excel file (mock data will appear)
4. Expand first few items
5. Click "Choose This" on various matches
6. Click "Save to Quotation"
7. Verify all selected items appear in new quotation
8. Check breadcrumb shows "From batch search"

### Test Scenario 3: Continue Work Flow
1. Start at Dashboard
2. Check "Open Drafts" tab
3. Find quotation with "2 incomplete" badge
4. Click "Continue →"
5. Verify quotation opens with incomplete items visible
6. Use "Show Incomplete Only" filter
7. Complete missing information

## 🎯 Client Demo Script

**"Let me show you how our system streamlines the quotation process..."**

1. **Dashboard Overview**
   - "This is your command center. You can quickly see work in progress."
   - "Notice this quotation has 2 incomplete items - let's continue that later."

2. **Quick Search Demo**
   - "Need to find one product quickly? Use Single Search."
   - "Type in what you're looking for, and our system ranks matches by confidence."
   - "Found it? Add directly to a new or existing quotation with one click."

3. **Batch Processing Demo**
   - "Have a whole list? Upload an Excel file."
   - "The system automatically searches each item and suggests matches."
   - "Review and select the best match for each product."
   - "When satisfied, save everything to a quotation in one go."

4. **Quotation Management**
   - "All your quotations are in one place."
   - "Add pricing, margins, and notes."
   - "Export for manufacturers, ERP systems, or customer emails."

5. **Workflow Continuity**
   - "Notice the breadcrumbs? You always know where you are."
   - "Started from a search? We remember that."
   - "Need to pause? Come back anytime - your work is saved."

## ✅ Implementation Checklist

- [x] Unified mock data across all components
- [x] Breadcrumb navigation on all pages
- [x] Single Search → Quotation flow
- [x] Multi-Item Search → Quotation flow
- [x] Dashboard "Continue Work" enhancements
- [x] State passing between pages
- [x] Visual indicators (badges, highlights, icons)
- [x] Add to Quotation dialog integration
- [x] Edit Quotation handles incoming items
- [x] Source tracking throughout workflow

## 🚀 Next Steps for Production

1. **API Integration**: Replace mock data with real API calls
2. **Persistence**: Save quotations to backend database
3. **Real-time Updates**: WebSocket for multi-user collaboration
4. **File Processing**: Actual Excel parsing for batch uploads
5. **Export Functions**: Generate real PDF/CSV files
6. **Authentication**: User-specific quotations and permissions
7. **Search Algorithm**: Integrate with actual catalog search API
8. **Validation**: Form validation and error handling
9. **Loading States**: Spinners and progress indicators during API calls
10. **Error Handling**: User-friendly error messages

---

**Built with**: React Router for navigation, shared state management, and consistent design patterns.

