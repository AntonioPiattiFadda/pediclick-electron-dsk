# Price System — Technical Reference for POS Integration

## Overview

Prices are defined at the **product presentation** level (not product). Each price row stores the sale price, how many units it covers, the profit margin, and a classification by type and logic. There are two scopes: **universal** (applies to all stores) and **local** (overrides for a specific store).

---

## Database Tables

### `prices`

| Column | Type | Description |
|---|---|---|
| `price_id` | integer (PK) | Auto-generated |
| `product_presentation_id` | integer (FK) | Which presentation this price belongs to |
| `location_id` | integer \| **null** | `null` = universal; a store ID = local to that store |
| `price_number` | integer | Display order index (1, 2, 3…) within a logic_type group |
| `price` | numeric | Sale price for `qty_per_price` units |
| `qty_per_price` | integer | How many units the `price` covers (see below) |
| `profit_percentage` | numeric | Margin over cost: `(price / (cost_per_unit * qty)) - 1) * 100` |
| `logic_type` | enum | `QUANTITY_DISCOUNT` \| `SPECIAL` \| `LIMITED_OFFER` |
| `observations` | text \| null | Free-text label shown at sale (e.g. "Precio jubilados") |
| `is_active` | boolean | Soft on/off flag |
| `valid_from` | timestamptz \| null | Start of validity window |
| `valid_until` | timestamptz \| null | End of validity window (used by `LIMITED_OFFER`) |

### `disabled_prices`

| Column | Type | Description |
|---|---|---|
| `id` | integer (PK) | Auto-generated |
| `price_id` | integer (FK → prices) | Which universal price is suppressed |
| `location_id` | integer | At which store it is suppressed |

A row here means: "this universal price must **not** show at this store".

### `enabled_prices_clients`

| Column | Type | Description |
|---|---|---|
| `id` | integer (PK) | Auto-generated |
| `price_id` | integer (FK → prices) | Which price is client-restricted |
| `client_id` | integer (FK → clients) | Client who can use it |

No rows for a `price_id` = applies to **all** clients. Rows present = **only** those clients.

---

## Scopes: Universal vs Local

```
Universal price  (location_id = NULL)
  └── applies to ALL stores
  └── can be suppressed per-store via disabled_prices

Local price  (location_id = <store_id>)
  └── applies ONLY to that store
  └── shown IN ADDITION to universal prices (not a replacement)
```

**Both can coexist at the same store for the same logic_type.** The POS should show all active applicable prices and let the operator choose.

---

## Logic Types

| Value | Meaning | Notes |
|---|---|---|
| `QUANTITY_DISCOUNT` | Price per N units | `qty_per_price > 1` is typical; no observations field used |
| `SPECIAL` | Named special price | `qty_per_price` usually 1; observations used for label |
| `LIMITED_OFFER` | Time-bounded promo | `valid_until` must be respected; expire after that date |

---

## `qty_per_price` — Unit Pricing

`price` is the total amount charged for `qty_per_price` units.

```
unit_price = price / qty_per_price
```

**Examples:**

| price | qty_per_price | Meaning |
|---|---|---|
| 1000 | 1 | $1000 per unit |
| 2500 | 3 | $2500 for 3 units → $833.33 each |
| 500 | 6 | $500 for a 6-pack |

The POS must handle partial quantities: if a customer buys 2 units and the only price is `qty=3`, decide whether to prorate or require the exact multiple.

---

## How the POS Should Resolve Prices for a Sale

Given `product_presentation_id` and `store_id`, the effective price list is:

