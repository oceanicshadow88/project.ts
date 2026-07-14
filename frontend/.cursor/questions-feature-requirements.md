# Questions Feature Requirements and Implementation

## Overview

The Questions feature allows users to ask questions within tickets and have conversations through replies. Questions can be assigned, prioritized, marked as resolved, and tracked for stakeholder responses.

## Database Schema

### Question Model (`be-ts/src/app/model/question.ts`)

```typescript
interface IQuestion {
  title: string;
  priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  assignee?: Types.ObjectId; // Reference to users
  isResolved: boolean;
  waitingForStakeholder: boolean; // New field for tracking stakeholder response
  ticket: Types.ObjectId; // Reference to tickets
  createdBy: Types.ObjectId; // Reference to users
  createdAt: Date;
  updatedAt: Date;
}
```

### Reply Model (`be-ts/src/app/model/reply.ts`)

```typescript
interface IReply {
  content: string; // JSON string of TipTap content
  question: Types.ObjectId; // Reference to questions
  createdBy: Types.ObjectId; // Reference to users
  createdAt: Date;
  updatedAt: Date;
}
```

## Backend API Endpoints

### Questions Endpoints (`be-ts/src/app/routes/v2/api.ts`)

All endpoints are protected by `authenticationTokenMiddleware`:

- `GET /v2/tickets/:ticketId/questions` - Get all questions for a ticket
- `GET /v2/questions/:id` - Get a single question by ID
- `POST /v2/questions` - Create a new question
- `PUT /v2/questions/:id` - Update a question (title, priority, assignee, isResolved, waitingForStakeholder)
- `DELETE /v2/questions/:id` - Delete a question
- `GET /v2/projects/:projectId/questions` - Get all questions for a project (sorted by createdAt, oldest first)

### Replies Endpoints

- `GET /v2/questions/:questionId/replies` - Get all replies for a question
- `POST /v2/replies` - Create a new reply
- `PUT /v2/replies/:id` - Update a reply
- `DELETE /v2/replies/:id` - Delete a reply

## Frontend Components

### QuestionItem Component (`fe-ts/src/components/QuestionItem/QuestionItem.tsx`)

Reusable component for displaying questions. Used in both:

- Ticket Details Page (`QuestionsSession`)
- Questions Page (`QuestionsPage`)

#### Props:

```typescript
interface QuestionItemProps {
  question: IQuestion;
  replies: IReply[];
  isExpanded: boolean;
  onToggleExpanded: (questionId: string) => void;
  onToggleWaitingForStakeholder?: (questionId: string, currentStatus: boolean) => void;
  onToggleResolved?: (questionId: string, currentStatus: boolean) => void;
  onUpdatePriority?: (questionId: string, priority: string) => void;
  onUpdateAssignee?: (questionId: string, assigneeId: string | null) => void;
  onUpdateQuestion?: (questionId: string, title: string) => Promise<void>;
  onDeleteQuestion?: (questionId: string) => Promise<void>;
  onCreateReply: (questionId: string, content: JSONContent) => Promise<void>;
  onUpdateReply?: (replyId: string, content: JSONContent) => Promise<void>;
  onDeleteReply?: (replyId: string) => Promise<void>;
  creatingReplyForQuestion: string | null;
  setCreatingReplyForQuestion: (questionId: string | null) => void;
  users: IUserInfo[];
  showTicketInfo?: boolean; // Show ticket and sprint info (for QuestionsPage)
  canEdit?: boolean; // Enable priority and assignee editing
  currentUserId?: string; // Current user ID for checking question/reply ownership
}
```

#### Features:

1. **Question Display**

   - Question title with strikethrough styling when resolved
   - Inline editing of question title (Edit button for question creator)
   - Priority display (editable dropdown if `canEdit` is true and not resolved)
   - Assignee display (editable dropdown if `canEdit` is true and not resolved)
   - "Replied" badge shown when assignee has replied
   - "Awaiting PO" / "Mark as Awaiting PO" button for stakeholder tracking (hidden when resolved)
   - "Mark as Resolved" button (only shown when not resolved)
   - "Reopen Question" button (only shown when resolved)

2. **Question Editing**

   - "Edit" button appears next to question title (only for question creator)
   - Clicking Edit shows inline input field with current title
   - Can cancel or save edited title
   - Only question creator can edit their own questions
   - Edit/Delete buttons hidden when question is resolved

