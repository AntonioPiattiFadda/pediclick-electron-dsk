# Delivery Orders Context Separation Design

**Date:** 2026-02-07
**Status:** Approved
**Author:** Design collaboration with user

## Overview

Create a separate `DeliveryOrderContext` to isolate delivery orders functionality from in-site orders. Implement database-first architecture where all order state (items, client, status) writes immediately to Supabase, while maintaining the exact same UI/UX as in-site orders.

## Problem Statement

Currently, delivery orders and in-site orders share the same `OrderContext`, which creates coupling and prevents independent evolution of each workflow. We need to:

- Separate delivery order state management from in-site orders
- Implement database-first approach for delivery orders (multi-terminal sync)
- Keep in-site orders unchanged (local state + batch save on checkout)
- Maintain identical UI/UX between both order types
- Prepare service layer for future Supabase RPC conversion

## Architecture Principles

### Complete Separation

**OrderContext (In-Site Orders):**
- Local state for orders, orderItems, product selection
- Batch save on checkout
- No changes to existing behavior

**DeliveryOrderContext (Delivery Orders):**
- Local state ONLY for temporary product selection
- orderItems stored in database immediately
- Every change writes to DB via service functions

### Database-First for Delivery

**Why?**
- Multiple terminals must see same data in real-time
- Users switch between computers seamlessly
- Single source of truth prevents conflicts
- Already implemented real-time subscriptions in DeliveryOrders.tsx

**Data Flow:**
```
User Action → Mutation → Service Function → Supabase DB → Real-Time Event → React Query Refetch → UI Update
```

### UI Consistency

- Delivery orders UI looks IDENTICAL to in-site orders
- Same layout, same components, same interactions
- Only internal data flow differs
- Users can't tell the difference visually

## Component Structure

```
src/context/
├── OrderContext.tsx                 (existing - no changes)
└── DeliveryOrderContext.tsx         (new)

src/pages/inSiteOrders/
├── InSiteOrders.tsx                 (existing - no changes)
├── Order.tsx                        (existing - no changes)
└── components/                      (existing - no changes)

src/pages/deliveryOrders/
├── DeliveryOrders.tsx               (existing - minor update)
├── DeliveryOrder.tsx                (new - mirrors Order.tsx layout)
└── components/
    ├── DeliveryOrderSelector.tsx    (existing - no changes)
    ├── DeliveryCart.tsx             (new - mirrors cart.tsx)
    ├── DeliveryProductSelector.tsx  (new - mirrors sellingPointProductSelector.tsx)
    ├── DeliveryFraction.tsx         (new - writes to DB immediately)
    └── DeliveryCheckout.tsx         (new - updates order status in DB)

src/service/
├── deliveryOrders.tsx               (new)
└── deliveryOrderItems.tsx           (new)
```

## DeliveryOrderContext

### State (Frontend - Temporary)

```typescript
// Product selection state (temporary until added to cart)
selectedProduct: Product
productPresentation: Partial<ProductPresentation>
productPresentations: ProductPresentation[]
selectedPriceId: number | null
effectivePrice: number
sellPriceType: PriceType
selectedLotId: number | null
selectedStockId: number | null

// UI state
isCheckOutOpen: boolean

// Active order (from URL query param)
activeDeliveryOrderId: number | null
```

### Mutations Provided

```typescript
// Add item to database
addItemToOrder: (itemData: OrderItemInput) => Promise<void>

// Update order fields
updateOrderClient: (clientId: number | null) => Promise<void>
updateOrderStatus: (status: OrderStatus) => Promise<void>
updateOrderNotes: (notes: string) => Promise<void>

// Remove item from database
removeItemFromOrder: (orderItemId: number) => Promise<void>

// Complete order (checkout)
completeOrder: (payments: Payment[]) => Promise<void>

// Reset temporary product selection state
resetProductSelection: () => void
```

### No Local orderItems

**In-Site Orders:**
```typescript
const { orderItems } = useOrderContext() // Local array
```

**Delivery Orders:**
```typescript
const { data: orderItems } = useQuery(['delivery-order-items', orderId]) // From DB
```

## Service Layer Functions

