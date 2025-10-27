# Quotation System Documentation

## Overview

The quotation system allows users to create, manage, and track quotations through a multi-stage workflow. The system includes two main pages:

1. **Quotations List** (`/quotations`) - View and filter all quotations by status
2. **Edit Quotation** (`/quotations/edit/:id`) - Create or edit quotations

## Features

### Quotations List Page

- **Status Filtering**: Filter quotations by status (All, Searching Items, Inventory Check, Sent for Confirmation, Done)
- **Search**: Search quotations by quotation number or customer name
- **Quick Actions**: Edit or view quotations directly from the list
- **Visual Status Indicators**: Color-coded status badges for easy identification
- **Statistics**: View item count, total value, and incomplete items at a glance

### Edit Quotation Page

#### Header Section
- Quotation number and customer information
- Status selector with 4 states:
  - **Searching Items**: Initial state when creating a quotation
  - **Inventory Check**: Items found, checking stock availability
  - **Sent for Confirmation**: Quotation sent to customer for approval
  - **Done**: Quotation finalized and completed
- Back button to return to quotations list

#### Statistics Dashboard
- Product Count: Total number of items in quotation
- Current Quote Value: Total calculated value
- Incomplete Entries: Number of items without ordering numbers (highlighted in red)

#### Quotation Controls
- **Global Margin Controls**: 
  - Set a global margin percentage
  - Apply margin to all products at once
- **Pull Latest Prices**: Fetch current pricing from database (to be implemented)
- **Add Item**: Add new products to the quotation

#### Product Table
The table includes the following columns:

| Column | Description | Editable |
|--------|-------------|----------|
| Index | Sequential item number | No |
| Ordering # | Product ID/SKU - shows "Search Product" button if incomplete | Button |
| Product Name | Name of the product | Yes |
| Product Type | Standard/Premium/Custom | Yes |
| Quantity | Number of units | Yes |
| Base Price | Cost price before margin | Yes |
| Margin (%) | Profit margin percentage | Yes |
| Manual Price | Override calculated price (optional) | Yes |
| Sketch/Drawing | Link to product sketch or drawing file | Yes |
| Catalog Link | Link to product in catalog | No |
| Notes | Additional notes about the item | Yes |
| Final Price | Calculated final price (auto-calculated) | No |
| Actions | Delete item button | Button |

**Special Features:**
- Incomplete rows are highlighted in yellow
- "Search Product" button navigates to single search to find products
- Final price auto-calculates based on: `Manual Price OR (Base Price × (1 + Margin%))`

#### Export Options

Three export formats available:

1. **Manufacturer Order List**
   - CSV format with Ordering Number and Quantity
   - Only includes complete items with ordering numbers
   - Used for checking inventory with manufacturers

2. **ERP Input File**
   - Comprehensive CSV with all quotation details
   - Includes: Order #, Ordering Number, Product Name, Quantity, Base Price, Margin, Final Price, Notes
   - Ready for import into ERP systems

3. **Customer Email Template**
   - Generates email with all product details
   - Includes sketches/drawings
   - Opens in default email client with pre-filled content

#### Financials Section
- Subtotal: Total of all base prices × quantities
- Margin Total: Total markup amount
- Grand Total: Final quotation value

## Workflow

### Creating a New Quotation

1. Navigate to `/quotations`
2. Click "New Quotation" button
3. Add items manually or from search results
4. Set pricing and margins
5. Export as needed
6. Change status as quotation progresses

### From Single Search

1. Perform search in `/search`
2. Click "Add to Quotation"
3. Select existing quotation or create new
4. Item automatically added with product details

### From Multi-Item Search

1. Upload Excel file with multiple items
2. Review search results
3. Click "Create Quotation" with selected items
4. All items added to new quotation

### Editing Existing Quotation

1. Navigate to `/quotations`
2. Click "Edit" on desired quotation
3. Modify items, prices, margins as needed
4. Update status
5. Export when ready

## Integration Points (To Be Implemented)

### API Endpoints Needed

```javascript
// Get all quotations
GET /api/quotations
Response: Array of quotation objects

// Get single quotation
GET /api/quotations/:id
Response: Quotation object with items

// Create new quotation
POST /api/quotations
Body: { customer, items, status }
Response: Created quotation object

// Update quotation
PUT /api/quotations/:id
Body: { customer, items, status }
Response: Updated quotation object

// Delete quotation
DELETE /api/quotations/:id
Response: Success message

// Pull latest prices
POST /api/quotations/pull-prices
Body: { orderingNumbers: [] }
Response: { prices: {} }
```

### Database Schema

```sql
-- Quotations table
CREATE TABLE quotations (
  id VARCHAR(50) PRIMARY KEY,
  quotation_number VARCHAR(50) UNIQUE,
  customer VARCHAR(255),
  status VARCHAR(50),
  created_date TIMESTAMP,
  last_modified TIMESTAMP
);

-- Quotation items table
CREATE TABLE quotation_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quotation_id VARCHAR(50),
  order_no INT,
  ordering_number VARCHAR(100),
  product_name VARCHAR(255),
  product_type VARCHAR(50),
  quantity INT,
  base_price DECIMAL(10,2),
  margin DECIMAL(5,2),
  manual_price DECIMAL(10,2),
  sketch_file VARCHAR(500),
  catalog_link VARCHAR(500),
  notes TEXT,
  is_incomplete BOOLEAN,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id)
);
```

## Future Enhancements

- [ ] PDF generation for quotations
- [ ] Email sending directly from app
- [ ] Version history for quotations
- [ ] Customer approval tracking
- [ ] Integration with inventory management
- [ ] Automated pricing based on quantity tiers
- [ ] Tax and shipping calculations
- [ ] Multi-currency support
- [ ] Quotation templates
- [ ] Approval workflows
- [ ] Notifications for status changes
- [ ] Bulk actions (duplicate, archive, etc.)
- [ ] Advanced analytics and reporting

## File Structure

```
WebApp/src/pages/
├── Quotations.jsx          # List view of all quotations
├── Quotations.css          # Styles for list view
├── EditQuotation.jsx       # Create/Edit quotation page
└── EditQuotation.css       # Styles for edit page
```

## Navigation Routes

- `/quotations` - Quotations list page
- `/quotations/edit/new` - Create new quotation
- `/quotations/edit/:id` - Edit existing quotation
- `/search` - Single product search (can add to quotation)
- `/multi-search` - Multi-item search (can create quotation)

## Status Colors

| Status | Background | Text |
|--------|-----------|------|
| Searching Items | Yellow | Dark Yellow |
| Inventory Check | Blue | Dark Blue |
| Sent for Confirmation | Purple | Dark Purple |
| Done | Green | Dark Green |

