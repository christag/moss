# UAT Test Scenarios: Agent 1 - Playwright UI/UX Testing

**Agent**: Playwright UI/UX Testing Agent
**Focus**: Frontend visual testing, user workflows, responsive design, accessibility
**Tools**: Playwright MCP only (exclusive access)
**Output File**: `UAT-RESULTS-PLAYWRIGHT-UI.md`

---

## Test Suite 1: List Pages (16 Objects)

### Objects to Test
1. Companies (/companies)
2. Locations (/locations)
3. Rooms (/rooms)
4. People (/people)
5. Devices (/devices)
6. Groups (/groups)
7. Networks (/networks)
8. IOs (/ios)
9. IP Addresses (/ip-addresses)
10. Software (/software)
11. SaaS Services (/saas-services)
12. Installed Applications (/installed-applications)
13. Software Licenses (/software-licenses)
14. Documents (/documents)
15. External Documents (/external-documents)
16. Contracts (/contracts)

### Test Cases (Per Object)

#### TC-PW-LIST-[OBJECT]-001: Empty State Display
- **Steps**:
  1. Navigate to /[object]
  2. Take screenshot of empty state
  3. Verify "No [objects] found" message displays
  4. Verify "Add [Object]" button present
- **Expected**: Clean empty state with helpful message and CTA button
- **Evidence**: Screenshot

#### TC-PW-LIST-[OBJECT]-002: Table Layout
- **Steps**:
  1. Add seed data (or use existing)
  2. Navigate to /[object]
  3. Take screenshot of populated table
  4. Verify table columns match spec
  5. Verify column headers present
  6. Verify data rows display
- **Expected**: Professional table layout with all expected columns
- **Evidence**: Screenshot

#### TC-PW-LIST-[OBJECT]-003: Search Functionality
- **Steps**:
  1. Navigate to /[object]
  2. Locate search input field
  3. Type search term
  4. Verify table filters in real-time
  5. Clear search
  6. Verify table resets
- **Expected**: Search filters results dynamically
- **Evidence**: Screenshot of filtered results

#### TC-PW-LIST-[OBJECT]-004: Filter Controls
- **Steps**:
  1. Navigate to /[object]
  2. Locate filter dropdowns/inputs
  3. Select filter value
  4. Verify table updates
  5. Clear filter
  6. Verify table resets
- **Expected**: Filters work correctly and update table
- **Evidence**: Screenshot of filtered state

#### TC-PW-LIST-[OBJECT]-005: Sort Functionality
- **Steps**:
  1. Navigate to /[object]
  2. Click column header to sort ascending
  3. Verify sort icon appears
  4. Click again to sort descending
  5. Verify icon changes
- **Expected**: Sorting works bi-directionally with visual indicators
- **Evidence**: Screenshot of sorted table

#### TC-PW-LIST-[OBJECT]-006: Pagination (if >50 items)
- **Steps**:
  1. Navigate to /[object] with >50 items
  2. Verify "Showing X-Y of Z" message
  3. Click "Next" button
  4. Verify page 2 loads
  5. Click "Previous" button
  6. Verify page 1 loads
- **Expected**: Pagination controls work correctly
- **Evidence**: Screenshot of pagination controls

#### TC-PW-LIST-[OBJECT]-007: Add New Button
- **Steps**:
  1. Navigate to /[object]
  2. Click "Add [Object]" button
  3. Verify redirect to /[object]/new
- **Expected**: Button navigates to create form
- **Evidence**: Screenshot of create form

#### TC-PW-LIST-[OBJECT]-008: Column Management (Enhanced Tables)
- **Steps**:
  1. Navigate to /[object]
  2. Locate "Manage Columns" button/icon
  3. Click to open column selector
  4. Toggle column visibility
  5. Verify table updates
- **Expected**: Column visibility can be toggled
- **Evidence**: Screenshot of column selector

#### TC-PW-LIST-[OBJECT]-009: Per-Column Filtering (Enhanced Tables)
- **Steps**:
  1. Navigate to /[object]
  2. Locate column filter icon/input
  3. Enter filter value for specific column
  4. Verify table filters on that column only
  5. Clear filter
- **Expected**: Per-column filters work independently
- **Evidence**: Screenshot of filtered column

---

## Test Suite 2: Create Forms (16 Objects)

### Test Cases (Per Object)

#### TC-PW-CREATE-[OBJECT]-001: Form Renders
- **Steps**:
  1. Navigate to /[object]/new
  2. Take screenshot
  3. Verify all expected fields present
  4. Verify field labels correct
  5. Verify field types correct (text, select, date, etc.)
- **Expected**: Complete form displays with all fields
- **Evidence**: Screenshot

#### TC-PW-CREATE-[OBJECT]-002: Required Field Validation
- **Steps**:
  1. Navigate to /[object]/new
  2. Click "Save" without filling required fields
  3. Verify error messages display
  4. Verify fields highlighted in red (or error styling)
- **Expected**: Validation prevents submission, shows errors
- **Evidence**: Screenshot of validation errors

#### TC-PW-CREATE-[OBJECT]-003: Dropdown Population
- **Steps**:
  1. Navigate to /[object]/new
  2. Click dropdown field (e.g., company, location)
  3. Verify options populate
  4. Verify at least 1 option available
  5. Select option
  6. Verify selection persists
- **Expected**: Dropdowns load related data correctly
- **Evidence**: Screenshot of populated dropdown

