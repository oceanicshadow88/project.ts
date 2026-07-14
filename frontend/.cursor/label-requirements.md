# Label Functionality Requirements

## Overview
This document outlines the requirements and implementation details for the label functionality in the backlog ticket system.

## Features

### 1. Label Display on Tickets
- **Location**: Backlog page ticket items
- **Display**: Labels are shown as colored pills/chips below the ticket title
- **Sorting**: Labels are sorted alphabetically (A-Z) by name
- **Color Support**: 
  - Each label can have its own custom color
  - Default color: `#6a2add` (primary color) when no color is specified
  - Colors are applied via inline styles for dynamic rendering

### 2. Add Labels to Tickets
- **Component**: `LabelPicker` component
- **Location**: Backlog ticket item toolbar (icon button with label icon)
- **Functionality**:
  - Click label icon to open dropdown
  - Search/filter existing labels
  - Labels are sorted alphabetically (A-Z) by name
  - Select existing label to add to ticket
  - Create new label on-the-fly if label doesn't exist
  - New label creation shows as `"[label name] (New Label)"` option
  - Automatically adds newly created label to ticket

### 3. Remove Labels from Tickets
- **UI**: Each label chip displays an X icon button
- **Functionality**:
  - Click X icon to remove label from ticket
  - Only visible when not in read-only mode
  - Shows success/error toast notifications
  - Automatically refreshes ticket list after removal
- **Tooltip**: 
  - Hovering over the X icon displays "Remove Label" tooltip
  - Tooltip appears above the button with dark background
  - Provides clear indication of button action

### 4. Filter by Label
- **UI**: Click on label chip (not the X button) to filter backlog
- **Functionality**:
  - Clicking on label chip filters the backlog to show only tickets with that label
  - If label is already being filtered, clicking it again removes the filter
  - X button stops event propagation so clicking it doesn't trigger filter
  - Label chips show pointer cursor when filter functionality is available
  - Keyboard accessible (Enter or Space key to filter)
- **Active Filter Display**:
  - Active label filters are displayed at the top of the backlog
  - Active filters use the label's assigned color as background
  - Defaults to `#6a2add` if label has no color
  - Shows "Label: [label name]" with remove button (×)
  - Clicking × removes the filter

### 5. Labels Settings Page
- **Location**: Project Settings → Labels tab
- **Route**: `/settings/:projectId/labels`
- **Functionality**:
  - Lists all labels in the project
  - Labels are sorted alphabetically (A-Z) by name
  - Edit label names by clicking directly on the label name
  - Edit label colors by clicking directly on the color preview/display
  - Delete labels with confirmation dialog
  - Shows label preview with current color
  - Loading and empty states

#### Label Name Editing
- **UI**: Click directly on label name to edit
- **Functionality**:
  - Single click on label name enters edit mode
  - Input field auto-focuses and selects text
  - Save/Cancel buttons appear
  - Validates that name is not empty
  - Updates label via API on save
  - Shows success/error toast notifications

#### Label Color Editing
- **UI**: Click directly on color preview/display to edit
- **Functionality**:
  - Single click on color opens color picker immediately
  - Native color picker opens automatically
  - Hex input field for manual color entry
  - Save/Cancel buttons appear
  - Updates label color via API on save
  - Shows success/error toast notifications
  - Color preview updates in real-time

#### Label Deletion
- **UI**: Delete button for each label
- **Functionality**:
  - Confirmation dialog before deletion
  - Removes label from project
  - Refreshes label list after deletion
  - Shows success/error toast notifications

### 6. Label Data Structure
```typescript
interface ILabelData {
  id: string;
  name: string;
  slug?: string;
  color?: string;  // Optional color property
}
```

## Implementation Files

### Components
- `src/pages/BacklogPage/components/TicketItem/TicketItem.tsx`
  - Main ticket item component
  - Handles label display and removal
  - Renders label chips with remove functionality
  - Enriches labels with color data from project details
  - Click-to-filter functionality on label chips

- `src/pages/BacklogPage/components/TicketItem/LabelPicker/LabelPicker.tsx`
  - Label selection dropdown component
  - Handles label search, selection, and creation
  - Creates new labels via API when needed
  - Shows "[label name] (New Label)" option for new labels

- `src/pages/BacklogPage/BacklogPage.tsx`
  - Main backlog page component
  - Handles label filtering
  - Displays active label filters with colors
  - Filter toggle functionality (click to filter/unfilter)

- `src/pages/Setting/LabelsSettings/LabelsSettings.tsx`
  - Labels management page
  - Edit label names and colors
  - Delete labels
  - Click-to-edit functionality

### Styles
- `src/pages/BacklogPage/components/TicketItem/TicketItem.module.scss`
  - Label chip styling
  - Color support with dynamic backgrounds
  - Hover effects using brightness filter

### API
- `src/api/label/label.ts`
  - `createLabel(ticketId, data)` - Create new label
  - `showLabel(projectId)` - Get all labels for project
  - `removeLabel(ticketId, labelId)` - Remove label from ticket
  - `updateLabel(id, data)` - Update label name and/or color
  - `deleteLabel(id)` - Delete label from project

### Types
- `src/types.d.ts`
  - `ILabelData` interface with optional `color` property

## User Interactions

### Adding a Label
1. User clicks label icon on ticket
2. Dropdown opens with searchable list of existing labels
3. User can:
   - Type to search/filter labels
   - Click existing label to add it
   - Type new label name and click "[name] (New Label)" to create and add

### Removing a Label
1. User clicks X icon on label chip
2. Label is removed from ticket via API
3. UI updates to reflect removal
4. Success toast notification shown

### Filtering by Label
1. User clicks on label chip (anywhere except the X button)
2. Backlog filters to show only tickets with that label
3. If label is already filtered, clicking it again removes the filter
4. Active filters are displayed at the top of the backlog with label colors
5. Active filter shows "Label: [name]" with colored background
6. User can remove filter by clicking × button on active filter
7. User can clear all filters using "Clear all filters" button

### Managing Labels in Settings
1. User navigates to Project Settings → Labels tab
2. All project labels are displayed in a list
3. **Editing Label Name**:
   - User clicks directly on label name
   - Input field appears with current name selected
   - User edits name and clicks Save
   - Label name updates via API
4. **Editing Label Color**:
   - User clicks directly on color preview/display
   - Color picker opens immediately
   - User selects color or enters hex value
   - User clicks Save to update
   - Label color updates via API
5. **Deleting Label**:
   - User clicks Delete button
   - Confirmation dialog appears
   - User confirms deletion
   - Label is removed from project

## Color Behavior
- Labels display with their assigned color throughout the application
- If no color specified, defaults to `#6a2add` (primary color)
- **Label Chips on Tickets**:
  - Use label's color as background
  - Enriched from project details if ticket label data incomplete
  - Hover effect darkens color using CSS `filter: brightness(0.85)`
- **Active Label Filters**:
  - Use label's color as background
  - Displayed at top of backlog when filtering
  - Consistent with label chip styling
- **Colors are applied via inline `style` attribute for dynamic rendering**
- **Color data is fetched from project details context to ensure consistency**

## Error Handling
- Failed label operations show error toast notifications
- Success operations show success toast notifications
- API errors are caught and displayed to user

## Read-Only Mode
- Remove button (X icon) is hidden in read-only mode
- Label picker is disabled in read-only mode
- Labels are still visible for viewing purposes

