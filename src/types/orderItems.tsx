export interface OrderItem {
  order_item_id?: string;
  order_id?: string;
  product_id: number;
  lot_id?: number;
  product_name: string;
  price_id?: number;
  //La va a determinar la balanza si es producto por kg
  //Si es por unidad lo va a seleccionar el usuario
  //Se calculaara unit_price en base a esto
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  total_price: number;
  created_at?: string;
}
