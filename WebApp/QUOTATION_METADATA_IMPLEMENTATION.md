# Quotation Metadata Form Implementation

## Overview

Implemented a preliminary metadata form that appears before the quotation items page. This form collects essential quotation information (customer, name, currency, margin, etc.) before proceeding to product management.

## Changes Made

### 1. New Files Created

#### `/webApp/src/pages/NewQuotation.jsx`
- New component for quotation metadata form
- Supports both creation mode and editing mode
- Validates required fields (quotation name, customer)
- Handles navigation from/to various entry points
- Pre-fills form when editing existing quotation metadata

**Key Features:**
- Required fields: Quotation Name, Customer Name
- Optional fields: Currency, Default Margin, Notes, Created Date, Status
- Form validation with error messages
- Different button text based on mode (Create vs Edit)
- Breadcrumb navigation showing source (if from search)

#### `/webApp/src/pages/NewQuotation.css`
- Complete styling for the metadata form
- Responsive design (mobile-friendly)
- Form validation error states
- Professional form layout with sections
- Consistent with app design system

### 2. Updated Files

#### `/webApp/src/App.jsx`
- Added import for `NewQuotation` component
- Added route: `/quotations/new` - Create new quotation metadata
- Added route: `/quotations/metadata/:id` - Edit existing quotation metadata

#### `/webApp/src/pages/Quotations.jsx`
- Changed "New Quotation" button to navigate to `/quotations/new` instead of `/quotations/edit/new`
- Added `handleEditMetadata()` function to navigate to metadata edit page
- Updated actions in table:
  - "Edit" → "Edit Items" (goes to items page)
  - Added "Edit Info" button (goes to metadata page)
  - "Delete" remains unchanged

#### `/webApp/src/pages/EditQuotation.jsx`
- Added `metadata` prop from location state
- Updated initial state to use metadata from NewQuotation form:
  - `quotationName`, `customer`, `currency`, `defaultMargin`, `notes`, `createdDate`, `status`
- Added `handleEditMetadata()` function to navigate back to metadata form with current data
- Added "Edit Info" button in header to access metadata form
- Updated header display:
  - Shows quotation name as main title
  - Shows quotation number as secondary info
  - Displays currency with total value
- Updated global margin initialization to use `defaultMargin` from metadata

#### `/webApp/src/pages/EditQuotation.css`
- Added `.btn-edit-metadata` styles for the new "Edit Info" button
- Added `.quotation-number` styles for displaying quotation number in header

#### `/webApp/src/data/mockQuotations.js`
- Added new metadata fields to all mock quotations:
  - `currency`: Currency code (USD, EUR, ILS, etc.)
  - `defaultMargin`: Default margin percentage
  - `notes`: Quotation notes

#### `/webApp/src/pages/SingleSearch.jsx`
- Updated `handleCreateNew()` function
- Changed navigation from `/quotations/edit/new` to `/quotations/new`
- Now routes through metadata form when creating new quotation from single search
- Removed unused `customer: 'New Customer'` from state

#### `/webApp/src/pages/MultiItemSearch.jsx`
- Updated `handleSaveToQuotation()` function
- Changed navigation from `/quotations/edit/new` to `/quotations/new`
- Now routes through metadata form when creating new quotation from batch search
- Removed unused `customer: 'New Customer'` from state

#### `/webApp/QUOTATION_SYSTEM.md`
- Updated documentation to reflect new three-page system
- Added section for "New/Edit Quotation Metadata Page"
- Updated workflows to include metadata form step
- Updated file structure and navigation routes

## User Flows

### Creating a New Quotation

**Old Flow:**
1. Click "New Quotation" → Goes directly to items page with default values

**New Flow:**
1. Click "New Quotation" → Metadata form
2. Fill in quotation name, customer, currency, margin, notes
3. Click "Continue to Items" → Items page with metadata applied

### Creating from Single/Multi Search

**Old Flow:**
1. Search → Add to quotation → Select "New" → Items page with product added

**New Flow:**
1. Search → Add to quotation → Select "New" → Metadata form
2. Fill in quotation details
3. Click "Continue to Items" → Items page with product added and metadata applied

### Editing Quotation Metadata

