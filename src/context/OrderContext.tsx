import { PriceType } from "@/types/prices";
import { ProductPresentation } from "@/types/productPresentation";
import { Product } from "@/types/products";
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode
} from "react";
import { OrderItem } from "../types/orderItems";
import { OrderT } from "../types/orders";

const OrderContext = createContext<{
  orders: OrderT[];
  setOrders: React.Dispatch<React.SetStateAction<OrderT[]>>;
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  currentOrderItem: OrderItem;
  setCurrentOrderItem: React.Dispatch<React.SetStateAction<OrderItem>>;
  selectedProduct: Product;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product>>;

  productPresentations: ProductPresentation[];
  setProductPresentations: React.Dispatch<React.SetStateAction<ProductPresentation[]>>;

  productPresentation: Partial<ProductPresentation>;
  setProductPresentation: React.Dispatch<React.SetStateAction<Partial<ProductPresentation>>>;
  // Unit price selected to calculate totals (per kg for WEIGHT, per unit for QUANTITY)
  selectedPriceId: null | number;
  setSelectedPriceId: React.Dispatch<React.SetStateAction<number | null>>;

  // prices: Price[];
  // setPrices: React.Dispatch<React.SetStateAction<Price[]>>;

  sellPriceType: PriceType;
  setSellPriceType: React.Dispatch<React.SetStateAction<PriceType>>;



  activeOrder: string;
  setactiveOrder: React.Dispatch<React.SetStateAction<string>>;

  activeDeliveryOrder: string;
  setActiveDeliveryOrder: React.Dispatch<React.SetStateAction<string>>;

  resetAfterOrderCreation: () => void;

  effectivePrice: number;
  setEffectivePrice: React.Dispatch<React.SetStateAction<number>>;

  selectedLotId: number | null;
  setSelectedLotId: React.Dispatch<React.SetStateAction<number | null>>;

  selectedStockId: number | null;
  setSelectedStockId: React.Dispatch<React.SetStateAction<number | null>>;

  isCheckOutOpen: boolean;
  setIsCheckOutOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  orders: [] as OrderT[],
  setOrders: () => { },
  orderItems: [],
  setOrderItems: () => { },
  currentOrderItem: {} as OrderItem,
  setCurrentOrderItem: () => { },
  selectedProduct: {} as Product,
  setSelectedProduct: () => { },

  productPresentations: [] as ProductPresentation[],
  setProductPresentations: () => { },

  productPresentation: {} as ProductPresentation,
  setProductPresentation: () => { },
  selectedPriceId: null,
  setSelectedPriceId: () => { },

  // prices: [] as Price[],
  // setPrices: () => { },

  sellPriceType: "MINOR",
  setSellPriceType: () => { },


  activeOrder: "",
  setactiveOrder: () => { },
  activeDeliveryOrder: "",
  setActiveDeliveryOrder: () => { },
  resetAfterOrderCreation: () => { },

  effectivePrice: 0,
  setEffectivePrice: () => { },

  selectedLotId: null,
  setSelectedLotId: () => { },

  selectedStockId: null,
  setSelectedStockId: () => { },

  isCheckOutOpen: false,
  setIsCheckOutOpen: () => { },

});

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<OrderT[]>([]);

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [currentOrderItem, setCurrentOrderItem] = useState<OrderItem>(
    {} as OrderItem
  );

  const [selectedProduct, setSelectedProduct] = useState<Product>(
    {} as Product
  );

  const [productPresentations, setProductPresentations] = useState<ProductPresentation[]>([]);

  const [productPresentation, setProductPresentation] = useState<Partial<ProductPresentation>>({} as Partial<ProductPresentation>)

  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);

  // const [prices, setPrices] = useState<Price[]>([]);

  const [sellPriceType, setSellPriceType] = useState<PriceType>("MINOR");

  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);

  const [activeOrder, setactiveOrder] = useState<string>("");
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<string>("");

  const [effectivePrice, setEffectivePrice] = useState<number>(0);

  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  const [isCheckOutOpen, setIsCheckOutOpen] = useState<boolean>(false);


  const resetAfterOrderCreation = () => {
    setSelectedProduct({} as Product);
    setProductPresentation({} as Partial<ProductPresentation>);
    setSelectedPriceId(null);
    // setPrices([]);
    setSellPriceType("MINOR");
    setSelectedStockId(null);
    setEffectivePrice(0);
    setSelectedLotId(null);
  };

  // const [sellPriceLogic, setSellPriceLogic] = useState<PriceLogicType>("QUANTITY_DISCOUNT");
  return (
    <OrderContext.Provider
      value={{
        isCheckOutOpen,
        setIsCheckOutOpen,

        orders,
        setOrders,
        orderItems,
        setOrderItems,
        currentOrderItem,
        setCurrentOrderItem,
        selectedProduct,
        setSelectedProduct,

        productPresentations,
        setProductPresentations,


        productPresentation,
        setProductPresentation,
        // prices,
        // setPrices,
        sellPriceType,
        setSellPriceType,
        activeOrder,
        setactiveOrder,

        activeDeliveryOrder,
        setActiveDeliveryOrder,

        resetAfterOrderCreation,
        effectivePrice,
        setEffectivePrice,

        selectedPriceId,
        setSelectedPriceId,

        selectedLotId,
        setSelectedLotId,
        selectedStockId,
        setSelectedStockId,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useOrderContext = () => useContext(OrderContext);
