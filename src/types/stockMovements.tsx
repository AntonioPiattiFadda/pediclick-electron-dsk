export type StockMovement = {
  stock_movement_id: number;
  lot_id: number;
  movement_type: "TRANSFER" | "SALE" | "WASTE" | "INITIAL_LOAD";
  quantity: number | null;
  created_at: string | null;
  from_location_id: number | null;
  to_location_id: number | null;
  should_notify_owner: boolean;
} | null;