3. **Question Deletion**

   - "Delete" button appears next to question title (only for question creator)
   - Confirmation dialog before deletion
   - Only question creator can delete their own questions
   - Delete button hidden when question is resolved

4. **Replies Display**

   - Shows latest reply by default
   - "View all X replies" button to expand/collapse all replies
   - **For resolved questions**: Replies section always visible if replies exist
   - Each reply shows: avatar, name, timestamp, and content (TipTap rendered)
   - Replies sorted by `createdAt` (oldest first)
   - Reply content and action buttons (Edit/Delete) displayed in the same row
   - Edit/Delete buttons only visible to the reply author (when `currentUserId === reply.createdBy?.id`)
   - Edit/Delete buttons only shown when `canEdit` is true and question is not resolved

5. **Reply Creation**

   - "+ Add a reply" button
   - TipTap editor for rich text replies
   - Reply button hidden when question is resolved

6. **Reply Editing**

   - "Edit" button appears next to reply content (same row)
   - Clicking Edit shows TipTap editor with current reply content
   - Can cancel or submit edited content
   - Only reply author can edit their own replies
   - Edit button hidden when question is resolved

7. **Reply Deletion**

   - "Delete" button appears next to reply content (same row)
   - Confirmation dialog before deletion
   - Only reply author can delete their own replies
   - Delete button hidden when question is resolved

8. **Resolved Question Restrictions**
   - When a question is resolved, the following actions are disabled/hidden:
     - Edit question title
     - Delete question
     - Edit priority (shows as read-only text)
     - Edit assignee (shows as read-only text)
     - Awaiting PO buttons
     - Add new reply
     - Edit/Delete existing replies
   - **Allowed actions for resolved questions:**
     - View all replies (expand/collapse)
     - Reopen question (to restore all editing capabilities)

### QuestionsSession Component (`fe-ts/src/components/TicketDetailCard/@components/QuestionsSession/QuestionsSession.tsx`)

Component for displaying questions within a ticket detail card.

#### Features:

- Located between Description and Attachments sections
- "Questions" heading (uppercase)
- "+ Add a question" button (if user has `Permission.AddComments`)
- Lists all questions for the ticket (including resolved ones)
- Full editing capabilities (priority, assignee, resolve, delete)
- Permission-based access control

### QuestionsPage Component (`fe-ts/src/pages/QuestionsPage/QuestionsPage.tsx`)

Dedicated page for viewing all project questions.

#### Features:

- Navigation tab between "Daily standup" and "Board" tabs
- Groups questions by sprint:
  - **Current Sprint**: Questions from tickets in the current sprint
  - **Planning Sprint**: Questions from tickets in planning sprints
- Filters out resolved questions (only shows unresolved)
- Sorted by `createdAt` (oldest first)
- Shows ticket and sprint information for each question
- Read-only view (no editing capabilities)

## UI/UX Requirements

### Styling Requirements

