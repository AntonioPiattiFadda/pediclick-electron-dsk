# Terminal Session Closure UI Design

**Date:** 2026-02-08
**Component:** `TerminalSessionClosure.tsx`
**Purpose:** Display terminal session financial summary and enable cash reconciliation before closing a session

---

## Overview

The terminal session closure component shows a comprehensive financial summary including:
- Cash reconciliation (opening balance, sales, client payments, provider payments)
- Other payment methods totals
- Sales summary (total, ticket count, average)
- User input for actual cash count with visual feedback
- Action buttons for printing and closing the session

---

## Data Structure

### Input Data (from `getTerminalSessionClosureData`)

```typescript
{
  terminalSession: TerminalSession,  // Session info with opening_balance
  user: User,                         // Cashier who opened session
  orders: OrderWithPayments[],        // Orders with nested payments
  payments: Payment[]                 // Standalone payments (client/provider payments)
}
```

### Component State

```typescript
const [closingBalance, setClosingBalance] = useState<number | null>(null);
const [observations, setObservations] = useState<string>("");  // Optional for future
```

---

## Section 1: Data Processing & Calculations

### Cash Flow Calculation

**Cash from Sales (Orders):**
```typescript
const cashFromSales = orders
  .flatMap(order => order.payments)
  .filter(p => p.payment_method === "CASH" && p.payment_direction === "IN")
  .reduce((sum, p) => sum + p.amount, 0);
```

**Cash from Client Payments:**
```typescript
const cashFromClientPayments = payments
  .filter(p =>
    p.payment_method === "CASH" &&
    p.payment_direction === "IN" &&
    p.payment_type === "CLIENT_PAYMENT"
  )
  .reduce((sum, p) => sum + p.amount, 0);
```

**Cash to Providers:**
```typescript
const cashToProviders = payments
  .filter(p =>
    p.payment_method === "CASH" &&
    p.payment_direction === "OUT" &&
    p.payment_type === "PROVIDER_PAYMENT"
  )
  .reduce((sum, p) => sum + p.amount, 0);
```

**Expected Cash:**
```typescript
const expectedCash = opening_balance + cashFromSales + cashFromClientPayments - cashToProviders;
```

**Difference:**
```typescript
const difference = closingBalance !== null ? closingBalance - expectedCash : null;
```

### Other Payment Methods Aggregation

```typescript
const allInPayments = [
  ...orders.flatMap(o => o.payments),
  ...payments
].filter(p => p.payment_direction === "IN");

const paymentMethodTotals = allInPayments.reduce((acc, payment) => {
  if (payment.payment_method !== "CASH") {
    acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount;
  }
  return acc;
}, {} as Record<PaymentMethod, number>);
```

### Summary Calculations

```typescript
const totalSales = allInPayments.reduce((sum, p) => sum + p.amount, 0);
const ticketCount = orders.length;
const averageTicket = ticketCount > 0 ? totalSales / ticketCount : 0;
```

---

## Section 2: UI Layout

### Dialog Structure

- **Size:** `sm:max-w-3xl` (wider for financial data)
- **Sections:** Header, Cash, Other Payments, Summary, Footer

### Header Section

- Terminal name and number
- Cashier name (from `user` data)
- Opened at: Format `opened_at` timestamp
- Closing at: Current timestamp

### Cash Section

```
💰 EFECTIVO                                    [Ver Detalles →]
├─ Monto Inicial:           $10,000.00
├─ Ventas en Efectivo:      $45,320.50
├─ Pagos de Clientes:       $2,500.00
├─ Pagos a Proveedores:    -$3,200.00
└─ Efectivo Esperado:       $54,620.50

┌──────────────────────────────────┐
│ 💵 Efectivo Real: [_______] 🧮   │  ← Number input with currency formatting
└──────────────────────────────────┘

Diferencia: $0.00 ✓                   ← Dynamic color based on match
```

**Components:**
- "Ver Detalles" button: `variant="outline"`, placeholder (no functionality yet)
- Cash input: Number input with currency formatting
- Visual feedback for difference:
  - `null/empty` → Gray/neutral "Ingrese el efectivo contado"
  - `difference === 0` → Green background with ✓ icon
  - `difference !== 0` → Red background with warning icon, show `+$XXX` or `-$XXX`

### Other Payment Methods Section

```
💳 OTROS MÉTODOS DE PAGO
├─ Tarjeta Débito:              $32,150.00
├─ Tarjeta Crédito:             $28,900.00
├─ Transferencias:              $12,500.00
├─ QR/Billeteras Digitales:     $8,430.00
└─ (Show others if present: CHECK, CRYPTO)
```

**Payment Method Labels:**
- `CREDIT_CARD` → "Tarjeta Crédito"
- `DEBIT_CARD` → "Tarjeta Débito"
- `BANK_TRANSFER` → "Transferencias"
- `MOBILE_PAYMENT` → "QR/Billeteras Digitales"
- `CHECK` → "Cheques"
- `CRYPTO` → "Criptomonedas"

**Exclude:** ON_CREDIT, OVERPAYMENT (not real money received)

### Summary Section

```
📊 RESUMEN
├─ Total Ventas:        $127,300.50
├─ Cantidad de Tickets:  87
└─ Ticket Promedio:     $1,463.22
```

---

## Section 3: Footer Actions

### Button Layout (left to right)

1. **Volver**
   - `variant="outline"`
   - Closes modal without saving
   - Always enabled
   - Action: `setTerminalSessionClosure(false)`

2. **Imprimir Reporte**
   - `variant="outline"`
   - Placeholder (no functionality yet)
   - Always enabled

3. **Cerrar Caja** ✓
   - `variant="default"` (primary button)
   - **Disabled when:** `closingBalance === null || isClosing`
   - **On click:** Execute close session mutation

### Close Session Flow

```typescript
const closeSessionMutation = useMutation({
  mutationFn: async () => {
    await supabase
      .from("terminal_sessions")
      .update({
        status: "CLOSED",
        closed_at: new Date().toISOString(),
        closing_balance: closingBalance,
      })
      .eq("terminal_session_id", terminalSessionId);
  },
  onSuccess: () => {
    // Close modal
    setTerminalSessionClosure(false);
    // Invalidate relevant queries
    queryClient.invalidateQueries(["terminalSessionClosureData"]);
    // Show success toast
    toast.success("Sesión de caja cerrada exitosamente");
    // Navigate or refresh as needed
  },
  onError: (error) => {
    toast.error("Error al cerrar la sesión");
    console.error(error);
  }
});
```

---

## Implementation Notes

### Required Changes to Service Layer

The `getTerminalSessionClosureData` function already fetches all necessary data. No changes needed.

### Currency Formatting

Use existing utility or create helper:
```typescript
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
```

### Loading States

- Show spinner while `isLoading || isRefetching`
- Disable all inputs and buttons during mutation
- Show error message if data fetch fails

### Validation

- Cash input must be a valid positive number
- Button disabled until cash count is entered
- No need to validate difference amount (can be positive or negative)

---

## Future Enhancements (Not in Scope)

- Observations textarea for cashier notes
- "Ver Detalles" functionality (modal showing transaction breakdown)
- Print functionality (thermal printer integration)
- Products sold count (requires fetching order_items)
- Withdrawals/deposits tracking (requires new payment types or table)
