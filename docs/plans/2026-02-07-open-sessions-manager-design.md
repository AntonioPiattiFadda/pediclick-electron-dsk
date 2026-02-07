# Open Terminal Sessions Manager - Design Document

**Date:** 2026-02-07
**Purpose:** Development tool to view and close all open terminal sessions across the organization
**Access:** Available to all users via header menu

## Overview

A dialog component that allows users to view all currently open terminal sessions in the organization and close them individually or all at once. This is a development tool for quick cleanup of abandoned or test sessions.

## Architecture & Data Flow

### Component Location
- Triggered from header menu (`header.tsx`)
- Globally accessible throughout the application
- New component: `OpenSessionsManager.tsx`

### User Flow
1. User clicks "Sessions" button in header
2. Dialog opens and fetches all open sessions by `organizationId`
3. List displays: terminal name, user name, opened time
4. User clicks "Close" on individual session → confirmation → close → refetch
5. User clicks "Close All" → confirmation → close all → refetch

### Data Flow
```
Header Button → Dialog Opens → Fetch Open Sessions (by org ID)
                              ↓
                    Display Sessions List
                              ↓
            User Action (Close / Close All)
                              ↓
                    Confirmation Dialog
                              ↓
                Update DB (status = CLOSED)
                              ↓
                    Refetch & Update List
```

## Service Layer

### New Functions in `src/service/terminalSessions.tsx`

#### 1. `getOpenTerminalSessions(organizationId: string)`
**Purpose:** Fetch all open terminal sessions for the organization

**Query:**
```typescript
supabase
  .from('terminal_sessions')
  .select(`
    terminal_session_id,
    opened_at,
    terminals(terminal_name),
    profiles(name)
  `)
  .eq('status', 'OPEN')
  .eq('organization_id', organizationId)
```

**Returns:** Array of sessions with:
- `terminal_session_id: number`
- `terminal_name: string`
- `user_name: string`
- `opened_at: string`

#### 2. `closeTerminalSessionDev(terminalSessionId: number)`
**Purpose:** Simple closure for dev purposes (no balance calculations)

**Operation:**
```typescript
supabase
  .from('terminal_sessions')
  .update({
    status: 'CLOSED',
    closed_at: new Date().toISOString()
  })
  .eq('terminal_session_id', terminalSessionId)
```

**Note:** Separate from production closure logic - this is a dev-only shortcut.

## UI Structure

### Dialog Layout
```
┌─────────────────────────────────────┐
│ Open Terminal Sessions          [X] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Terminal 1                      │ │
│ │ User: John Doe                  │ │
│ │ Opened: 2026-02-07 09:30 AM     │ │
│ │                    [Close] ─────┤ │
│ ├─────────────────────────────────┤ │
│ │ Terminal 2                      │ │
│ │ User: Jane Smith                │ │
│ │ Opened: 2026-02-07 10:15 AM     │ │
│ │                    [Close] ─────┤ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│              [Close All] [Cancel]   │
└─────────────────────────────────────┘
```

### UI States

**Loading:**
- Show spinner while fetching sessions
- Center in dialog

**Empty State:**
- Message: "No open sessions"
- Center in dialog

**Error State:**
- Display error message
- Show retry button

**List State:**
- Scrollable list if many sessions
- Each session in a card/row
- Individual close button per session
- Footer with "Close All" and "Cancel" buttons

### Confirmation Dialogs

**Individual Close:**
- Title: "Close Terminal Session?"
- Message: "Close session for [Terminal Name]?"
- Actions: "Cancel" / "Close"

**Close All:**
- Title: "Close All Sessions?"
- Message: "Close all [N] open sessions?"
- Actions: "Cancel" / "Close All"

## Component Implementation

### File Structure
```
src/components/openSessionsManager/
  └── OpenSessionsManager.tsx
```

### Key Implementation Details

**State Management:**
- React Query `useQuery` for fetching sessions
  - Query key: `['openTerminalSessions', organizationId]`
  - Enabled only when dialog is open
- React Query `useMutation` for close actions
  - Individual close mutation
  - Close all mutation (loops through all IDs)
  - `onSuccess`: Invalidate and refetch query

**Confirmation Pattern:**
- Use shadcn/ui `AlertDialog` component
- Local state to track which session is being closed
- Separate confirmation for individual vs "Close All"

**Data Fetching:**
- Get `organizationId` from `getOrganizationId()` service
- Format `opened_at` timestamp for display (locale time)
- Handle loading, error, and empty states

**Close Actions:**
- Individual: `closeTerminalSessionDev(session_id)` → show success toast → refetch
- Close All: Map over all session IDs → close each → show success toast → refetch
- Show loading states during mutations (disable buttons)

**Error Handling:**
- Catch mutation errors
- Display error toast notifications
- Keep dialog open to allow retry

## Header Integration

**Changes to `src/components/header/header.tsx`:**
- Add "Sessions" button to header toolbar
- Position: Right side with other utility buttons
- Icon or text label (e.g., monitor/terminal icon)
- Control dialog open/close state
- No permission checks (available to all for dev purposes)

## Type Definitions

**New Type in `src/types/terminalSession.tsx`:**
```typescript
export interface OpenSessionDisplay {
  terminal_session_id: number;
  terminal_name: string;
  user_name: string;
  opened_at: string;
}
```

## Styling

**Components:**
- `Dialog` - Main container
- `ScrollArea` - For session list (if many)
- `Button` - Close actions
- `AlertDialog` - Confirmations
- `Spinner` - Loading state

**Layout:**
- Max height with scroll for many sessions
- Subtle borders between session rows
- Responsive sizing
- Use existing TailwindCSS patterns

## Database Considerations

**Query Performance:**
- Index on `status` and `organization_id` (likely already exists)
- Joins to `terminals` and `profiles` tables
- Limit to reasonable number (e.g., 100 sessions max)

**Concurrency:**
- No special handling needed (dev tool only)
- Refetch after mutations keeps data fresh

## Testing Approach

**Manual Testing:**
1. Open multiple terminal sessions from different terminals
2. Verify all appear in the dialog
3. Test individual close with confirmation
4. Test "Close All" with confirmation
5. Verify list updates after closing
6. Test empty state (no open sessions)
7. Test error handling (disconnect from internet, etc.)

**Edge Cases:**
- No open sessions
- Single open session
- Many open sessions (20+)
- Session closed by another user while dialog is open

## Future Considerations

**Not Included in This Design (YAGNI):**
- Permissions/role restrictions
- Session details view
- Closing balance calculations
- Audit logging
- Real-time updates (WebSocket)
- Export/reporting features
- Filtering or search

**Possible Enhancements (If Needed Later):**
- Auto-refresh every N seconds
- Show session duration
- Filter by terminal or user
- Sort options
- Pagination for many sessions

## Summary

This is a minimal, development-focused tool to manage open terminal sessions. It prioritizes simplicity and speed over robustness, with clear confirmations to prevent accidental closures. The design keeps dev utilities separate from production business logic.