All database operations isolated in service layer. These will later be converted to Supabase RPC calls.

### src/service/deliveryOrders.tsx

```typescript
/**
 * Update order client
 * Later: Convert to RPC call
 */
export async function updateDeliveryOrderClient(
  orderId: number,
  clientId: number | null
): Promise<OrderT> {
  const { data, error } = await supabase
    .from('orders')
    .update({ client_id: clientId })
    .eq('order_id', orderId)
    .select('*, client:clients(*)')
    .single()

  if (error) throw error
  return data as OrderT
}

/**
 * Update order status
 * Later: Convert to RPC call
 */
export async function updateDeliveryOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<OrderT> {
  const { data, error } = await supabase
    .from('orders')
    .update({ order_status: status })
    .eq('order_id', orderId)
    .select('*, client:clients(*)')
    .single()

  if (error) throw error
  return data as OrderT
}

/**
 * Update order notes
 * Later: Convert to RPC call
 */
export async function updateDeliveryOrderNotes(
  orderId: number,
  notes: string
): Promise<OrderT> {
  const { data, error } = await supabase
    .from('orders')
    .update({ notes })
    .eq('order_id', orderId)
    .select('*, client:clients(*)')
    .single()

  if (error) throw error
  return data as OrderT
}

/**
 * Complete delivery order (checkout)
 * Later: Convert to RPC call that handles payments atomically
 */
export async function completeDeliveryOrder(
  orderId: number,
  payments: Payment[]
): Promise<OrderT> {
  // For now: Simple status update
  // Later: RPC will handle payments, status, notifications
  const { data, error } = await supabase
    .from('orders')
    .update({
      order_status: 'COMPLETED',
      payment_status: 'PAID'
    })
    .eq('order_id', orderId)
    .select('*, client:clients(*)')
    .single()

  if (error) throw error

  // TODO: Handle payments insert (will move to RPC)
  // await insertPayments(orderId, payments)

  return data as OrderT
}
```

### src/service/deliveryOrderItems.tsx

```typescript
/**
 * Add item to delivery order
 * Later: Convert to RPC call with inventory validation
 */
export async function addDeliveryOrderItem(
  orderId: number,
  itemData: {
    product_id: number
    product_name: string
    product_presentation_id: number
    product_presentation_name: string
    quantity: number
    over_sell_quantity: number
    price: number
    subtotal: number
    total: number
    stock_id: number
    lot_id: number
    measurement_unit: string
  }
): Promise<OrderItem> {
  const { data, error } = await supabase
    .from('order_items')
    .insert({
      order_id: orderId,
      ...itemData,
      status: 'ACTIVE'
    })
    .select()
    .single()

  if (error) throw error
  return data as OrderItem
}

/**
 * Update order item
 * Later: Convert to RPC call
 */
export async function updateDeliveryOrderItem(
  orderItemId: number,
  updates: Partial<OrderItem>
): Promise<OrderItem> {
  const { data, error } = await supabase
    .from('order_items')
    .update(updates)
    .eq('order_item_id', orderItemId)
    .select()
    .single()

  if (error) throw error
  return data as OrderItem
}

/**
 * Remove item from delivery order
 * Later: Convert to RPC call (soft delete or status update)
 */
export async function removeDeliveryOrderItem(
  orderItemId: number
): Promise<void> {
  const { error } = await supabase
    .from('order_items')
    .update({ status: 'CANCELLED' })
    .eq('order_item_id', orderItemId)

  if (error) throw error
}
```

## React Query Integration

### Queries (in DeliveryOrder.tsx)

```typescript
// Fetch order items from database
const {
  data: orderItems = [],
  isLoading: isLoadingItems
} = useQuery({
  queryKey: ['delivery-order-items', orderId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .neq('status', 'CANCELLED')

    if (error) throw error
    return data as OrderItem[]
  },
  enabled: !!orderId,
  refetchOnWindowFocus: false
})
```

### Mutations (in DeliveryOrderContext)

