export type StockMovement = {
  stock_movement_id?: number;
  lot_id: number;
  movement_type: "TRANSFER" | "SALE" | "WASTE" | "INITIAL_LOAD";
  quantity: number | null;
  created_at?: string | null;
  from_stock_room_id: number | null;
  to_stock_room_id: number | null;
  from_store_id: number | null;
  to_store_id: number | null;
  should_notify_owner: boolean;
} | null;
