import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { OrderItem } from "@/types/orderItems";
import { OrderT } from "@/types/orders";

interface DeliveryOrderAiContextType {
  // Single AI order state
  aiOrder: OrderT | null;
  setAiOrder: React.Dispatch<React.SetStateAction<OrderT | null>>;

  // Order items for the AI order
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;

  // Helper functions
  startAiOrder: () => void;
  clearAiOrder: () => void;
}

const DeliveryOrderAiContext = createContext<DeliveryOrderAiContextType>({
  aiOrder: null,
  setAiOrder: () => {},

  orderItems: [],
  setOrderItems: () => {},

  startAiOrder: () => {},
  clearAiOrder: () => {},
});

export const DeliveryOrderAiProvider = ({ children }: { children: ReactNode }) => {
  const [aiOrder, setAiOrder] = useState<OrderT | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const startAiOrder = () => {
    // Initialize local state only, no DB call
    const tempOrder: OrderT = {
      order_id: Date.now(), // Temporary ID for UI
      is_ai_assisted: true,
      order_type: "DELIVERY",
      status: "PENDING",
      created_at: new Date().toISOString(),
      location_id: 0, // Will be set properly at checkout
      terminal_session_id: 0, // Will be set properly at checkout
      client_id: null,
      total: 0,
    } as OrderT;

    setAiOrder(tempOrder);
    setOrderItems([]);
  };

  const clearAiOrder = () => {
    setAiOrder(null);
    setOrderItems([]);
  };

  return (
    <DeliveryOrderAiContext.Provider
      value={{
        aiOrder,
        setAiOrder,
        orderItems,
        setOrderItems,
        startAiOrder,
        clearAiOrder,
      }}
    >
      {children}
    </DeliveryOrderAiContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDeliveryOrderAiContext = () => useContext(DeliveryOrderAiContext);
