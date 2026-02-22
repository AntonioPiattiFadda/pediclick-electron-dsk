/**
 * Keyboard shortcut focus-order glossary.
 *
 * Defines the ArrowDown / ArrowUp navigation sequence managed by ShortCutContext.
 * Items are visited in ascending order (1 → 2 → 3 …).
 *
 * Order | Input                         | Registered in
 * ------|-------------------------------|----------------------------------------------
 *   1   | Product selector              | ProductSelectorOrder / ProductSelectorDelivery*
 *   2   | Product presentation selector | ProductSelectorOrder / ProductSelectorDelivery*
 *   3   | Quantity input                | PricingPanel (shared + deliveryOrdersAi)
 */
export const FOCUS_ORDER = {
    PRODUCT: 1,
    PRODUCT_PRESENTATION: 2,
    QUANTITY: 3,
} as const;
