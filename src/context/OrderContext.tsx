import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Order } from "../types/orders";
import { OrderItem } from "../types/orderItems";
import { Product } from "@/types/products";

const OrderContext = createContext<{
  order: Order;
  setOrder: React.Dispatch<React.SetStateAction<Order>>;
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  currentOrderItem: OrderItem;
  setCurrentOrderItem: React.Dispatch<React.SetStateAction<OrderItem>>;
  selectedProduct: Product;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product>>;
  // Unit price selected to calculate totals (per kg for WEIGHT, per unit for QUANTITY)
  selectedPrice: number;
  setSelectedPrice: React.Dispatch<React.SetStateAction<number>>;
}>({
  order: {} as Order,
  setOrder: () => { },
  orderItems: [],
  setOrderItems: () => { },
  currentOrderItem: {} as OrderItem,
  setCurrentOrderItem: () => { },
  selectedProduct: {} as Product,
  setSelectedProduct: () => { },
  selectedPrice: 0,
  setSelectedPrice: () => { },
});

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrder] = useState<Order>({} as Order);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentOrderItem, setCurrentOrderItem] = useState<OrderItem>(
    {} as OrderItem
  );

  const [selectedProduct, setSelectedProduct] = useState<Product>(
    {} as Product
  );
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  console.log(orderItems, order, currentOrderItem, selectedProduct, selectedPrice);

  return (
    <OrderContext.Provider
      value={{
        order,
        setOrder,
        orderItems,
        setOrderItems,
        currentOrderItem,
        setCurrentOrderItem,
        selectedProduct,
        setSelectedProduct,
        selectedPrice,
        setSelectedPrice,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useOrderContext = () => useContext(OrderContext);