1. **Question Title**

   - Font size: 15px
   - Font weight: 400
   - Line height: 1.6
   - When resolved: strikethrough, gray color (#737373), opacity 0.7

2. **Questions Section Heading**

   - Text transform: uppercase
   - Positioned between Description and Attachments

3. **Resolved Questions**

   - Title has strikethrough styling
   - Reply button is hidden
   - "Mark as Resolved" button is hidden
   - "Reopen Question" button is shown (blue styling)
   - All editing actions are disabled/hidden
   - Replies section remains visible for viewing

4. **Stakeholder Tracking**

   - "Awaiting PO" button (yellow/amber) when `waitingForStakeholder` is true
   - "Mark as Awaiting PO" button (gray) when `waitingForStakeholder` is false
   - Buttons hidden when question is resolved
   - "Replied" badge (green) shown next to assignee name when assignee has replied

5. **Priority and Assignee**

   - Editable dropdowns when `canEdit` is true (ticket details page)
   - Read-only text display when `canEdit` is false (questions page)

6. **Reply Actions Layout**
   - Reply content and Edit/Delete buttons in the same row (`replyContentRow`)
   - Reply content takes flex: 1 (grows to fill space)
   - Action buttons on the right side (flex-shrink: 0)
   - Buttons styled with hover effects (Edit: gray, Delete: red on hover)

### Layout Requirements

1. **Question Header**

   - Flexbox row layout
   - Question title on left
   - Meta information (priority, assignee, buttons) on right
   - All controls in a single row

2. **Replies Section**
   - Collapsed by default (shows only latest reply)
   - Expandable to show all replies
   - Each reply has: avatar, name, timestamp, content
   - Reply content uses TipTap rendering

## Functional Requirements

### Question Management

1. **Create Question**

   - User must have `Permission.AddComments`
   - Title extracted from TipTap content (first 200 characters)
   - Default priority: "Medium"
   - Created by current user

2. **Update Question**

   - User must be the question creator (`currentUserId === question.createdBy?.id`)
   - Can update: title, priority, assignee, isResolved, waitingForStakeholder
   - Title editing: inline input field with Save/Cancel buttons
   - Priority/Assignee editing: dropdowns (only when `canEdit` is true and not resolved)
   - Updates trigger refresh of question list
   - All editing disabled when question is resolved

3. **Delete Question**

   - User must be the question creator (`currentUserId === question.createdBy?.id`)
   - Confirmation dialog before deletion
   - Deletes question and all associated replies
   - Delete button hidden when question is resolved

4. **Mark as Resolved / Reopen Question**
   - Toggle `isResolved` status
   - "Mark as Resolved" button: sets `isResolved` to `true`
   - "Reopen Question" button: sets `isResolved` to `false`
   - When resolved: hides reply button, shows strikethrough on title, disables all editing
   - When reopened: restores all editing capabilities

### Reply Management

1. **Create Reply**

   - User must have `Permission.AddComments`
   - Content stored as JSON string (TipTap format)
   - Automatically refreshes question list to show "Replied" badge if assignee replied

2. **View Replies**

   - Default: shows latest reply only
   - Can expand to view all replies
   - **For resolved questions**: Replies section always visible if replies exist
   - Replies sorted by `createdAt` (oldest first)
   - Reply content and action buttons displayed in the same row
   - "View all X replies" button works for both resolved and unresolved questions

3. **Edit Reply**

   - User must be the author of the reply (`currentUserId === reply.createdBy?.id`)
   - User must have `Permission.EditTickets` (`canEdit` must be true)
   - Question must not be resolved
   - Clicking "Edit" button shows TipTap editor with current content
   - Can cancel or submit changes
   - Updates trigger refresh of replies
   - Edit button hidden when question is resolved

4. **Delete Reply**
   - User must be the author of the reply (`currentUserId === reply.createdBy?.id`)
   - User must have `Permission.EditTickets` (`canEdit` must be true)
   - Question must not be resolved
   - Confirmation dialog before deletion
   - Deletion triggers refresh of replies
   - Delete button hidden when question is resolved

### Stakeholder Tracking

1. **Waiting for PO (Product Owner)**

   - Button to toggle `waitingForStakeholder` status
   - "Awaiting PO" when active (yellow/amber styling)
   - "Mark as Awaiting PO" when inactive (gray styling)
   - Buttons hidden when question is resolved

2. **Assignee Reply Detection**
   - Automatically detects if assignee has replied
   - Shows "Replied" badge (green) next to assignee name
   - Checked by comparing `reply.createdBy.id` with `question.assignee.id`

## Permission Requirements

- `Permission.AddComments`: Required to create questions and replies
- `Permission.EditTickets`: Required to edit/delete questions, update priority/assignee, mark as resolved

## API Integration

### Frontend API Files

1. **Question API** (`fe-ts/src/api/question/question.ts`)

   - Uses `alphaApiV2` for authenticated requests
   - Functions: `getQuestionsByTicket`, `getQuestionById`, `createQuestion`, `updateQuestion`, `deleteQuestion`, `getQuestionsByProject`

2. **Reply API** (`fe-ts/src/api/reply/reply.ts`)
   - Uses `alphaApiV2` for authenticated requests
   - Functions: `getRepliesByQuestion`, `createReply`, `updateReply`, `deleteReply`
   - `updateReply`: Updates reply content (requires reply ID and new content)
   - `deleteReply`: Deletes a reply (requires reply ID)

### Response Format

- All API responses return data directly (not nested in `data` property)
- Use `result?.data || []` for safe array access

## File Structure

```
fe-ts/
├── src/
│   ├── components/
│   │   └── QuestionItem/
│   │       ├── QuestionItem.tsx
│   │       └── QuestionItem.module.scss
│   ├── components/TicketDetailCard/@components/
│   │   └── QuestionsSession/
│   │       ├── QuestionsSession.tsx
│   │       └── QuestionsSession.module.scss
│   ├── pages/
│   │   └── QuestionsPage/
│   │       ├── QuestionsPage.tsx
│   │       └── QuestionsPage.module.scss
│   └── api/
│       ├── question/
│       │   ├── question.ts
│       │   └── entity/question.ts
│       └── reply/
│           ├── reply.ts
│           └── entity/reply.ts

be-ts/
├── src/app/
│   ├── model/
│   │   ├── question.ts
│   │   └── reply.ts
│   ├── services/
│   │   ├── questionService.ts
│   │   └── replyService.ts
│   ├── controllers/v1/
│   │   ├── questionController.ts
│   │   └── replyController.ts
│   ├── validations/
│   │   ├── questionValidation.ts
│   │   └── replyValidation.ts
│   └── routes/v2/
│       └── api.ts
```

## Key Implementation Details

1. **QuestionItem Component Reusability**

   - Single component used in both ticket details and questions page
   - Conditional rendering based on `showTicketInfo` and `canEdit` props
   - Maintains consistent UI/UX across both contexts

2. **State Management**

   - Questions and replies fetched separately
   - Replies stored in object keyed by question ID: `{ [questionId: string]: IReply[] }`
   - Expanded questions tracked in Set: `Set<string>`

3. **Content Rendering**

   - TipTap content stored as JSON string
   - Rendered using `generateHTML` with StarterKit, ImageResize, and Mention extensions
   - HTML cleaned up (replaces `<p>` with `<span>` for inline display)

4. **Filtering and Sorting**

   - QuestionsPage filters out resolved questions
   - Questions sorted by `createdAt` (oldest first)
   - Grouped by sprint (Current Sprint vs Planning Sprint)

5. **Permission Checks**
   - All editing actions check `Permission.EditTickets`
   - All creation actions check `Permission.AddComments`
   - Permission checks done via `checkAccess` utility

## Implementation Updates

### Edit/Delete Question Functionality

- Added `onUpdateQuestion` and `onDeleteQuestion` props to QuestionItem
- Inline editing of question title with Save/Cancel buttons
- Edit/Delete buttons appear next to question title (only for question creator)
- Delete button shows confirmation dialog
- Only question creator can edit/delete their own questions
- Edit/Delete buttons hidden when question is resolved

### Edit/Delete Reply Functionality

- Added `onUpdateReply` and `onDeleteReply` props to QuestionItem
- Reply content and action buttons displayed in the same row
- Edit button shows TipTap editor with current content
- Delete button shows confirmation dialog
- Only reply author can edit/delete their own replies
- Requires `canEdit` permission and `currentUserId` match
- Edit/Delete buttons hidden when question is resolved

### Resolved Question Restrictions

- When a question is resolved, all editing actions are disabled:
  - Edit/Delete question buttons hidden
  - Priority/Assignee dropdowns disabled (show as read-only text)
  - Awaiting PO buttons hidden
  - Add reply button hidden
  - Edit/Delete reply buttons hidden
- Replies section remains visible for viewing all replies
- "Reopen Question" button allows restoring editing capabilities

### Reopen Question Functionality

- "Reopen Question" button appears when question is resolved
- Blue button styling to distinguish from "Mark as Resolved"
- Clicking reopens the question (sets `isResolved` to `false`)
- Restores all editing capabilities after reopening

### Awaiting PO (Product Owner)

- Changed from "Awaiting Response" to "Awaiting PO"
- Changed from "Mark as Awaiting" to "Mark as Awaiting PO"
- Buttons hidden when question is resolved

### View Replies for Resolved Questions

- Replies section always visible for resolved questions if replies exist
- "View all X replies" button works for resolved questions
- All replies can be viewed when expanded, even for resolved questions
- Only viewing is allowed; editing/deleting replies is disabled for resolved questions

### Backend Fixes

- Updated `questionService.ts` to include `_id` in populate select for `createdBy` and `assignee`
- This ensures `question.createdBy?.id` is available for ownership checks
- Applied to all question service methods: `getQuestionsByTicket`, `getQuestionById`, `createQuestion`, `updateQuestion`, `getQuestionsByProject`

## Future Enhancements (Not Implemented)

- Question notifications
- Question mentions
- Question search/filter
- Question templates
