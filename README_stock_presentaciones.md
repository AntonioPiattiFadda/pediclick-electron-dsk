# Contexto: Rediseño de Stock por Unidad Base con Presentaciones Múltiples

## Objetivo
Permitir que al cargar un lot de un producto (ej: 400 kg de papas), el sistema calcule automáticamente el stock disponible en cada presentación (cajones, bolsas, kg) sin almacenar stock separado por presentación.

---

## Decisión de diseño

El stock se guarda **una sola vez en unidad base** (ej: kilogramos), vinculado al `lot` + `location`. Las cantidades por presentación son **calculadas al vuelo** dividiendo por `bulk_quantity_equivalence` de cada `product_presentation`.

**Ejemplo:**
- Se cargan 400 kg de papas → `stock.quantity = 400`
- Cajón (`bulk_quantity_equivalence = 200`) → 400 / 200 = **2 cajones**
- Bolsa 10kg (`bulk_quantity_equivalence = 10`) → 400 / 10 = **40 bolsas**
- Papa por kilo (`bulk_quantity_equivalence = 1`) → **400 kg**

---

## Tablas involucradas

### `products`
Sin cambios. Referencia base del producto.

### `product_presentations`
Sin cambios estructurales. El campo clave es:
- `bulk_quantity_equivalence` → unidades base que equivale una presentación

> ⚠️ Todas las presentaciones de un producto deben tener este campo cargado.

### `lots`
**Cambio requerido:** eliminar `product_presentation_id` del insert.  
El lot solo debe conocer el `product_id` y la cantidad en unidad base.  
El campo puede quedar en la tabla pero dejar de usarse como filtro de stock.

### `stock`
Sin cambios estructurales. Ya tiene `lot_id + location_id + quantity`.  
La `quantity` debe representar siempre **unidad base**.

### `order_items`
**Cambio requerido:** agregar columna:
```sql
ALTER TABLE order_items ADD COLUMN qty_in_base_units numeric;
```
- `quantity` = lo que el cliente ve (ej: 1 cajón)
- `product_presentation_id` = qué presentación se vendió
- `qty_in_base_units` = lo que se descuenta del stock (ej: 200 kg)

---

## Función `add_stock`

**Cambios necesarios:**
1. Eliminar `product_presentation_id` del INSERT en `lots`
2. La `quantity` que llega en el payload debe ser en **unidad base** (el frontend convierte antes de enviar, ej: 2 cajones × 200 = 400)
3. Eliminar `product_presentation_id` de las búsquedas de stock/lot existente

**Funciones relacionadas que también hay que revisar:**
- `get_last_over_sell_stock` → filtra por `lots.product_presentation_id`
- `get_or_create_stock_with_location_pi_and_pi` → crea lots con `product_presentation_id`
- `resolve_oversell_stock` → igual

---

## Lógica de descuento de stock al vender

Al registrar una venta con una presentación:
```
qty_in_base_units = quantity × product_presentations.bulk_quantity_equivalence
```
El stock siempre se descuenta usando `qty_in_base_units`, no `quantity`.

---

## Stack
- **Frontend:** React
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Funciones DB:** PL/pgSQL

---

## Pendiente / Edge cases
- Validar que todas las presentaciones del producto tengan `bulk_quantity_equivalence` != NULL antes de cargar un lot
- Funciones de oversell dependen de `product_presentation_id` en lots → requieren refactor
- Datos existentes en `lots` con `product_presentation_id` cargado → decidir estrategia de migración (campo `is_base_unit boolean` como migración suave)
