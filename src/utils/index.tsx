import { MovementStatus } from "@/types";
import { Lot } from "@/types/lots";
import { OrderItem } from "@/types/orderItems";
import { PriceLogicType, PriceType } from "@/types/prices";


export function formatDate(value?: string) {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "numeric" });
  } catch {
    return value;
  }
}


export function sliceLongNames(maxLength: number, name?: string) {
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + '...';
}


export const generateTempNumericId = () => {
  const mathRandom = Math.floor(Math.random() * 1000);
  return Date.now() * 1000 + mathRandom;
};

export const getLotsAndStockFromFirtsToLast = ({
  lots,
  quantity,
  product_id,
  product_name,
  product_presentation_name,
  product_presentation_id,
  price,
  price_type,
  logic_type,
  subtotal,
  total,
  created_at,
  order_id,
  is_deleted,
  status,
  location_id,
  lot_id,
  allowOverSelling = false,
}: {
  lots: Lot[];
  quantity: number;
  product_id: number;
  product_name: string;
  product_presentation_name: string;
  product_presentation_id: number;
  price: number;
  price_type: PriceType;
  logic_type: PriceLogicType;
  order_id: number;
  is_deleted: boolean;
  status: MovementStatus;
  subtotal: number;
  total: number;
  created_at: string;
  location_id: number;
  lot_id: number | null;
  allowOverSelling?: boolean;
}): OrderItem[] => {

  // 🧠 CASO 0: no hay lotes → todo es sobreventa
  if (lots.length === 0) {
    if (!allowOverSelling) {
      throw new Error("No hay stock disponible y la sobreventa no está permitida");
    }

    return [
      {
        lot_id: null,
        stock_id: null,
        location_id,
        product_id,
        product_name,
        product_presentation_name,
        product_presentation_id,
        price,
        price_type,
        logic_type,
        quantity: 0,
        over_sell_quantity: quantity,
        subtotal,
        total,
        created_at,
        order_id,
        is_deleted,
        // FIXME VER ESTO QUE LO COMPLETE DE ONDA
        status: "COMPLETED",
      },
    ];
  }

  // ✅ 1. Orden FIFO
  const sortedLots: Lot[] = [...lots].sort(
    (a, b) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
  );

  // ✅ Caso lote forzado
  if (lot_id) {
    const selectedLot = lots.find(lot => lot.lot_id === lot_id);

    if (!selectedLot) {
      throw new Error("Lote no encontrado");
    }

    return [
      {
        lot_id,
        stock_id: selectedLot.stock?.[0]?.stock_id ?? null,
        location_id,
        product_id,
        product_name,
        product_presentation_name,
        product_presentation_id,
        price,
        price_type,
        logic_type,
        quantity,
        over_sell_quantity: 0,
        subtotal,
        total,
        created_at: new Date().toISOString(),
        order_id,
        is_deleted: false,
        status: "COMPLETED",
      },
    ];
  }

  const result: OrderItem[] = [];
  let remainingQty = quantity;
  let lastItemIndex: number | null = null;

  // ✅ 2. Consumo FIFO real
  for (const lot of sortedLots) {
    if (remainingQty <= 0) break;

    const availableQty = lot.stock?.[0]?.quantity ?? 0;
    if (availableQty <= 0) continue;

    const qtyToTake = Math.min(availableQty, remainingQty);

    const calculatedSubTotal = (subtotal * qtyToTake) / quantity;
    const calculatedTotal = (total * qtyToTake) / quantity;

    result.push({
      lot_id: lot.lot_id,
      stock_id: lot.stock?.[0]?.stock_id ?? null,
      location_id,
      product_id,
      product_name,
      product_presentation_name,
      product_presentation_id,
      price,
      price_type,
      logic_type,
      quantity: qtyToTake,
      over_sell_quantity: 0,
      subtotal: calculatedSubTotal,
      total: calculatedTotal,
      created_at,
      order_id,
      is_deleted,
      status,
    });

    lastItemIndex = result.length - 1;
    remainingQty -= qtyToTake;
  }

  // ✅ 3. Sobreventa → se asigna al ÚLTIMO item
  if (remainingQty > 0) {
    if (!allowOverSelling) {
      throw new Error("Stock insuficiente y la sobreventa no está permitida");
    }

    if (lastItemIndex === null) {
      throw new Error("No hay item base para asignar sobreventa");
    }

    const oversellSubtotal = (subtotal * remainingQty) / quantity;
    const oversellTotal = (total * remainingQty) / quantity;

    const lastItem = result[lastItemIndex];

    lastItem.over_sell_quantity = remainingQty;
    lastItem.subtotal += oversellSubtotal;
    lastItem.total += oversellTotal;
  }

  return result;
};