```typescript
// Add item mutation
const addItemMutation = useMutation({
  mutationFn: (itemData: OrderItemInput) =>
    addDeliveryOrderItem(activeDeliveryOrderId, itemData),
  onSuccess: () => {
    queryClient.invalidateQueries(['delivery-order-items', activeDeliveryOrderId])
    queryClient.invalidateQueries(['delivery-order', activeDeliveryOrderId])
    resetProductSelection()
    toast.success('Producto agregado')
  },
  onError: (error) => {
    console.error('Error adding item:', error)
    toast.error('Error al agregar producto')
  }
})

// Update client mutation
const updateClientMutation = useMutation({
  mutationFn: (clientId: number | null) =>
    updateDeliveryOrderClient(activeDeliveryOrderId, clientId),
  onSuccess: () => {
    queryClient.invalidateQueries(['delivery-order', activeDeliveryOrderId])
    toast.success('Cliente actualizado')
  },
  onError: (error) => {
    console.error('Error updating client:', error)
    toast.error('Error al actualizar cliente')
  }
})

// Remove item mutation
const removeItemMutation = useMutation({
  mutationFn: (orderItemId: number) =>
    removeDeliveryOrderItem(orderItemId),
  onSuccess: () => {
    queryClient.invalidateQueries(['delivery-order-items', activeDeliveryOrderId])
    queryClient.invalidateQueries(['delivery-order', activeDeliveryOrderId])
    toast.success('Producto eliminado')
  },
  onError: (error) => {
    console.error('Error removing item:', error)
    toast.error('Error al eliminar producto')
  }
})

// Checkout mutation
const checkoutMutation = useMutation({
  mutationFn: (payments: Payment[]) =>
    completeDeliveryOrder(activeDeliveryOrderId, payments),
  onSuccess: () => {
    queryClient.invalidateQueries(['delivery-orders'])
    queryClient.invalidateQueries(['delivery-order', activeDeliveryOrderId])
    toast.success('Orden completada')
  },
  onError: (error) => {
    console.error('Error completing order:', error)
    toast.error('Error al completar orden')
  }
})
```

### Real-Time Sync

Real-time subscriptions already implemented in `DeliveryOrders.tsx`:

