# Delivery Orders Management Design

**Date:** 2026-02-06
**Status:** Approved
**Author:** Design collaboration with user

## Overview

Replace the tab-based delivery orders interface with a dropdown selector that shows all created delivery orders filtered by date range and location. Enable multi-terminal synchronization using Supabase real-time subscriptions, with quick-print functionality directly from the dropdown.

## Problem Statement

Current delivery orders workflow needs:
- Ability to view all delivery orders (not just active ones)
- Quick access to any order for loading trucks
- Print tickets on-demand for any order (even completed ones)
- Multi-terminal synchronization (changes visible across all store computers)
- No data loss when switching between orders

## Architecture

### Database-First Approach

**Key Principle:** All state lives in Supabase database. No local context for delivery orders.

**Why?**
- Multiple terminals/computers access same orders
- Changes must sync in real-time across all terminals
- Users can switch between computers without losing work
- Single source of truth prevents conflicts

### Data Flow

```
User Action → React Query Mutation → Supabase DB → Real-Time Event → All Terminals Refresh
```

1. User makes change (add item, update order)
2. Mutation writes to Supabase immediately
3. Supabase broadcasts change via real-time subscription
4. All connected terminals receive event
5. React Query cache invalidates and refetches
6. UI updates automatically

## Component Structure

```
src/pages/deliveryOrders/
├── DeliveryOrders.tsx (main page container)
├── components/
    ├── DeliveryOrderSelector.tsx (filters + dropdown + print buttons)
    ├── DeliveryOrderView.tsx (selected order display)
    └── DeliveryOrderPrintButton.tsx (print button component)
```

### DeliveryOrders.tsx (Main Page)

- No tabs interface (removed)
- Dropdown-only order selection
- URL state for active order: `?orderId=123`
- Filters persist in localStorage
- Reuses existing Order.tsx logic for order editing

### DeliveryOrderSelector.tsx

**Filters:**
- Date range: "Today" | "Last 2 days" | "Last 3 days" | "Last 5 days" | "Last 7 days"
- Location: Dropdown of available locations

**Dropdown Items Display:**
```
#1234 | Juan Pérez | 5 items | $1,250.00 | PENDING | 14:30 [🖨️]
```
Shows: Order number, client name, item count, total, payment status, time, print button

