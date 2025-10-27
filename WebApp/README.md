# BTS Quotation Assistant - WebApp

A React-based web application for catalog product search, review, and quotation management.

## Project Structure

```
WebApp/
├── public/              # Static files
│   └── index.html       # Main HTML template
├── src/
│   ├── layouts/         # Layout components
│   │   ├── Sidebar.jsx          # Left sidebar navigation
│   │   ├── Sidebar.css
│   │   ├── TopBar.jsx           # Top bar navigation (for specific pages)
│   │   ├── TopBar.css
│   │   ├── MainLayout.jsx       # Main layout wrapper with sidebar
│   │   └── MainLayout.css
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx        # Dashboard (default page)
│   │   ├── Dashboard.css
│   │   ├── Login.jsx            # Login page
│   │   ├── Login.css
│   │   ├── Files.jsx            # Files management page
│   │   ├── SingleSearch.jsx    # Single product search
│   │   ├── MultiItemSearch.jsx # Multi-item batch search
│   │   ├── MultiItemSearch.css
│   │   ├── Quotations.jsx      # Quotations management
│   │   ├── Settings.jsx         # Settings page
│   │   └── PlaceholderPage.css # Shared styles for placeholder pages
│   ├── components/      # Reusable components
│   │   ├── AddToQuotationDialog.jsx
│   │   └── AddToQuotationDialog.css
│   ├── styles/          # Global styles
│   │   └── globals.css          # Global CSS variables and utilities
│   ├── App.jsx          # Main app component with routing
│   └── index.js         # Entry point
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Features

### Pages

1. **Dashboard** (Default Page)
   - Welcome section
   - Quick action buttons
   - Quotations table (Open Drafts / Recent)
   - Uploads in progress

2. **Login**
   - User authentication
   - Email and password fields

3. **Files**
   - Catalog and file management (Coming Soon)

4. **Single Search**
   - Search for individual products (Coming Soon)

5. **Multi-Item Search**
   - Batch search and verification
   - Excel file upload
   - Expandable row details
   - Progress tracking

6. **Quotations**
   - Quotation management (Coming Soon)

7. **Settings**
   - Application settings (Coming Soon)

### Layout Components

- **Sidebar**: Fixed left sidebar navigation (used in most pages)
- **TopBar**: Top navigation bar (used in Multi-Item Search)
- **MainLayout**: Wrapper that includes sidebar for main pages

## Design System

### Color Palette

- **Primary Blue**: `#2188C9` - Actions and interactive elements
- **Primary Blue Hover**: `#1C87C9`
- **Error Red**: `#EF4444` - Error states and destructive actions
- **Success Green**: `#10B981` - Success states
- **Warning Orange**: `#F59E0B` - Warning states
- **Background White**: `#FFFFFF`
- **Background Gray**: `#F0F2F5` - Data sections and secondary backgrounds
- **Text Primary**: `#121417`
- **Text Secondary**: `#637887`
- **Border**: `#DBE0E6`

### Typography

- **Font Family**: Inter, Rubik, -apple-system, BlinkMacSystemFont, 'Segoe UI'
- **Font Sizes**:
  - H1: 28px
  - H2: 22px
  - Body: 14px
  - Small: 12px

### Spacing

Using CSS variables for consistent spacing:
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 12px
- `--spacing-lg`: 16px
- `--spacing-xl`: 20px
- `--spacing-2xl`: 24px
- `--spacing-3xl`: 32px

## Routing

The application uses React Router v6 for navigation:

- `/` → Redirects to `/dashboard`
- `/login` → Login page (no layout)
- `/dashboard` → Dashboard (with sidebar)
- `/files` → Files management (with sidebar)
- `/search` → Single search (with sidebar)
- `/multi-search` → Multi-item search (with top bar, no sidebar)
- `/quotations` → Quotations (with sidebar)
- `/settings` → Settings (with sidebar)

## Available Scripts

### `npm start` or `npm run dev`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm test`

Launches the test runner in interactive watch mode.

## Key Features

### Multi-Item Search

- **Expandable Rows**: Click the `+` button to expand rows and view detailed information
- **Batch Progress**: Real-time progress tracking
- **Excel Upload**: Support for .xlsx and .xls files
- **Status Indicators**: Visual feedback for match status

### Dashboard

- **Quick Actions**: Fast access to common tasks
- **Recent Activity**: View recent quotations and uploads
- **Tab Navigation**: Switch between Open Drafts and Recent quotations

## Development

### Component Guidelines

1. Use functional components with React Hooks
2. Follow the established folder structure
3. Use CSS variables from `globals.css` for colors and spacing
4. Keep components modular and reusable
5. Add proper PropTypes or TypeScript types (future)

### Styling Guidelines

1. Use CSS Modules or scoped CSS files
2. Follow BEM naming convention where appropriate
3. Mobile-first responsive design
4. Use CSS variables for theming
5. Maintain consistency with the design system

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- [ ] Complete placeholder pages
- [ ] Add authentication logic
- [ ] Implement API integration
- [ ] Add state management (Redux/Context)
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Implement real-time updates
- [ ] Add PDF preview functionality
- [ ] Implement advanced search filters
- [ ] Add export functionality

## Contributing

Please follow the coding standards and maintain the existing code structure when contributing.

