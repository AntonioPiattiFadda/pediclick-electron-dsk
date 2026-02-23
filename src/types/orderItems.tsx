import { MovementStatus } from ".";
import { PriceLogicType } from "./prices";

// FIXME VERIFICAR SI LOT ID Y STOCK ID PUEDEN SER NULL
export interface OrderItem {
  order_item_id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  product_presentation_name: string;
  product_presentation_id: number;
  lot_id: number | null;
  stock_id: number | null;
  location_id: number;

  //La va a determinar la balanza si es producto por kg
  //Si es por unidad lo va a seleccionar el usuario
  //Se calculaara price en base a esto

  quantity: number;
  over_sell_quantity: number;
  price: number;

  logic_type: PriceLogicType;

  subtotal: number;


  discount?: number;
  tax?: number;

  total: number;
  status: MovementStatus;

  created_at: string;

  is_deleted: boolean;

  is_ai_assisted?: boolean;
}

export interface OrderItemDisplay extends OrderItem {
  product_name: string;
  product_presentation_name: string;
}
