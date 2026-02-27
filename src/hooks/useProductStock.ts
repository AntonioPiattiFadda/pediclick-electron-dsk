import { useMemo } from "react";
import type { Lot } from "@/types/lots";
import type { OrderItem } from "@/types/orderItems";

export interface UseProductStockOptions {
  lots: Lot[];
  locationId: number;
  productId: number | null;
  allOrderItems: OrderItem[];
  currentOrderId: number | null;
}

export interface UseProductStockReturn {
  totalBaseUnits: number;
  reservedForSelling: number;
  reservedForTransferring: number;
  currentCartBaseUnits: number;
  otherCartsBaseUnits: number;
  availableBaseUnits: number;
  currentCartByPresentation: Record<number, number>;
  otherCartsByPresentation: Record<number, number>;
}

export function useProductStock({
  lots,
  locationId,
  productId,
  allOrderItems,
  currentOrderId,
}: UseProductStockOptions): UseProductStockReturn {
  // Exclude cancelled local items (soft-deleted via status) and DB soft-deletes (is_deleted).
  // When a cart item is removed, DeleteCartItemButton sets status='CANCELLED' on both the
  // original entry and a compensating negative entry — filtering both zeroes their net impact.
  const activeOrderItems = useMemo(
    () => allOrderItems.filter((oi) => !oi.is_deleted && oi.status !== "CANCELLED"),
    [allOrderItems]
  );

  const { totalBaseUnits, reservedForSelling, reservedForTransferring } = useMemo(() => {
    return lots.reduce(
      (acc, lot) => {
        const stock = lot?.stock?.find((s) => s.location_id === locationId);
        if (stock) {
          acc.totalBaseUnits += stock.quantity ?? 0;
          acc.reservedForSelling += stock.reserved_for_selling_quantity ?? 0;
          acc.reservedForTransferring += stock.reserved_for_transferring_quantity ?? 0;
        }
        return acc;
      },
      { totalBaseUnits: 0, reservedForSelling: 0, reservedForTransferring: 0 }
    );
  }, [lots, locationId]);

  const currentCartItems = useMemo(() => {
    if (!productId) return [];
    return activeOrderItems.filter(
      (oi) => Number(oi.product_id) === Number(productId) && oi.order_id === currentOrderId
    );
  }, [activeOrderItems, productId, currentOrderId]);

  const otherCartsItems = useMemo(() => {
    if (!productId) return [];
    return activeOrderItems.filter(
      (oi) => Number(oi.product_id) === Number(productId) && oi.order_id !== currentOrderId
    );
  }, [activeOrderItems, productId, currentOrderId]);

  const currentCartBaseUnits = useMemo(
    () => currentCartItems.reduce((s, oi) => s + Number(oi.qty_in_base_units ?? 0), 0),
    [currentCartItems]
  );

  const otherCartsBaseUnits = useMemo(
    () => otherCartsItems.reduce((s, oi) => s + Number(oi.qty_in_base_units ?? 0), 0),
    [otherCartsItems]
  );

  const availableBaseUnits = useMemo(
    () =>
      Math.max(
        0,
        totalBaseUnits -
          reservedForSelling -
          reservedForTransferring -
          currentCartBaseUnits -
          otherCartsBaseUnits
      ),
    [totalBaseUnits, reservedForSelling, reservedForTransferring, currentCartBaseUnits, otherCartsBaseUnits]
  );

  const currentCartByPresentation = useMemo(
    () =>
      currentCartItems.reduce<Record<number, number>>((acc, oi) => {
        const presId = oi.product_presentation_id;
        acc[presId] = (acc[presId] ?? 0) + Number(oi.quantity ?? 0);
        return acc;
      }, {}),
    [currentCartItems]
  );

  const otherCartsByPresentation = useMemo(
    () =>
      otherCartsItems.reduce<Record<number, number>>((acc, oi) => {
        const presId = oi.product_presentation_id;
        acc[presId] = (acc[presId] ?? 0) + Number(oi.quantity ?? 0);
        return acc;
      }, {}),
    [otherCartsItems]
  );

  return {
    totalBaseUnits,
    reservedForSelling,
    reservedForTransferring,
    currentCartBaseUnits,
    otherCartsBaseUnits,
    availableBaseUnits,
    currentCartByPresentation,
    otherCartsByPresentation,
  };
}
