# Status Functionality Requirements

## Overview
This document outlines the requirements and implementation details for the status functionality in the project management system.

## Features

### 1. Status Display
- **Location**: Various components throughout the application (tickets, boards, etc.)
- **Display**: Statuses are shown as colored pills/chips or buttons
- **Sorting**: Statuses are sorted alphabetically (A-Z) by name in settings
- **Color Support**: 
  - Each status can have its own custom color
  - Default color: `#6a2add` (primary color) when no color is specified
  - Colors are applied via inline styles for dynamic rendering

### 2. Statuses Settings Page
- **Location**: Project Settings → Statuses tab
- **Route**: `/settings/:projectId/statuses`
- **Functionality**:
  - Lists all statuses in the project
  - Statuses are sorted alphabetically (A-Z) by name
  - Edit status names by clicking directly on the status name
  - Edit status colors by clicking directly on the color preview/display
  - Delete statuses with confirmation dialog (default statuses cannot be deleted)
  - Shows status preview with current color
  - Loading and empty states
  - Default status indicator badge

#### Status Name Editing
- **UI**: Click directly on status name to edit
- **Functionality**:
  - Single click on status name enters edit mode
  - Input field auto-focuses and selects text
  - Save/Cancel buttons appear
  - Validates that name is not empty
  - Updates status via API on save
  - Shows success/error toast notifications

#### Status Color Editing
- **UI**: Click directly on color preview/display to edit
- **Functionality**:
  - Single click on color opens color picker immediately
  - Native color picker opens automatically
  - Hex input field for manual color entry
  - Save/Cancel buttons appear
  - Updates status color via API on save
  - Shows success/error toast notifications
  - Color preview updates in real-time

#### Status Deletion
- **UI**: Delete button for each status
- **Functionality**:
  - Default statuses cannot be deleted (button is disabled)
  - Confirmation dialog before deletion
  - Removes status from project
  - Refreshes status list after deletion
  - Shows success/error toast notifications
  - Error message shown if attempting to delete default status

### 3. Status Data Structure
```typescript
interface IStatus {
  id: string;
  name: string;
  slug: string;
  tenant: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  board?: string;
  color?: string;  // Optional color property
}
```

## Implementation Files

### Components
- `src/pages/Setting/StatusesSettings/StatusesSettings.tsx`
  - Statuses management page
  - Edit status names and colors
  - Delete statuses
  - Click-to-edit functionality
  - Default status protection

### Styles
- `src/pages/Setting/StatusesSettings/StatusesSettings.module.scss`
  - Status chip styling
  - Color support with dynamic backgrounds
  - Edit mode styling
  - Default badge styling

### API
- `src/api/status/status.ts`
  - `getStatuses(projectId)` - Get all statuses for project
  - `updateStatus(projectId, statusId, data)` - Update status name and/or color
  - `deleteStatus(projectId, statusId)` - Delete status from project

### Types
- `src/types.d.ts`
  - `IStatus` interface with optional `color` property

## User Interactions

### Managing Statuses in Settings
1. User navigates to Project Settings → Statuses tab
2. All project statuses are displayed in a list (sorted A-Z)
3. **Editing Status Name**:
   - User clicks directly on status name
   - Input field appears with current name selected
   - User edits name and clicks Save
   - Status name updates via API
4. **Editing Status Color**:
   - User clicks directly on color preview/display
   - Color picker opens immediately
   - User selects color or enters hex value
   - User clicks Save to update
   - Status color updates via API
5. **Deleting Status**:
   - User clicks Delete button
   - If status is default, error message is shown
   - If status is not default, confirmation dialog appears
   - User confirms deletion
   - Status is removed from project

## Color Behavior
- Statuses can display with their assigned color throughout the application
- If no color specified, defaults to `#6a2add` (primary color)
- **Status Chips in Settings**:
  - Use status's color as background
  - Color preview shows current color
  - Real-time color updates during editing
- **Colors are applied via inline `style` attribute for dynamic rendering**

## Default Status Protection
- Default statuses are marked with `isDefault: true`
- Default statuses cannot be deleted
- Delete button is disabled for default statuses
- Default status badge indicator shows "(Default)" next to status name
- Error message displayed if user attempts to delete default status

## Error Handling
- Failed status operations show error toast notifications
- Success operations show success toast notifications
- API errors are caught and displayed to user
- Validation errors (empty name, etc.) are shown to user

## Empty State
- When no statuses are found, displays message: "No statuses found. Statuses are created automatically."
- Statuses are typically created automatically by the system

## Sorting
- Statuses are sorted alphabetically (A-Z) by name in the settings page
- Sorting is done using `localeCompare()` for proper locale-aware sorting