**Features:**
- Inline print button (doesn't select order)
- "New Order" button creates empty delivery order
- Empty state when no orders match filter

## Data Management

### React Query Queries

**1. useDeliveryOrders**
```typescript
useQuery(['delivery-orders', locationId, daysBack], () =>
  getDeliveryOrdersByDateRange(locationId, daysBack)
)
```
- Fetches delivery orders with computed totals and item counts
- Includes client information
- Filtered by date range and location
- Auto-refetch disabled (relies on real-time subscriptions)

**2. useDeliveryOrderItems**
```typescript
useQuery(['order-items', orderId], () =>
  getOrderItems(orderId),
  { enabled: !!orderId }
)
```
- Fetches items when order selected
- Disabled when no order selected

### React Query Mutations

**1. updateDeliveryOrder**
- Updates order fields (status, notes, etc.)
- Invalidates `['delivery-orders']` query

**2. addOrderItem**
- Adds item to order
- Invalidates `['order-items', orderId]` query

**3. deleteOrderItem**
- Removes item from order
- Invalidates `['order-items', orderId]` query

**4. createDeliveryOrder**
- Creates new empty delivery order
- Invalidates `['delivery-orders']` query
- Navigates to new order: `?orderId=${newId}`

## Real-Time Subscriptions

### Orders Table Subscription

```typescript
supabase
  .channel('delivery-orders-changes')
  .on('postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'orders',
      filter: `order_type=eq.DELIVERY,location_id=eq.${locationId}`
    },
    (payload) => {
      queryClient.invalidateQueries(['delivery-orders'])
    }
  )
  .subscribe()
```

**Lifecycle:**
- Subscribe when component mounts
- Unsubscribe on unmount
- Filter by location to reduce noise

### Order Items Subscription

```typescript
supabase
  .channel(`order-items-${activeOrderId}`)
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'order_items',
      filter: `order_id=eq.${activeOrderId}`
    },
    () => {
      queryClient.invalidateQueries(['order-items', activeOrderId])
    }
  )
  .subscribe()
```

**Lifecycle:**
- Subscribe when order selected
- Unsubscribe when switching orders
- Only one subscription active at a time

## Service Layer Functions

### getDeliveryOrdersByDateRange

```typescript
async function getDeliveryOrdersByDateRange(
  locationId: number,
  daysBack: number
): Promise<OrderWithMetadata[]>
```

**Query:**
```sql
SELECT
  o.*,
  c.client_name,
  COUNT(oi.order_item_id) as item_count,
  SUM(oi.total) as computed_total
FROM orders o
LEFT JOIN clients c ON o.client_id = c.client_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
WHERE
  o.order_type = 'DELIVERY'
  AND o.location_id = ${locationId}
  AND o.created_at >= NOW() - INTERVAL '${daysBack} days'
  AND o.deleted_at IS NULL
GROUP BY o.order_id, c.client_name
ORDER BY o.created_at DESC
```

**Returns:** Order with client name, item count, computed total

### startEmptyDeliveryOrder

```typescript
async function startEmptyDeliveryOrder(
  locationId: number,
  terminalSessionId: number
): Promise<OrderT>
```

- Similar to `startEmptyOrder` but sets `order_type: 'DELIVERY'`
- Generates order number
- Sets initial `payment_status: 'PENDING'`
- Sets initial `order_status: 'NEW'`

## Print Functionality

### Quick Print from Dropdown

**Flow:**
1. User clicks print icon in dropdown
2. Fetch order items from DB (if not cached)
3. Generate ticket content using `printerBufferFactory.tsx`
4. Send to printer via IPC: `window.printer.print(...)`
5. Show toast notification (success/error)

**Implementation:**
```typescript
const handleQuickPrint = async (order: OrderT) => {
  try {
    // Fetch items
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.order_id)

    // Generate content
    const printContent = generateTicketContent(order, items)

    // Print via IPC
    await window.printer.print({
      vendorId: printerSettings.vendorId,
      productId: printerSettings.productId,
      printFunction: 'printTicket',
      content: printContent
    })

    toast.success('Ticket impreso correctamente')
  } catch (error) {
    toast.error('Error al imprimir ticket')
  }
}
```

**Button States:**
- Enabled for all order statuses
- Shows loading spinner while printing
- Uses existing printer configuration (same as in-site orders)

## UI/UX Details

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Ordenes de Delivery                                      │
├─────────────────────────────────────────────────────────┤
│ Filtros: [Hoy ▼] [Ubicación: Sucursal Centro ▼]        │
│                                                          │
│ Ordenes: [Seleccionar orden... ▼] [+ Nueva Orden]      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  (Order content - product selector, cart, checkout)     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Filter Defaults

- Date range: "Today"
- Location: Current terminal's location
- Stored in localStorage: `delivery-order-filters`

### Empty States

**No orders match filter:**
```
No hay órdenes de delivery para los filtros seleccionados.
[Nueva Orden]
```

**No order selected:**
```
Seleccione una orden del menú superior o cree una nueva.
```

### Dropdown Behavior

- Click on order text → Loads order (updates URL)
- Click on print icon → Prints without loading order
- Event propagation stopped on print button

## Error Handling

### Multi-Terminal Conflicts

**Scenario:** Two users edit same order simultaneously

**Solution:**
- Real-time subscriptions show changes instantly
- Last write wins (standard DB behavior)
- Show toast when order updates: "Orden actualizada por otro usuario"

### Order Selection Errors

| Error | Handling |
|-------|----------|
| Order selected but deleted | Show error toast, clear selection, refresh list |
| No orders match filter | Show empty state |
| Network disconnection | Show offline indicator, queue mutations |

### Print Failures

| Error | Handling |
|-------|----------|
| Printer not connected | Toast: "Impresora no disponible" |
| Print timeout | Retry 3 times, then show error |
| Order has no items | Prevent print, show warning |

### Real-Time Subscription Failures

- Fallback to polling every 30s if WebSocket connection fails
- Auto-reconnect on network restore
- Log connection status in dev mode

### Mutation Errors

- Optimistic updates for instant feedback
- Rollback on error with toast notification
- Show loading states on all action buttons
- Retry logic for transient network errors

## State Management

### URL State (Active Order)

```
/delivery-orders?orderId=123
```

**Benefits:**
- Shareable links
- Browser back/forward works
- Refresh-safe (order reloads from DB)
- No stale context state

### Local Storage (Filters)

```json
{
  "dateRangeFilter": "today",
  "selectedLocationId": 5
}
```

**Persistence:** Survives page reloads, terminal restarts

### React Query Cache

- Orders list cached: `['delivery-orders', locationId, daysBack]`
- Order items cached: `['order-items', orderId]`
- Cache invalidated by real-time subscriptions
- Automatic garbage collection on unmount

## Migration from Current System

### Changes Required

1. **Remove tab interface** from `/delivery-orders` page
2. **Add dropdown selector** with filters
3. **Add print buttons** to dropdown items
4. **Set up real-time subscriptions** on component mount
5. **Update URL routing** to use query params
6. **Create new service functions** for filtered queries
7. **Remove `activeDeliveryOrder` from OrderContext** (no longer needed)

### Backward Compatibility

- Existing order structure unchanged
- Print system reused (no changes)
- Order creation flow similar (just changes order_type)
- Checkout flow unchanged

## Performance Considerations

### Query Optimization

- Fetch orders with JOINs (reduce round-trips)
- Compute totals in SQL (not in JS)
- Index on `(order_type, location_id, created_at)` for fast filtering

### Real-Time Efficiency

- Filter subscriptions by location (reduce events)
- Single subscription per table (not per order)
- Invalidate cache (don't fetch in subscription handler)

### Rendering Optimization

- Memoize dropdown items
- Virtualize list if >100 orders
- Debounce filter changes

## Testing Considerations

### Manual Test Scenarios

1. **Multi-terminal sync:**
   - Open on two computers
   - Create order on Terminal A
   - Verify appears on Terminal B

2. **Order editing:**
   - Add items on Terminal A
   - Verify updates on Terminal B in real-time

3. **Print functionality:**
   - Print from dropdown without loading order
   - Verify ticket prints correctly

4. **Filter functionality:**
   - Change date range → verify orders update
   - Change location → verify correct orders show

5. **Network resilience:**
   - Disconnect network
   - Make changes (queued)
   - Reconnect → changes sync

### Edge Cases to Test

- Order deleted while viewing
- Printer offline
- WebSocket connection fails
- Multiple rapid updates
- Empty order list
- Very large order list (>100 orders)

## Future Enhancements (Out of Scope)

- Order status workflow (NEW → PROCESSING → DELIVERING → DELIVERED)
- Delivery route optimization
- Driver assignment
- Customer notifications
- Order search/filter by client name
- Export orders to CSV
- Order history view (beyond 7 days)

## Implementation Checklist

- [ ] Create `DeliveryOrderSelector` component
- [ ] Create `DeliveryOrderPrintButton` component
- [ ] Update `DeliveryOrders.tsx` to remove tabs
- [ ] Add `getDeliveryOrdersByDateRange` service function
- [ ] Add `startEmptyDeliveryOrder` service function
- [ ] Implement real-time subscriptions
- [ ] Add URL state management with query params
- [ ] Add localStorage for filter persistence
- [ ] Implement quick print functionality
- [ ] Add error handling and toast notifications
- [ ] Test multi-terminal synchronization
- [ ] Update printer integration
- [ ] Add empty states and loading states
- [ ] Test on actual hardware (printer, multiple terminals)

## Success Criteria

- ✅ Users can see all delivery orders from selected date range
- ✅ Users can switch between orders without data loss
- ✅ Changes sync across all terminals in real-time (<2 second delay)
- ✅ Users can print tickets from dropdown without loading order
- ✅ Users can print any order regardless of status
- ✅ System handles network disconnections gracefully
- ✅ Filter settings persist across page reloads
- ✅ No tabs interface (dropdown only)