#### TC-PW-CREATE-[OBJECT]-004: Date Picker
- **Steps**:
  1. Navigate to /[object]/new
  2. Click date field
  3. Verify date picker opens
  4. Select date
  5. Verify date displays in field
- **Expected**: Date picker functional and intuitive
- **Evidence**: Screenshot of date picker

#### TC-PW-CREATE-[OBJECT]-005: Text Area
- **Steps**:
  1. Navigate to /[object]/new
  2. Locate text area field (notes, description)
  3. Type multi-line text
  4. Verify text wraps correctly
  5. Verify no character limit issues
- **Expected**: Text area accepts long text
- **Evidence**: Screenshot with text

#### TC-PW-CREATE-[OBJECT]-006: Conditional Fields
- **Steps**:
  1. Navigate to /[object]/new
  2. Identify conditional field trigger (e.g., device_type)
  3. Select option that reveals additional fields
  4. Verify fields appear
  5. Change selection to hide fields
  6. Verify fields disappear
- **Expected**: Conditional logic works correctly
- **Evidence**: Screenshot showing conditional state

#### TC-PW-CREATE-[OBJECT]-007: Successful Creation
- **Steps**:
  1. Navigate to /[object]/new
  2. Fill all required fields with valid data
  3. Click "Save" button
  4. Verify success message or redirect
  5. Verify object appears in list or detail page
- **Expected**: Object created successfully
- **Evidence**: Screenshot of success state

#### TC-PW-CREATE-[OBJECT]-008: Error Message Display
- **Steps**:
  1. Navigate to /[object]/new
  2. Fill field with invalid data (e.g., invalid email format)
  3. Attempt to save
  4. Verify error message displays clearly
  5. Verify message indicates which field is invalid
- **Expected**: Clear, actionable error messages
- **Evidence**: Screenshot of error message

---

## Test Suite 3: Detail Pages (16 Objects)

### Test Cases (Per Object)

#### TC-PW-DETAIL-[OBJECT]-001: Overview Tab Display
- **Steps**:
  1. Navigate to /[object]/[id]
  2. Verify Overview tab is active by default
  3. Take screenshot
  4. Verify all fields display with correct data
  5. Verify field labels present
  6. Verify formatting (dates, currency, etc.)
- **Expected**: Complete object details displayed
- **Evidence**: Screenshot

#### TC-PW-DETAIL-[OBJECT]-002: Relationship Tabs
- **Steps**:
  1. Navigate to /[object]/[id]
  2. Identify relationship tabs (e.g., "Rooms" for Location)
  3. Click each relationship tab
  4. Verify tab content loads
  5. Verify related items display in table/list
- **Expected**: All relationship tabs functional
- **Evidence**: Screenshot of each tab

#### TC-PW-DETAIL-[OBJECT]-003: Action Buttons
- **Steps**:
  1. Navigate to /[object]/[id]
  2. Verify "Edit" button present (Morning Blue)
  3. Verify "Delete" button present (Orange)
  4. Verify button styling matches design system
  5. Hover over buttons to test hover states
- **Expected**: Action buttons present with correct styling
- **Evidence**: Screenshot