**New Feature:**
1. From Quotations List: Click "Edit Info" → Metadata form
2. From Items Page: Click "Edit Info" button in header → Metadata form
3. Modify fields
4. Click "Save & Return" → Returns to items page with updated metadata

## Technical Details

### Route Structure

```
/quotations                  → Quotations list
/quotations/new             → New quotation metadata form
/quotations/metadata/:id    → Edit quotation metadata form
/quotations/edit/new        → New quotation items (after metadata)
/quotations/edit/:id        → Edit quotation items
```

### State Management

The metadata is passed between pages using React Router's location state:

```javascript
// NewQuotation → EditQuotation (new)
navigate('/quotations/edit/new', {
  state: {
    metadata: formData,
    items: initialItems,
    source: sourceInfo
  }
});

// EditQuotation → NewQuotation (edit)
navigate(`/quotations/metadata/${id}`, {
  state: {
    metadata: {
      quotationName,
      customer,
      currency,
      defaultMargin,
      notes,
      createdDate,
      status
    }
  }
});
```

### Form Validation

- **Required Fields**: Quotation Name, Customer Name
- **Constraints**: Default Margin must be between 0-100
- **Error Display**: Inline error messages below invalid fields
- **Field Clearing**: Errors clear when user starts typing

### Metadata Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| quotationName | String | Yes | - | Descriptive name for the quotation |
| customer | String | Yes | - | Customer/company name |
| currency | Select | No | USD | Currency for pricing |
| defaultMargin | Number | No | 20 | Default profit margin (%) |
| notes | Textarea | No | - | Additional notes |
| createdDate | Date | No | Today | Date quotation was created |
| status | Select | No | searching items | Initial status |

## Benefits

1. **Better Organization**: Separates quotation metadata from item management
2. **Required Information**: Ensures essential information is collected upfront
3. **Flexibility**: Allows editing metadata without touching items
4. **Currency Support**: Proper currency selection before pricing items
5. **Default Margins**: Sets default margin for all items at creation
6. **Professional Workflow**: Mimics industry-standard quotation systems

## Future Enhancements

- [ ] Add quotation templates for common customer types
- [ ] Add customer selection dropdown (autocomplete)
- [ ] Add tax settings per currency
- [ ] Add payment terms field
- [ ] Add delivery/shipping information
- [ ] Add quotation validity period
- [ ] Add custom fields configuration
- [ ] Add quotation numbering scheme configuration

## Testing Checklist

- [x] Create new quotation from quotations list
- [x] Create new quotation from single search (AddToQuotationDialog → "Create New")
- [x] Create new quotation from multi-item search ("Save to Quotation" button)
- [x] Edit existing quotation metadata from list
- [x] Edit existing quotation metadata from items page
- [x] Form validation works correctly
- [x] Cancel buttons navigate correctly
- [x] Metadata persists between pages
- [x] Currency displays correctly in items page
- [x] Default margin applies to new items
- [x] Items badge shows count when coming from search
- [x] Breadcrumbs show source correctly
- [x] Responsive design on mobile
- [x] No linting errors

## Integration Points

### Single Search → New Quotation
1. User searches for product in Single Search
2. Clicks "Add to Quotation" button
3. In AddToQuotationDialog, clicks "Create New Quotation"
4. **Routes to `/quotations/new`** with product item in state
5. User fills metadata form
6. Clicks "Continue to Items"
7. Routes to `/quotations/edit/new` with metadata and product item
8. Product is pre-loaded in the quotation items table

### Multi-Item Search → New Quotation
1. User uploads Excel file with multiple items
2. Reviews and matches products
3. Clicks "Save to Quotation" button
4. **Routes to `/quotations/new`** with all items in state
5. User fills metadata form
6. Clicks "Continue to Items"
7. Routes to `/quotations/edit/new` with metadata and all items
8. All products are pre-loaded in the quotation items table
9. Incomplete items are highlighted for completion

## Notes

- Mock data now includes currency, defaultMargin, and notes fields
- The EditQuotation component gracefully handles missing metadata
- The NewQuotation component supports both routes (`/quotations/new` and `/quotations/metadata/:id`)
- Breadcrumbs show the source when coming from search pages