```typescript
// Order items subscription
useEffect(() => {
  if (!selectedOrderId) return

  const channel = supabase
    .channel(`order-items-${selectedOrderId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'order_items',
      filter: `order_id=eq.${selectedOrderId}`
    }, () => {
      queryClient.invalidateQueries(['delivery-order-items', selectedOrderId])
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [selectedOrderId, queryClient])
```

When any terminal adds/updates/removes an item, all terminals automatically refetch via query invalidation.

## Component Implementation

### DeliveryOrder.tsx

Mirrors `Order.tsx` layout exactly:

```typescript
const DeliveryOrder = ({ order, onChangeOrder }: {
  order: OrderT,
  onChangeOrder: (order: OrderT) => void
}) => {
  return (
    <div className="grid grid-cols-[1fr_1fr] space-x-4 p-4 h-[calc(100vh-7rem)] -mt-2">
      <div className="flex flex-col space-y-6 h-full relative">
        <div className="rounded-lg border bg-card p-4 shadow-sm h-full flex flex-col space-y-4">
          {/* Client Selector */}
          <div className="flex flex-col gap-1">
            <Label>Cliente:</Label>
            <ClientSelectorRoot
              value={order.client || null}
              onChange={v => {
                // Updates DB immediately via context mutation
                updateOrderClient(v ? Number(v.client_id) : null)
              }}
              showInfo={true}
            >
              <SelectClient />
              <CancelClientSelection />
              <CreateClient />
            </ClientSelectorRoot>
          </div>

          {/* Product Selector */}
          <DeliveryProductSelector />
        </div>

        <ScaleDataDisplay order={order} />
      </div>

      {/* Cart - reads from React Query */}
      <DeliveryCart order={order} onChangeOrder={onChangeOrder} />
    </div>
  )
}
```

**Same Layout:**
- ✅ 2-column grid
- ✅ Client selector on left
- ✅ Product selector on left
- ✅ Scale display below
- ✅ Cart on right

**Different Data Flow:**
- ❌ No local orderItems array
- ✅ Client change writes to DB
- ✅ Cart reads from React Query

### DeliveryCart.tsx

Mirrors `cart.tsx` appearance:

```typescript
const DeliveryCart = ({ order, onChangeOrder }: {
  order: OrderT,
  onChangeOrder: (order: OrderT) => void
}) => {
  const { removeItemFromOrder, completeOrder } = useDeliveryOrderContext()

  // Fetch items from database
  const { data: orderItems = [] } = useQuery({
    queryKey: ['delivery-order-items', order.order_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.order_id)
        .neq('status', 'CANCELLED')
      return data as OrderItem[]
    },
    enabled: !!order.order_id
  })

  const orderTotal = orderItems.reduce((sum, it) =>
    sum + Number(it.total || it.subtotal || 0), 0)

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm h-full flex flex-col">
      <h3 className="mb-2 text-base font-semibold">Pedido</h3>

      {orderItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <ul className="space-y-1 overflow-auto max-h-[calc(100vh-330px)]">
          {orderItems.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between text-sm h-9">
              <span>{it.product_name} {it.product_presentation_name} x {it.quantity}</span>
              <span className="ml-auto mr-1">${Number(it.total).toFixed(2)}</span>
              <DeleteCartItemButton
                itemData={it}
                onDelete={() => removeItemFromOrder(it.order_item_id)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex justify-between border-t pt-2 text-sm">
        <span>Total</span>
        <span className="font-semibold">${orderTotal.toFixed(2)}</span>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <DeleteOrderBtn orderId={order.order_id} />
        <DeliveryCheckout
          onConfirm={completeOrder}
          order={order}
          hasClient={!!order.client_id}
        />
      </div>
    </div>
  )
}
```

**Same UI:**
- ✅ Same item list display
- ✅ Same total calculation
- ✅ Same delete buttons
- ✅ Same checkout button

**Different Data:**
- ❌ Not from context array
- ✅ From React Query
- ✅ Delete calls mutation immediately

### DeliveryProductSelector.tsx

Mirrors `sellingPointProductSelector.tsx`:

```typescript
const DeliveryProductSelector = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    productPresentations,
    productPresentation,
    setProductPresentation,
    setSelectedStockId,
    setSelectedPriceId,
    setEffectivePrice,
    selectedStockId,
    selectedLotId,
    setSelectedLotId,
    sellPriceType
  } = useDeliveryOrderContext()

  // ... exact same logic as in-site version

  return (
    <div className='flex flex-col gap-2'>
      <div className='grid grid-cols-16 gap-2'>
        <div className='flex flex-col col-span-7 gap-1'>
          <Label>Producto:</Label>
          <ProductSelector
            value={selectedProduct}
            onChange={(value) => setSelectedProduct({ ...selectedProduct, ...value })}
          />
        </div>
        <div className='flex flex-col gap-1 col-span-8'>
          <Label>Presentación:</Label>
          <ProductPresentationSelectorRoot
            locationId={handleGetLocationId()}
            productId={selectedProduct.product_id!}
            value={productPresentation}
            onChange={(value) => {
              // Same logic as in-site
              setProductPresentation(value)
              setSelectedLotId(firstLotId)
              setSelectedStockId(firstStockId)
              setSelectedPriceId(firstPrice?.price_id || null)
              setEffectivePrice(firstPrice?.price || 0)
            }}
          >
            <SelectProductPresentation />
          </ProductPresentationSelectorRoot>
        </div>
        <div className='mt-auto mb-[2px]'>
          <DeliveryFraction />
        </div>
      </div>
    </div>
  )
}
```

**Same UI & Logic:**
- ✅ Same product/presentation selectors
- ✅ Same price/lot/stock selection
- ✅ Same layout

**Different Context:**
- ❌ useOrderContext()
- ✅ useDeliveryOrderContext()

### DeliveryFraction.tsx

Similar to in-site Fraction, but calls mutation:

```typescript
const DeliveryFraction = () => {
  const { addItemToOrder, selectedProduct, effectivePrice, /* ... */ } = useDeliveryOrderContext()
  const [quantity, setQuantity] = useState(0)

  const handleAddToCart = async () => {
    await addItemToOrder({
      product_id: selectedProduct.product_id,
      product_name: selectedProduct.product_name,
      product_presentation_id: productPresentation.product_presentation_id,
      product_presentation_name: productPresentation.name,
      quantity,
      over_sell_quantity: 0,
      price: effectivePrice,
      subtotal: effectivePrice * quantity,
      total: effectivePrice * quantity,
      stock_id: selectedStockId,
      lot_id: selectedLotId,
      measurement_unit: productPresentation.measurement_unit
    })

    setQuantity(0) // Reset
  }

  return (
    // Same UI as in-site Fraction component
    <Button onClick={handleAddToCart}>Agregar</Button>
  )
}
```

**Same UI:**
- ✅ Same input fields
- ✅ Same button

**Different Action:**
- ❌ Doesn't add to local array
- ✅ Calls mutation → writes to DB

## Migration Strategy

### Phase 1: Service Layer (30 min)

1. Create `src/service/deliveryOrders.tsx`
2. Create `src/service/deliveryOrderItems.tsx`
3. Export from `src/service/index.tsx`
4. No breaking changes - just new functions

### Phase 2: Context (45 min)

5. Create `src/context/DeliveryOrderContext.tsx`
6. Add state + mutations
7. Update `src/App.tsx` provider tree:
   ```typescript
   <DeliveryOrderProvider>
     <Routes>
       <Route path="/delivery-orders" element={<DeliveryOrders />} />
     </Routes>
   </DeliveryOrderProvider>
   ```

### Phase 3: Components (1.5 hours)

8. Create `DeliveryOrder.tsx` (copy Order.tsx layout)
9. Create `DeliveryCart.tsx` (copy cart.tsx UI)
10. Create `DeliveryProductSelector.tsx` (copy sellingPointProductSelector.tsx)
11. Create `DeliveryFraction.tsx` (copy Fraction.tsx)
12. Create `DeliveryCheckout.tsx` (copy checkoutOrder.tsx)

### Phase 4: Integration (30 min)

13. Update `DeliveryOrders.tsx`:
    ```typescript
    // Before
    <Order order={selectedOrder} onChangeOrder={handleChangeOrder} />

    // After
    <DeliveryOrder order={selectedOrder} onChangeOrder={handleChangeOrder} />
    ```
14. Test add item → verify DB write
15. Test multi-terminal sync
16. Test checkout flow

### Phase 5: Testing (30 min)

17. Test full workflow on single terminal
18. Test multi-terminal synchronization
19. Test network resilience
20. Test edge cases (empty cart, no client, etc.)

**Total Estimated Time:** 3-4 hours

## No Changes to In-Site Orders

**Guaranteed No Modifications:**
- ❌ `src/context/OrderContext.tsx`
- ❌ `src/pages/inSiteOrders/InSiteOrders.tsx`
- ❌ `src/pages/inSiteOrders/Order.tsx`
- ❌ `src/pages/inSiteOrders/components/cart.tsx`
- ❌ `src/pages/inSiteOrders/components/sellingPointProductSelector.tsx`
- ❌ Any other in-site order components

In-site orders continue working exactly as before with zero impact.

## Future RPC Conversion

All service functions are designed for easy RPC conversion:

**Current (Direct DB Access):**
```typescript
export async function addDeliveryOrderItem(orderId, itemData) {
  const { data } = await supabase
    .from('order_items')
    .insert({ order_id: orderId, ...itemData })
    .select()
    .single()
  return data
}
```

**Future (RPC Call):**
```typescript
export async function addDeliveryOrderItem(orderId, itemData) {
  const { data } = await supabase
    .rpc('add_delivery_order_item', {
      p_order_id: orderId,
      p_item_data: itemData
    })
  return data
}
```

**No component changes needed** - just swap service implementation.

## Success Criteria

- ✅ Delivery orders use DeliveryOrderContext
- ✅ In-site orders use OrderContext (unchanged)
- ✅ Adding item to delivery order writes to DB immediately
- ✅ Cart displays items from database via React Query
- ✅ Multi-terminal sync works (changes visible on all terminals)
- ✅ UI looks identical between in-site and delivery orders
- ✅ No changes to in-site order code
- ✅ All database operations in service layer
- ✅ Service functions ready for RPC conversion
- ✅ Product selection flow works identically
- ✅ Checkout flow works for delivery orders
- ✅ Scale integration still works

## Edge Cases Handled

1. **Network disconnection:** Mutations show error, user retries
2. **Item deleted by another terminal:** Real-time sync removes from cart
3. **Order deleted while viewing:** Error toast, redirect to order list
4. **Empty cart checkout:** Validation prevents checkout
5. **No client selected:** Warning in checkout (optional client)
6. **Concurrent edits:** Last write wins, real-time sync shows changes

## Performance Considerations

- **Query caching:** React Query caches orderItems, prevents redundant fetches
- **Optimistic updates:** Could add for instant feedback (optional)
- **Real-time efficiency:** Subscriptions already scoped to single order
- **Service layer:** Functions are thin wrappers, minimal overhead

## Testing Checklist

- [ ] Create delivery order from dropdown
- [ ] Select product and presentation
- [ ] Add item to cart → verify appears immediately
- [ ] Open same order on second terminal → verify item appears
- [ ] Add item on terminal A → verify appears on terminal B
- [ ] Remove item from cart → verify DB update
- [ ] Change client → verify DB update
- [ ] Checkout order → verify status update
- [ ] Switch between orders → verify cart updates correctly
- [ ] Test with empty cart
- [ ] Test scale integration
- [ ] Test printer integration
- [ ] Verify in-site orders still work unchanged

## Implementation Checklist

### Service Layer
- [ ] Create `src/service/deliveryOrders.tsx`
  - [ ] `updateDeliveryOrderClient()`
  - [ ] `updateDeliveryOrderStatus()`
  - [ ] `updateDeliveryOrderNotes()`
  - [ ] `completeDeliveryOrder()`
- [ ] Create `src/service/deliveryOrderItems.tsx`
  - [ ] `addDeliveryOrderItem()`
  - [ ] `updateDeliveryOrderItem()`
  - [ ] `removeDeliveryOrderItem()`
- [ ] Export from `src/service/index.tsx`

### Context
- [ ] Create `src/context/DeliveryOrderContext.tsx`
  - [ ] Add product selection state
  - [ ] Add UI state
  - [ ] Add mutation hooks
  - [ ] Add `resetProductSelection()` helper
  - [ ] Export provider and hook
- [ ] Update `src/App.tsx` to wrap delivery route with provider

### Components
- [ ] Create `src/pages/deliveryOrders/DeliveryOrder.tsx`
  - [ ] Mirror Order.tsx layout
  - [ ] Use DeliveryOrderContext
  - [ ] Client selector with DB update
- [ ] Create `src/pages/deliveryOrders/components/DeliveryCart.tsx`
  - [ ] Fetch items from React Query
  - [ ] Same UI as cart.tsx
  - [ ] Delete calls mutation
- [ ] Create `src/pages/deliveryOrders/components/DeliveryProductSelector.tsx`
  - [ ] Use DeliveryOrderContext
  - [ ] Same logic as in-site version
- [ ] Create `src/pages/deliveryOrders/components/DeliveryFraction.tsx`
  - [ ] Same UI as Fraction
  - [ ] Calls addItem mutation
- [ ] Create `src/pages/deliveryOrders/components/DeliveryCheckout.tsx`
  - [ ] Same UI as checkoutOrder.tsx
  - [ ] Calls completeOrder mutation

### Integration
- [ ] Update `src/pages/deliveryOrders/DeliveryOrders.tsx`
  - [ ] Import DeliveryOrder component
  - [ ] Replace Order with DeliveryOrder
  - [ ] Pass order and onChangeOrder props

### Testing
- [ ] Test add item → DB write
- [ ] Test remove item → DB update
- [ ] Test update client → DB update
- [ ] Test multi-terminal sync
- [ ] Test checkout flow
- [ ] Test in-site orders unchanged
- [ ] Test edge cases

## Future Enhancements (Out of Scope)

- Optimistic updates for instant UI feedback
- Offline mutation queue with retry logic
- Undo/redo functionality
- Item editing (update quantity/price)
- Batch item operations
- Order templates/favorites
- Advanced validation rules