#### TC-PW-DETAIL-[OBJECT]-004: Badge Styling
- **Steps**:
  1. Navigate to /[object]/[id]
  2. Locate status badge or other badges
  3. Verify badge color matches design system:
    - Active: Green (#28C077)
    - Inactive: Light Blue (#ACD7FF)
    - Warning/Repair: Orange (#FD6A3D)
    - Retired: Brew Black 40% opacity
  4. Take screenshot
- **Expected**: Badges use correct design system colors
- **Evidence**: Screenshot of badge

#### TC-PW-DETAIL-[OBJECT]-005: Field Formatting
- **Steps**:
  1. Navigate to /[object]/[id]
  2. Verify date formatting (e.g., "Oct 11, 2025" or ISO)
  3. Verify URL formatting (clickable links)
  4. Verify email formatting (clickable mailto:)
  5. Verify phone formatting (clickable tel:)
  6. Verify null/empty fields show "—" or "Not specified"
- **Expected**: All field types formatted correctly
- **Evidence**: Screenshot

#### TC-PW-DETAIL-[OBJECT]-006: Tab Navigation
- **Steps**:
  1. Navigate to /[object]/[id]
  2. Click each tab in sequence
  3. Verify active tab highlighted (Morning Blue)
  4. Verify inactive tabs clickable
  5. Verify tab content updates
- **Expected**: Tab navigation smooth and intuitive
- **Evidence**: Screenshot of active tab

#### TC-PW-DETAIL-[OBJECT]-007: Related Items Lists
- **Steps**:
  1. Navigate to /[object]/[id]
  2. Click relationship tab with items (e.g., Location → Rooms)
  3. Verify items display in table/list format
  4. Verify item count badge on tab
  5. Verify "Add New" button present
  6. Click item to navigate to detail
  7. Verify navigation works
- **Expected**: Related items list functional with navigation
- **Evidence**: Screenshot of related items

---

## Test Suite 4: Edit Forms (16 Objects)

### Test Cases (Per Object)

#### TC-PW-EDIT-[OBJECT]-001: Form Pre-Population
- **Steps**:
  1. Navigate to /[object]/[id]
  2. Click "Edit" button
  3. Verify redirect to /[object]/[id]/edit
  4. Take screenshot
  5. Verify all fields pre-populated with existing data
  6. Verify dropdowns show correct selected values
- **Expected**: Form loads with current object data
- **Evidence**: Screenshot

#### TC-PW-EDIT-[OBJECT]-002: Update Functionality
- **Steps**:
  1. Navigate to /[object]/[id]/edit
  2. Modify one or more fields
  3. Click "Save" button
  4. Verify success message or redirect
  5. Return to detail page
  6. Verify changes persisted
- **Expected**: Updates save correctly
- **Evidence**: Screenshot of updated detail page

#### TC-PW-EDIT-[OBJECT]-003: Validation on Update
- **Steps**:
  1. Navigate to /[object]/[id]/edit
  2. Clear required field or enter invalid data
  3. Attempt to save
  4. Verify validation error displays
  5. Verify save prevented
- **Expected**: Validation works on edit as well as create
- **Evidence**: Screenshot of validation error

#### TC-PW-EDIT-[OBJECT]-004: Cancel Button
- **Steps**:
  1. Navigate to /[object]/[id]/edit
  2. Modify fields
  3. Click "Cancel" button
  4. Verify redirect back to detail page
  5. Verify changes not saved
- **Expected**: Cancel discards changes
- **Evidence**: Screenshot

---

## Test Suite 5: Delete Flows (16 Objects)

### Test Cases (Per Object)

#### TC-PW-DELETE-[OBJECT]-001: Confirmation Dialog
- **Steps**:
  1. Navigate to /[object]/[id]
  2. Click "Delete" button (Orange)
  3. Verify confirmation dialog appears
  4. Verify dialog message clear (e.g., "Are you sure?")
  5. Verify "Cancel" and "Confirm" buttons present
- **Expected**: Confirmation dialog prevents accidental deletion
- **Evidence**: Screenshot of dialog

#### TC-PW-DELETE-[OBJECT]-002: Dependency Checking Message
- **Steps**:
  1. Create object with dependencies (e.g., Location with Rooms)
  2. Navigate to /[object]/[id]
  3. Click "Delete" button
  4. Verify error message explains dependencies
  5. Verify deletion prevented
- **Expected**: Clear error message about dependencies
- **Evidence**: Screenshot of error

#### TC-PW-DELETE-[OBJECT]-003: Successful Deletion
- **Steps**:
  1. Create object without dependencies
  2. Navigate to /[object]/[id]
  3. Click "Delete" button
  4. Click "Confirm" in dialog
  5. Verify redirect to list page
  6. Verify success message
  7. Verify object removed from list
- **Expected**: Deletion successful with feedback
- **Evidence**: Screenshot of list page

#### TC-PW-DELETE-[OBJECT]-004: Cancel Deletion
- **Steps**:
  1. Navigate to /[object]/[id]
  2. Click "Delete" button
  3. Click "Cancel" in confirmation dialog
  4. Verify dialog closes
  5. Verify still on detail page
  6. Verify object not deleted
- **Expected**: Cancel preserves object
- **Evidence**: Screenshot

---

## Test Suite 6: Navigation

### TC-PW-NAV-001: Dropdown Menus
- **Steps**:
  1. Navigate to any page
  2. Hover over "Places" dropdown in header
  3. Verify dropdown menu appears after 200ms delay
  4. Verify menu items: Companies, Locations, Rooms
  5. Click "Locations"
  6. Verify navigation to /locations
- **Expected**: Dropdown menus work smoothly
- **Evidence**: Screenshot of dropdown

### TC-PW-NAV-002: Active State Highlighting
- **Steps**:
  1. Navigate to /networks
  2. Verify "IT Services" dropdown highlighted (Morning Blue background)
  3. Open "IT Services" dropdown
  4. Verify "Networks" menu item highlighted
  5. Navigate to /devices
  6. Verify "Assets" dropdown highlighted
- **Expected**: Active state clearly indicates current page
- **Evidence**: Screenshot showing active state

### TC-PW-NAV-003: Hover Interactions
- **Steps**:
  1. Hover over dropdown trigger
  2. Verify menu appears after 200ms
  3. Move mouse away
  4. Verify menu disappears after delay
  5. Hover over menu item
  6. Verify hover state (lighter background)
- **Expected**: Smooth hover interactions, no flickering
- **Evidence**: Screenshot

### TC-PW-NAV-004: Click Outside to Close
- **Steps**:
  1. Open dropdown menu
  2. Click elsewhere on page
  3. Verify dropdown closes
- **Expected**: Clicking outside closes menu
- **Evidence**: Screenshot

### TC-PW-NAV-005: Logo Navigation
- **Steps**:
  1. Navigate to any page
  2. Click logo/site name in header
  3. Verify redirect to homepage (/)
- **Expected**: Logo returns to home
- **Evidence**: Screenshot

### TC-PW-NAV-006: Breadcrumbs (if implemented)
- **Steps**:
  1. Navigate to /companies/[id]
  2. Verify breadcrumb trail: Home > Companies > [Company Name]
  3. Click "Companies" in breadcrumb
  4. Verify navigation to /companies
- **Expected**: Breadcrumbs provide navigation path
- **Evidence**: Screenshot

### TC-PW-NAV-007: Back Button Navigation
- **Steps**:
  1. Navigate: List → Detail → Edit
  2. Use browser back button
  3. Verify returns to Detail
  4. Use back button again
  5. Verify returns to List
- **Expected**: Browser back button works correctly
- **Evidence**: Screenshot sequence

### TC-PW-NAV-008: Deep Link Navigation
- **Steps**:
  1. Copy URL of detail page
  2. Open new browser tab
  3. Paste URL and navigate
  4. Verify page loads correctly
- **Expected**: Deep links work, no routing issues
- **Evidence**: Screenshot

### TC-PW-NAV-009: 404 Page (if implemented)
- **Steps**:
  1. Navigate to /nonexistent-page
  2. Verify 404 page displays
  3. Verify helpful message
  4. Verify link back to home
- **Expected**: 404 page user-friendly
- **Evidence**: Screenshot

### TC-PW-NAV-010: Admin Panel Navigation
- **Steps**:
  1. Login as admin user
  2. Navigate to /admin
  3. Verify sidebar displays 11 sections
  4. Click each section
  5. Verify navigation works
  6. Verify active section highlighted
- **Expected**: Admin navigation functional
- **Evidence**: Screenshot of sidebar

---

## Test Suite 7: Design System Compliance

### TC-PW-DESIGN-001: Primary Color Usage
- **Steps**:
  1. Navigate to multiple pages
  2. Take screenshots
  3. Use color picker tool to verify Morning Blue (#1C7FF2) used for:
    - Primary buttons
    - Links
    - Active navigation states
    - Primary headings
- **Expected**: Morning Blue used consistently
- **Evidence**: Screenshots with color annotations

### TC-PW-DESIGN-002: Background Colors
- **Steps**:
  1. Navigate to multiple pages
  2. Verify Off White (#FAF9F5) used for page backgrounds
  3. Verify cards use white or Off White
  4. Verify no harsh white (#FFFFFF) backgrounds
- **Expected**: Soft Off White backgrounds throughout
- **Evidence**: Screenshots

### TC-PW-DESIGN-003: Text Colors
- **Steps**:
  1. Navigate to multiple pages
  2. Verify Brew Black (#231F20) used for body text
  3. Verify text is readable
  4. Verify sufficient contrast
- **Expected**: Brew Black for text, high contrast
- **Evidence**: Screenshots

### TC-PW-DESIGN-004: Badge Colors
- **Steps**:
  1. Navigate to pages with status badges
  2. Verify badge colors:
    - Active/Success: Green (#28C077)
    - Inactive/Info: Light Blue (#ACD7FF)
    - Warning/Error: Orange (#FD6A3D)
    - Retired: Brew Black 40% opacity
  3. Take screenshots
- **Expected**: Badges use design system colors
- **Evidence**: Screenshots of each badge type

### TC-PW-DESIGN-005: Button Styling
- **Steps**:
  1. Navigate to forms
  2. Verify button styles:
    - Primary: Morning Blue background, white text
    - Secondary: Light Blue background, Brew Black text
    - Destructive: Orange background, white text
    - Outline: Border only, transparent background
  3. Verify rounded corners
  4. Verify padding consistent
- **Expected**: Buttons match design system
- **Evidence**: Screenshots

### TC-PW-DESIGN-006: Typography - Font Family
- **Steps**:
  1. Navigate to any page
  2. Use browser inspector to check font-family
  3. Verify Inter font used for all text
  4. Verify fallback fonts present
- **Expected**: Inter font loaded and applied
- **Evidence**: Screenshot of inspector

### TC-PW-DESIGN-007: Typography - Font Sizes
- **Steps**:
  1. Navigate to page with headings
  2. Verify type scale (base 18px, ratio 1.25):
    - H1: 57.6px
    - H2: 46px
    - H3: 36.8px
    - H4: 29.4px
    - H5: 23.5px
    - Body: 18px
    - Small: 14.4px
  3. Use inspector to measure
- **Expected**: Type scale followed consistently
- **Evidence**: Screenshot with measurements

### TC-PW-DESIGN-008: Typography - No Uppercase Emphasis
- **Steps**:
  1. Navigate to multiple pages
  2. Verify no text uses all-caps for emphasis
  3. Verify headings use proper casing (Title Case or Sentence case)
- **Expected**: No UPPERCASE text except acronyms
- **Evidence**: Screenshots

### TC-PW-DESIGN-009: Spacing - Consistent Padding
- **Steps**:
  1. Navigate to multiple pages
  2. Use inspector to measure padding on cards, buttons, inputs
  3. Verify consistent spacing units (e.g., 8px, 16px, 24px, 32px)
- **Expected**: Consistent spacing throughout
- **Evidence**: Screenshot with measurements

### TC-PW-DESIGN-010: Spacing - Consistent Margins
- **Steps**:
  1. Navigate to multiple pages
  2. Verify consistent margins between sections
  3. Verify no cramped layouts
  4. Verify generous white space
- **Expected**: Consistent, generous margins
- **Evidence**: Screenshots

### TC-PW-DESIGN-011: Grid Alignment
- **Steps**:
  1. Navigate to pages with multiple columns
  2. Verify elements align to grid
  3. Verify no floating/misaligned elements
  4. Verify symmetrical layouts
- **Expected**: All elements grid-aligned
- **Evidence**: Screenshots

### TC-PW-DESIGN-012: Form Input Styling
- **Steps**:
  1. Navigate to create form
  2. Verify input field styling:
    - Border: 1px solid gray
    - Border radius: 4px or 8px
    - Padding: ~12px
    - Font size: 18px
    - Focus state: Morning Blue border
  3. Test focus state
- **Expected**: Inputs styled consistently
- **Evidence**: Screenshots (default and focus states)

### TC-PW-DESIGN-013: Dropdown Styling
- **Steps**:
  1. Navigate to create form
  2. Open dropdown
  3. Verify dropdown menu styling:
    - White background
    - Box shadow
    - Hover state on options
    - Selected state indicator
- **Expected**: Dropdowns styled professionally
- **Evidence**: Screenshot

### TC-PW-DESIGN-014: Table Styling
- **Steps**:
  1. Navigate to list page
  2. Verify table styling:
    - Header row: Light Blue background or bold text
    - Row borders: Subtle gray lines
    - Row hover: Light background change
    - Zebra striping (optional): Alternate row colors
- **Expected**: Tables readable and professional
- **Evidence**: Screenshot

### TC-PW-DESIGN-015: Card Styling
- **Steps**:
  1. Navigate to detail page or dashboard
  2. Verify card styling:
    - White or Off White background
    - Subtle box shadow
    - Rounded corners
    - Consistent padding
- **Expected**: Cards have depth and structure
- **Evidence**: Screenshot

### TC-PW-DESIGN-016: Icon Usage
- **Steps**:
  1. Navigate to multiple pages
  2. Verify icons used consistently:
    - Same icon library throughout
    - Consistent sizing
    - Aligned with text
    - Meaningful icons (recognizable purpose)
- **Expected**: Icons enhance usability
- **Evidence**: Screenshots

### TC-PW-DESIGN-017: Error State Styling
- **Steps**:
  1. Navigate to create form
  2. Trigger validation error
  3. Verify error styling:
    - Input border: Orange or red
    - Error message: Orange text
    - Error icon (optional)
  4. Fix error
  5. Verify styling returns to normal
- **Expected**: Errors clearly indicated
- **Evidence**: Screenshot

### TC-PW-DESIGN-018: Success State Styling
- **Steps**:
  1. Create object successfully
  2. Verify success message styling:
    - Green background or border
    - Green icon
    - Clear message text
  3. Verify message auto-dismisses or has close button
- **Expected**: Success feedback clear
- **Evidence**: Screenshot

### TC-PW-DESIGN-019: Loading States
- **Steps**:
  1. Navigate to page with loading state (slow network simulation)
  2. Verify loading indicator:
    - Spinner or skeleton
    - Positioned appropriately
    - Styled in Morning Blue
  3. Verify page renders after loading
- **Expected**: Loading states informative, not jarring
- **Evidence**: Screenshot

### TC-PW-DESIGN-020: Empty States
- **Steps**:
  1. Navigate to list page with no data
  2. Verify empty state:
    - Friendly icon or illustration
    - Clear message ("No items found")
    - Call-to-action button ("Add Item")
- **Expected**: Empty states encourage action
- **Evidence**: Screenshot

### TC-PW-DESIGN-021: Modal Dialog Styling
- **Steps**:
  1. Trigger modal (e.g., delete confirmation)
  2. Verify modal styling:
    - Overlay: Semi-transparent dark background
    - Modal: White background, centered
    - Box shadow
    - Close button or X
  3. Click overlay to dismiss (if applicable)
- **Expected**: Modals styled consistently
- **Evidence**: Screenshot

### TC-PW-DESIGN-022: Form Layout
- **Steps**:
  1. Navigate to create form
  2. Verify layout:
    - Fields in logical order
    - Related fields grouped
    - Labels above inputs (not inline)
    - Help text below inputs (if present)
  3. Verify responsive: Single column on mobile, multi-column on desktop
- **Expected**: Forms well-organized and responsive
- **Evidence**: Screenshot

### TC-PW-DESIGN-023: Consistent Spacing Between Sections
- **Steps**:
  1. Navigate to detail page
  2. Verify spacing between sections (Overview card, Tabs, Footer):
    - Consistent margin (e.g., 24px or 32px)
    - No cramped areas
    - No excessive white space
- **Expected**: Balanced spacing
- **Evidence**: Screenshot

### TC-PW-DESIGN-024: Link Styling
- **Steps**:
  1. Navigate to detail page with links (e.g., Location → Company link)
  2. Verify link styling:
    - Color: Morning Blue
    - Underline: On hover or always
    - Cursor: Pointer
    - Visited state (optional): Slightly different color
  3. Hover over link
  4. Verify hover state
- **Expected**: Links clearly identifiable and interactive
- **Evidence**: Screenshot

### TC-PW-DESIGN-025: Consistent Corner Radius
- **Steps**:
  1. Navigate to multiple pages
  2. Measure corner radius on buttons, inputs, cards, modals
  3. Verify consistent radius (e.g., 4px or 8px everywhere)
- **Expected**: Consistent border-radius throughout
- **Evidence**: Screenshots with measurements

---

## Test Suite 8: Responsive Design

### TC-PW-RESPONSIVE-001: Mobile Layout (320px width)
- **Steps**:
  1. Resize browser to 320px width
  2. Navigate to list page
  3. Verify layout adapts:
    - Single column layout
    - Navigation collapses to hamburger menu (if applicable)
    - Table becomes scrollable or cards stack
    - Text readable, not cut off
  4. Take screenshot
- **Expected**: Usable on smallest mobile devices
- **Evidence**: Screenshot

### TC-PW-RESPONSIVE-002: Mobile Layout (375px width - iPhone)
- **Steps**:
  1. Resize browser to 375px width
  2. Navigate to multiple pages
  3. Verify layouts work well
  4. Verify touch targets ≥44px (buttons, links)
  5. Take screenshots
- **Expected**: Optimized for common mobile size
- **Evidence**: Screenshots

### TC-PW-RESPONSIVE-003: Tablet Layout (768px width - iPad Portrait)
- **Steps**:
  1. Resize browser to 768px width
  2. Navigate to multiple pages
  3. Verify layout uses available space
  4. Verify not just stretched mobile layout
  5. Take screenshots
- **Expected**: Tablet-optimized layout
- **Evidence**: Screenshots

### TC-PW-RESPONSIVE-004: Tablet Layout (1024px width - iPad Landscape)
- **Steps**:
  1. Resize browser to 1024px width
  2. Navigate to multiple pages
  3. Verify layout between tablet and desktop
  4. Take screenshots
- **Expected**: Smooth transition to desktop layout
- **Evidence**: Screenshots

### TC-PW-RESPONSIVE-005: Desktop Layout (1280px width)
- **Steps**:
  1. Resize browser to 1280px width (standard desktop)
  2. Navigate to multiple pages
  3. Verify full desktop layout
  4. Verify multi-column layouts where appropriate
  5. Take screenshots
- **Expected**: Full-featured desktop experience
- **Evidence**: Screenshots

### TC-PW-RESPONSIVE-006: Large Desktop Layout (1920px width)
- **Steps**:
  1. Resize browser to 1920px width
  2. Navigate to multiple pages
  3. Verify content doesn't stretch excessively
  4. Verify max-width constraints (if applicable)
  5. Take screenshots
- **Expected**: Content readable, not stretched
- **Evidence**: Screenshots

### TC-PW-RESPONSIVE-007: Navigation on Mobile
- **Steps**:
  1. Resize browser to 375px width
  2. Verify navigation adapts:
    - Hamburger menu icon appears OR
    - Horizontal scrolling navigation OR
    - Bottom tab bar
  3. Test navigation interaction
  4. Verify all menu items accessible
- **Expected**: Mobile navigation functional
- **Evidence**: Screenshot

### TC-PW-RESPONSIVE-008: Forms on Mobile
- **Steps**:
  1. Resize browser to 375px width
  2. Navigate to create form
  3. Verify form layout:
    - Single column
    - Full-width inputs
    - Touch-friendly buttons (≥44px)
    - Dropdowns open correctly
    - Date pickers work
- **Expected**: Forms usable on mobile
- **Evidence**: Screenshot

### TC-PW-RESPONSIVE-009: Tables on Mobile
- **Steps**:
  1. Resize browser to 375px width
  2. Navigate to list page
  3. Verify table handling:
    - Horizontal scroll with sticky first column OR
    - Cards replace table on mobile OR
    - Truncated columns with expand option
  4. Verify data accessible
- **Expected**: Table data accessible on mobile
- **Evidence**: Screenshot

### TC-PW-RESPONSIVE-010: Detail Pages on Mobile
- **Steps**:
  1. Resize browser to 375px width
  2. Navigate to detail page
  3. Verify layout:
    - Tabs scrollable horizontally OR
    - Tabs stack vertically
    - Fields stack vertically
    - Action buttons accessible
- **Expected**: Detail pages readable on mobile
- **Evidence**: Screenshot

### TC-PW-RESPONSIVE-011: Modals on Mobile
- **Steps**:
  1. Resize browser to 375px width
  2. Trigger modal (e.g., delete confirmation)
  3. Verify modal:
    - Fits screen width
    - Content not cut off
    - Buttons accessible
    - Close button reachable
- **Expected**: Modals work on mobile
- **Evidence**: Screenshot

### TC-PW-RESPONSIVE-012: Text Readability on Mobile
- **Steps**:
  1. Resize browser to 375px width
  2. Navigate to pages with text content
  3. Verify:
    - Font size ≥16px (prevents auto-zoom on iOS)
    - Line length reasonable (not too wide)
    - Line height comfortable
    - No horizontal scrolling for text
- **Expected**: Text readable without zooming
- **Evidence**: Screenshot

### TC-PW-RESPONSIVE-013: Image Scaling
- **Steps**:
  1. Resize browser from mobile to desktop
  2. Navigate to pages with images (if any)
  3. Verify images scale proportionally
  4. Verify no distortion or pixelation
  5. Verify images don't overflow containers
- **Expected**: Images responsive and maintain quality
- **Evidence**: Screenshots at different sizes

### TC-PW-RESPONSIVE-014: Breakpoint Transitions
- **Steps**:
  1. Slowly resize browser from 320px to 1920px
  2. Observe layout transitions at breakpoints
  3. Verify smooth transitions, no jarring shifts
  4. Verify no broken layouts at any width
- **Expected**: Smooth responsive behavior at all sizes
- **Evidence**: Screenshots at key breakpoints

### TC-PW-RESPONSIVE-015: Orientation Change (if testing on device)
- **Steps**:
  1. Open app on mobile device or simulator
  2. View in portrait orientation
  3. Rotate to landscape
  4. Verify layout adapts
  5. Verify no layout issues
  6. Rotate back to portrait
- **Expected**: App handles orientation changes gracefully
- **Evidence**: Screenshots of both orientations

---

## Test Suite 9: Accessibility

### TC-PW-A11Y-001: Color Contrast Ratio (Text)
- **Steps**:
  1. Navigate to multiple pages
  2. Use accessibility tools (e.g., axe DevTools, WAVE) to check contrast
  3. Verify text-to-background contrast ≥4.5:1 (WCAG AA)
  4. Check body text, headings, labels
- **Expected**: All text meets WCAG AA contrast requirements
- **Evidence**: Accessibility tool report

### TC-PW-A11Y-002: Color Contrast Ratio (UI Components)
- **Steps**:
  1. Navigate to pages with buttons, inputs, badges
  2. Check contrast for UI component borders/states
  3. Verify ≥3:1 contrast (WCAG AA for non-text)
- **Expected**: UI components have sufficient contrast
- **Evidence**: Accessibility tool report

### TC-PW-A11Y-003: Form Labels
- **Steps**:
  1. Navigate to create form
  2. Use screen reader or inspector to verify:
    - Every input has associated <label>
    - Labels use for attribute or wrap input
    - Placeholders don't replace labels
  3. Tab through form
  4. Verify screen reader announces labels
- **Expected**: All form fields labeled correctly
- **Evidence**: Screenshot of HTML structure

### TC-PW-A11Y-004: Form Validation Announcements
- **Steps**:
  1. Navigate to create form with screen reader
  2. Submit form with errors
  3. Verify screen reader announces errors
  4. Verify aria-invalid attribute set on invalid fields
  5. Verify aria-describedby links to error message
- **Expected**: Errors accessible to screen readers
- **Evidence**: Screenshot of HTML with ARIA attributes

### TC-PW-A11Y-005: Keyboard Navigation - Tab Order
- **Steps**:
  1. Navigate to any page
  2. Tab through interactive elements
  3. Verify tab order logical (left-to-right, top-to-bottom)
  4. Verify all interactive elements reachable
  5. Verify no keyboard traps
- **Expected**: Logical, complete tab order
- **Evidence**: Video or detailed description

### TC-PW-A11Y-006: Keyboard Navigation - Forms
- **Steps**:
  1. Navigate to create form using only keyboard
  2. Tab to each field
  3. Fill fields using keyboard
  4. Verify dropdowns operable (arrow keys, enter)
  5. Submit form using Enter or Space on button
- **Expected**: Forms fully keyboard-accessible
- **Evidence**: Video or detailed description

### TC-PW-A11Y-007: Keyboard Navigation - Modals
- **Steps**:
  1. Trigger modal using keyboard
  2. Verify focus trapped in modal (Tab doesn't escape)
  3. Verify Escape key closes modal
  4. Verify focus returns to trigger element on close
- **Expected**: Modal keyboard interaction correct
- **Evidence**: Video or detailed description

### TC-PW-A11Y-008: Focus Indicators
- **Steps**:
  1. Navigate to any page
  2. Tab through interactive elements
  3. Verify visible focus indicator on each element:
    - Outline or border
    - Color: Morning Blue or high-contrast
    - Thickness: ≥2px
  4. Verify focus indicator not removed by CSS
- **Expected**: Clear focus indicators on all interactive elements
- **Evidence**: Screenshot of focused elements

### TC-PW-A11Y-009: ARIA Attributes - Buttons
- **Steps**:
  1. Navigate to page with icon-only buttons (if any)
  2. Inspect HTML
  3. Verify aria-label or aria-labelledby present
  4. Verify label descriptive (not just "button")
- **Expected**: Icon buttons labeled for screen readers
- **Evidence**: Screenshot of HTML

### TC-PW-A11Y-010: ARIA Attributes - Status Messages
- **Steps**:
  1. Trigger success or error message
  2. Inspect HTML
  3. Verify role="alert" or role="status" present
  4. Verify screen reader announces message
- **Expected**: Status messages accessible
- **Evidence**: Screenshot of HTML

### TC-PW-A11Y-011: ARIA Attributes - Tabs
- **Steps**:
  1. Navigate to detail page with tabs
  2. Inspect HTML
  3. Verify tab list has role="tablist"
  4. Verify tabs have role="tab", aria-selected, aria-controls
  5. Verify tab panels have role="tabpanel", aria-labelledby
  6. Test keyboard navigation (arrow keys)
- **Expected**: Tabs follow ARIA authoring practices
- **Evidence**: Screenshot of HTML

### TC-PW-A11Y-012: ARIA Attributes - Dropdown Menus
- **Steps**:
  1. Navigate to header with dropdown navigation
  2. Inspect HTML
  3. Verify aria-haspopup="true" on trigger
  4. Verify aria-expanded reflects open/closed state
  5. Verify role="menu" and role="menuitem" (if applicable)
- **Expected**: Dropdown menus accessible
- **Evidence**: Screenshot of HTML

### TC-PW-A11Y-013: Heading Hierarchy
- **Steps**:
  1. Navigate to multiple pages
  2. Use accessibility tools to check heading structure
  3. Verify:
    - One H1 per page (page title)
    - Headings in sequential order (no skipping levels)
    - Headings describe sections
- **Expected**: Proper heading hierarchy
- **Evidence**: Accessibility tool report

### TC-PW-A11Y-014: Landmark Regions
- **Steps**:
  1. Navigate to any page
  2. Inspect HTML
  3. Verify landmark regions present:
    - <header> or role="banner"
    - <nav> or role="navigation"
    - <main> or role="main"
    - <footer> or role="contentinfo"
  4. Verify screen reader can navigate by landmarks
- **Expected**: Proper landmark structure
- **Evidence**: Screenshot of HTML

### TC-PW-A11Y-015: Link Purpose
- **Steps**:
  1. Navigate to pages with links
  2. Verify link text descriptive:
    - "View Details" not just "Click Here"
    - "Edit Company" not just "Edit"
  3. Verify links distinguishable from surrounding text (color + underline)
- **Expected**: Link purpose clear from text
- **Evidence**: Screenshots

### TC-PW-A11Y-016: Language Attribute
- **Steps**:
  1. Navigate to any page
  2. Inspect HTML
  3. Verify <html lang="en"> (or appropriate language)
  4. Verify lang attribute present and correct
- **Expected**: Page language declared
- **Evidence**: Screenshot of HTML

### TC-PW-A11Y-017: Page Titles
- **Steps**:
  1. Navigate to multiple pages
  2. Check browser tab title
  3. Verify titles descriptive and unique:
    - "Companies - M.O.S.S."
    - "Edit Company: Acme Corp - M.O.S.S."
  4. Verify title updates on navigation
- **Expected**: Unique, descriptive page titles
- **Evidence**: Screenshots of browser tabs

### TC-PW-A11Y-018: Skip Links (if implemented)
- **Steps**:
  1. Navigate to any page
  2. Press Tab once
  3. Verify "Skip to main content" link visible
  4. Press Enter
  5. Verify focus moves to main content area
- **Expected**: Skip link allows bypassing navigation
- **Evidence**: Video or screenshot

### TC-PW-A11Y-019: Screen Reader Testing - Page Overview
- **Steps**:
  1. Enable screen reader (NVDA, JAWS, VoiceOver)
  2. Navigate to homepage
  3. Verify screen reader announces:
    - Page title
    - Main heading
    - Navigation structure
    - Interactive elements
  4. Navigate through page
  5. Verify logical reading order
- **Expected**: Page structure clear to screen reader users
- **Evidence**: Detailed screen reader output notes

### TC-PW-A11Y-020: Screen Reader Testing - Form Interaction
- **Steps**:
  1. Enable screen reader
  2. Navigate to create form
  3. Tab through form
  4. Verify screen reader announces:
    - Field labels
    - Field types (text, select, etc.)
    - Required fields ("required")
    - Help text (if present)
    - Error messages
  5. Complete form
  6. Verify success message announced
- **Expected**: Forms fully accessible via screen reader
- **Evidence**: Detailed screen reader output notes

---

## Testing Execution Notes

### Setup
```bash
# Start development server
npm run dev

# Verify running on http://localhost:3001
```

### Playwright MCP Tools to Use
- **Navigation**: `mcp__playwright__browser_navigate`
- **Screenshots**: `mcp__playwright__browser_take_screenshot`
- **Page Analysis**: `mcp__playwright__browser_snapshot`
- **Clicks**: `mcp__playwright__browser_click`
- **Text Input**: `mcp__playwright__browser_type`
- **Form Filling**: `mcp__playwright__browser_fill_form`
- **JavaScript Execution**: `mcp__playwright__browser_evaluate`
- **Window Resizing**: `mcp__playwright__browser_resize`

### Screenshot Naming Convention
`TC-[ID]-[description]-[timestamp].png`

Example: `TC-PW-LIST-COMPANIES-001-empty-state-20251011-1430.png`

### Test Result Documentation
For each test case, document:
1. **Test ID**: TC-PW-XXX-XXX
2. **Status**: ✅ PASS / ❌ FAIL / ⚠️ BLOCKED / ⏭️ SKIP
3. **Evidence**: Screenshot path(s)
4. **Notes**: Any observations
5. **Defect ID**: If failed, reference DEF-UAT-XXX

### Pass/Fail Criteria
- **PASS**: Test executed as expected, no issues
- **FAIL**: Test did not meet expected outcome, defect found
- **BLOCKED**: Test cannot proceed due to blocker (e.g., page not loading)
- **SKIP**: Test not applicable or out of scope

---

## Estimated Execution Time

- **Setup**: 15 minutes
- **List Pages**: 144 tests × 2 min = 4.8 hours
- **Create Forms**: 128 tests × 3 min = 6.4 hours
- **Detail Pages**: 112 tests × 2 min = 3.7 hours
- **Edit Forms**: 64 tests × 3 min = 3.2 hours
- **Delete Flows**: 64 tests × 2 min = 2.1 hours
- **Navigation**: 10 tests × 5 min = 0.8 hours
- **Design System**: 25 tests × 5 min = 2.1 hours
- **Responsive**: 15 tests × 8 min = 2.0 hours
- **Accessibility**: 20 tests × 10 min = 3.3 hours
- **Documentation**: 2 hours

**Total**: ~30 hours (can be accelerated with automated loops)

---

## Success Criteria

- **Pass Rate Target**: ≥90%
- **Critical Issues**: 0 (security, data loss, system crashes)
- **High Issues**: ≤5 (major features broken)
- **Screenshots**: All tests have evidence
- **Documentation**: Complete and clear

---

**Agent Owner**: Playwright UI/UX Testing Agent
**Output File**: UAT-RESULTS-PLAYWRIGHT-UI.md
**Status**: Ready for execution
