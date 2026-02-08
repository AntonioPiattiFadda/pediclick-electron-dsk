import { PriceType } from "@/types/prices";
import { ProductPresentation } from "@/types/productPresentation";
import { Product } from "@/types/products";
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addDeliveryOrderItem,
  removeDeliveryOrderItem,
  updateDeliveryOrderClient,
  DeliveryOrderItemInput,
} from "@/service";
import { toast } from "sonner";
import { OrderItem } from "@/types/orderItems";
import { DATE_RANGE_OPTIONS } from "@/pages/deliveryOrders/constants";
import { useGetLocationData } from "@/hooks/useGetLocationData";

interface DeliveryOrderContextType {
  // Product selection state (temporary until added to cart)
  selectedProduct: Product;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product>>;

  productPresentations: ProductPresentation[];
  setProductPresentations: React.Dispatch<
    React.SetStateAction<ProductPresentation[]>
  >;

  productPresentation: Partial<ProductPresentation>;
  setProductPresentation: React.Dispatch<
    React.SetStateAction<Partial<ProductPresentation>>
  >;

  selectedPriceId: null | number;
  setSelectedPriceId: React.Dispatch<React.SetStateAction<number | null>>;

  sellPriceType: PriceType;
  setSellPriceType: React.Dispatch<React.SetStateAction<PriceType>>;

  effectivePrice: number;
  setEffectivePrice: React.Dispatch<React.SetStateAction<number>>;

  selectedLotId: number | null;
  setSelectedLotId: React.Dispatch<React.SetStateAction<number | null>>;

  selectedStockId: number | null;
  setSelectedStockId: React.Dispatch<React.SetStateAction<number | null>>;

  // UI state
  isCheckOutOpen: boolean;
  setIsCheckOutOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Active order ID
  activeDeliveryOrderId: number | null;
  setActiveDeliveryOrderId: React.Dispatch<
    React.SetStateAction<number | null>
  >;

  // Mutations
  addItemToOrder: (itemData: OrderItem) => Promise<void>;
  removeItemFromOrder: (orderItemId: number, stockId: number) => Promise<void>;
  updateOrderClient: (clientId: number | null) => Promise<void>;

  isRemovingItem: boolean;

  // Reset product selection
  resetProductSelection: () => void;
}

const DeliveryOrderContext = createContext<DeliveryOrderContextType>({
  selectedProduct: {} as Product,
  setSelectedProduct: () => { },

  productPresentations: [] as ProductPresentation[],
  setProductPresentations: () => { },

  productPresentation: {} as ProductPresentation,
  setProductPresentation: () => { },

  selectedPriceId: null,
  setSelectedPriceId: () => { },

  sellPriceType: "MINOR",
  setSellPriceType: () => { },

  effectivePrice: 0,
  setEffectivePrice: () => { },

  selectedLotId: null,
  setSelectedLotId: () => { },

  selectedStockId: null,
  setSelectedStockId: () => { },

  isCheckOutOpen: false,
  setIsCheckOutOpen: () => { },

  activeDeliveryOrderId: null,
  setActiveDeliveryOrderId: () => { },

  addItemToOrder: async () => { },
  removeItemFromOrder: async () => { },
  updateOrderClient: async () => { },

  isRemovingItem: false,

  resetProductSelection: () => { },
});

export const DeliveryOrderProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // Product selection state (temporary)
  const [selectedProduct, setSelectedProduct] = useState<Product>(
    {} as Product
  );

  const [productPresentations, setProductPresentations] = useState<
    ProductPresentation[]
  >([]);

  const [productPresentation, setProductPresentation] = useState<
    Partial<ProductPresentation>
  >({} as Partial<ProductPresentation>);

  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);

  const [sellPriceType, setSellPriceType] = useState<PriceType>("MINOR");

  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);

  const [effectivePrice, setEffectivePrice] = useState<number>(0);

  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  // UI state
  const [isCheckOutOpen, setIsCheckOutOpen] = useState<boolean>(false);

  // Active order
  const [activeDeliveryOrderId, setActiveDeliveryOrderId] = useState<
    number | null
  >(null);

  // Reset product selection helper
  const resetProductSelection = () => {
    // setSelectedProduct({} as Product);
    // setProductPresentation({} as Partial<ProductPresentation>);
    // setSelectedPriceId(null);
    // setSellPriceType("MINOR");
    // setSelectedStockId(null);
    // setEffectivePrice(0);
    // setSelectedLotId(null);
  };

  const { handleGetLocationId } = useGetLocationData();

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: (itemData: DeliveryOrderItemInput) => {
      toast.loading("Creando producto...");
      if (!activeDeliveryOrderId) {
        throw new Error("No active delivery order");
      }
      return addDeliveryOrderItem(activeDeliveryOrderId, itemData);
    },
    onSuccess: () => {
      toast.dismiss();

      const locationId = handleGetLocationId();

      DATE_RANGE_OPTIONS.forEach((option) => {
        queryClient.refetchQueries({
          queryKey: ["delivery-orders", locationId, option.value],
        });
      });

      // queryKey: ["delivery-orders", locationId, daysBack]
      queryClient.invalidateQueries({
        queryKey: ["delivery-order-items", activeDeliveryOrderId],
      });
      queryClient.invalidateQueries({
        queryKey: ["delivery-order", activeDeliveryOrderId],
      });
      resetProductSelection();
      // toast.success("Producto agregado");
    },
    onError: (error) => {
      toast.dismiss();

      console.error("Error adding item:", error);
      toast.error("Error al agregar producto");
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: (removeData: { orderItemId: number; stockId: number }) => {
      toast.loading("Eliminando producto...");

      return removeDeliveryOrderItem(removeData.orderItemId, removeData.stockId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["delivery-order-items", activeDeliveryOrderId],
      });
      queryClient.invalidateQueries({
        queryKey: ["delivery-order", activeDeliveryOrderId],
      });
      toast.dismiss();
    },
    onError: (error) => {
      toast.dismiss();
      console.error("Error removing item:", error);
      toast.error("Error al eliminar producto");
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: (clientId: number | null) => {
      if (!activeDeliveryOrderId) {
        throw new Error("No active delivery order");
      }
      toast.loading("Actualizando cliente...");

      return updateDeliveryOrderClient(activeDeliveryOrderId, clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["delivery-order", activeDeliveryOrderId],
      });
      toast.dismiss();
    },
    onError: (error) => {
      console.error("Error updating client:", error);
      toast.dismiss();
      toast.error("Error al actualizar cliente");
    },
  });

  return (
    <DeliveryOrderContext.Provider
      value={{
        selectedProduct,
        setSelectedProduct,

        productPresentations,
        setProductPresentations,

        productPresentation,
        setProductPresentation,

        selectedPriceId,
        setSelectedPriceId,

        sellPriceType,
        setSellPriceType,

        effectivePrice,
        setEffectivePrice,

        selectedLotId,
        setSelectedLotId,

        selectedStockId,
        setSelectedStockId,

        isCheckOutOpen,
        setIsCheckOutOpen,

        activeDeliveryOrderId,
        setActiveDeliveryOrderId,

        addItemToOrder: (itemData) => addItemMutation.mutateAsync(itemData),
        removeItemFromOrder: (removeData) =>
          removeItemMutation.mutateAsync(removeData),
        updateOrderClient: (clientId) =>
          updateClientMutation.mutateAsync(clientId),

        isRemovingItem: removeItemMutation.isPending,


        resetProductSelection,
      }}
    >
      {children}
    </DeliveryOrderContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDeliveryOrderContext = () => useContext(DeliveryOrderContext);
