import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ProductPresentation } from "@/types/productPresentation";
import type { Product } from "@/types/products";

// Note: mutations (addItemToOrder, removeItemFromOrder, updateOrderClient) live
// in the components that use them — they are async side-effects, not state.

interface DeliveryOrderState {
    selectedProduct: Product;
    productPresentation: Partial<ProductPresentation>;
    selectedPriceId: number | null;
    effectivePrice: number;
    selectedLotId: number | null;
    selectedStockId: number | null;
    isCheckOutOpen: boolean;
    activeDeliveryOrderId: number | null;
}

const initialState: DeliveryOrderState = {
    selectedProduct: {} as Product,
    productPresentation: {},
    selectedPriceId: null,
    effectivePrice: 0,
    selectedLotId: null,
    selectedStockId: null,
    isCheckOutOpen: false,
    activeDeliveryOrderId: null,
};

const deliveryOrderSlice = createSlice({
    name: "deliveryOrder",
    initialState,
    reducers: {
        setDeliverySelectedProduct(state, action: PayloadAction<Product>) {
            state.selectedProduct = action.payload;
        },
        setDeliveryProductPresentation(state, action: PayloadAction<Partial<ProductPresentation>>) {
            state.productPresentation = action.payload;
        },
        setDeliverySelectedPriceId(state, action: PayloadAction<number | null>) {
            state.selectedPriceId = action.payload;
        },
        setDeliveryEffectivePrice(state, action: PayloadAction<number>) {
            state.effectivePrice = action.payload;
        },
        setDeliverySelectedLotId(state, action: PayloadAction<number | null>) {
            state.selectedLotId = action.payload;
        },
        setDeliverySelectedStockId(state, action: PayloadAction<number | null>) {
            state.selectedStockId = action.payload;
        },
        setDeliveryIsCheckOutOpen(state, action: PayloadAction<boolean>) {
            state.isCheckOutOpen = action.payload;
        },
        setActiveDeliveryOrderId(state, action: PayloadAction<number | null>) {
            state.activeDeliveryOrderId = action.payload;
        },
    },
});

export const {
    setDeliverySelectedProduct,
    setDeliveryProductPresentation,
    setDeliverySelectedPriceId,
    setDeliveryEffectivePrice,
    setDeliverySelectedLotId,
    setDeliverySelectedStockId,
    setDeliveryIsCheckOutOpen,
    setActiveDeliveryOrderId,
} = deliveryOrderSlice.actions;

export default deliveryOrderSlice.reducer;