```
1. Fetch universal prices:
   SELECT * FROM prices
   WHERE product_presentation_id = $1
     AND location_id IS NULL
     AND is_active = true

2. Subtract suppressed ones:
   SELECT price_id FROM disabled_prices
   WHERE location_id = $store_id

   → Remove any universal price whose price_id appears in step 2.

3. Fetch local prices:
   SELECT * FROM prices
   WHERE product_presentation_id = $1
     AND location_id = $store_id
     AND is_active = true

4. Merge both lists.

5. Filter out expired LIMITED_OFFER prices:
   WHERE valid_until IS NULL OR valid_until >= NOW()

6. For SPECIAL prices, filter by client:
   SELECT client_id FROM enabled_prices_clients WHERE price_id = $price_id
   → If empty → available to all clients.
   → If not empty → only show if the current client_id is in the list.

7. Present the resulting list grouped by logic_type, ordered by price_number.
```

A single product presentation can have multiple active prices simultaneously (e.g. a regular price + a quantity bundle + a special). The operator picks which one applies to the sale.

---

## Profit Percentage (informational)

This is **not needed for the POS** — it's only used in the admin panel to help set prices relative to cost.

```
profit_percentage = (price / (final_cost_per_unit × qty_per_price) − 1) × 100
```

The POS only needs `price` and `qty_per_price`.

---

## Minimal POS Query (single SQL)

```sql
SELECT p.*
FROM prices p
WHERE p.product_presentation_id = $1
  AND p.is_active = true
  AND (p.valid_until IS NULL OR p.valid_until >= NOW())
  AND (
    -- universal, not suppressed at this store
    (p.location_id IS NULL AND p.price_id NOT IN (
      SELECT price_id FROM disabled_prices WHERE location_id = $2
    ))
    OR
    -- local to this store
    p.location_id = $2
  )
ORDER BY p.logic_type, p.price_number;
```

Replace `$1` with `product_presentation_id`, `$2` with `location_id`.

---

## Writing Prices (Admin RPC Reference)

The admin uses a Supabase RPC `update_prices(p_prices, p_delete_ids)`:
- `p_prices`: array of price objects to upsert (no `price_id` = insert; with `price_id` = update)
- `p_delete_ids`: array of `price_id` integers to hard-delete

Before calling the RPC, any rows in `disabled_prices` **and** `enabled_prices_clients` referencing deleted `price_id`s must be removed first (FK constraint).

---

## Client-Restricted SPECIAL Prices

### `enabled_prices_clients`

| Column | Type | Description |
|---|---|---|
| `id` | integer (PK) | Auto-generated |
| `price_id` | integer (FK → prices) | Which price is restricted |
| `client_id` | integer (FK → clients) | Client who can use it |

**Logic (opt-in, opposite of `disabled_prices`):**

```
No rows for price_id  →  price applies to ALL clients
Rows present          →  price applies ONLY to listed clients
```

This applies to any price (universal or local), but is primarily used on `SPECIAL` prices.

### POS Resolution (extend step 6)

After resolving the effective price list, for each `SPECIAL` price:

```
1. Fetch enabled clients:
   SELECT client_id FROM enabled_prices_clients WHERE price_id = $price_id

2. If result is empty → price is available to all clients
3. If result has rows → price is only available if current client_id is in the list
```

### Minimal extension to the POS query

```sql
-- After fetching the effective price list, for SPECIAL prices only:
SELECT client_id FROM enabled_prices_clients WHERE price_id = ANY($special_price_ids)
-- Group by price_id in application code; empty = all clients
```

---

## Summary of Edge Cases

| Scenario | Behaviour |
|---|---|
| Universal price exists, no local prices | Universal applies at all stores |
| Universal price disabled at store X | Store X does not see it; other stores do |
| Local price at store X | Only store X sees it; universal is still active unless suppressed |
| `LIMITED_OFFER` past `valid_until` | Filter it out — do not show in POS |
| `is_active = false` | Never show in POS regardless of other fields |
| Multiple prices for same logic_type | All are valid — operator chooses at time of sale |
| `SPECIAL` price with no `enabled_prices_clients` rows | Available to all clients |
| `SPECIAL` price with `enabled_prices_clients` rows | Only listed clients can use it |
