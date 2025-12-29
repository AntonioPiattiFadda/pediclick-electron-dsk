import { MovementStatus } from ".";
import { PriceLogicType, PriceType } from "./prices";

export interface OrderItem {
  order_item_id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  product_presentation_name: string;
  product_presentation_id: number;
  lot_id: number;
  stock_id: number;
  location_id: number;

  //La va a determinar la balanza si es producto por kg
  //Si es por unidad lo va a seleccionar el usuario
  //Se calculaara price en base a esto

  quantity: number;
  price: number;

  price_type: PriceType;
  logic_type: PriceLogicType;

  subtotal: number;


  discount?: number;
  tax?: number;
  is_deleted: boolean;

  total: number;
  status: MovementStatus;

  created_at: string;
}
