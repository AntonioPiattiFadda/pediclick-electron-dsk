import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OrderItem } from "@/types/orderItems";
import type { OrderT } from "@/types/orders";
import type { ProductPresentation } from "@/types/productPresentation";
import type { Product } from "@/types/products";
import type { PriceType } from "@/types/prices";

interface OrderState {
    // In-site orders list & cart
    orders: OrderT[];
    orderItems: OrderItem[];
    activeOrder: string;

    // Shared product selection state (used by in-site orders AND AI delivery orders)
    selectedProduct: Product;
    productPresentations: ProductPresentation[];
    productPresentation: Partial<ProductPresentation>;
    selectedPriceId: number | null;
    sellPriceType: PriceType;
    effectivePrice: number;
    selectedLotId: number | null;
    selectedStockId: number | null;

    // Checkout dialog
    isCheckOutOpen: boolean;
}

const initialState: OrderState = {
    orders: [],
    orderItems: [],
    activeOrder: "",
    selectedProduct: {} as Product,
    productPresentations: [],
    productPresentation: {},
    selectedPriceId: null,
    sellPriceType: "MINOR",
    effectivePrice: 0,
    selectedLotId: null,
    selectedStockId: null,
    isCheckOutOpen: false,
};

const orderSlice = createSlice({
    name: "order",
    initialState,
    reducers: {
        setOrders(state, action: PayloadAction<OrderT[]>) {
            state.orders = action.payload;
        },
        setOrderItems(state, action: PayloadAction<OrderItem[]>) {
            state.orderItems = action.payload;
        },
        setActiveOrder(state, action: PayloadAction<string>) {
            state.activeOrder = action.payload;
        },
        setSelectedProduct(state, action: PayloadAction<Product>) {
            state.selectedProduct = action.payload;
        },
        setProductPresentations(state, action: PayloadAction<ProductPresentation[]>) {
            state.productPresentations = action.payload;
        },
        setProductPresentation(state, action: PayloadAction<Partial<ProductPresentation>>) {
            state.productPresentation = action.payload;
        },
        setSelectedPriceId(state, action: PayloadAction<number | null>) {
            state.selectedPriceId = action.payload;
        },
        setSellPriceType(state, action: PayloadAction<PriceType>) {
            state.sellPriceType = action.payload;
        },
        setEffectivePrice(state, action: PayloadAction<number>) {
            state.effectivePrice = action.payload;
        },
        setSelectedLotId(state, action: PayloadAction<number | null>) {
            state.selectedLotId = action.payload;
        },
        setSelectedStockId(state, action: PayloadAction<number | null>) {
            state.selectedStockId = action.payload;
        },
        setIsCheckOutOpen(state, action: PayloadAction<boolean>) {
            state.isCheckOutOpen = action.payload;
        },
        resetAfterOrderCreation(state) {
            state.selectedProduct = {} as Product;
            state.productPresentation = {};
            state.selectedPriceId = null;
            state.sellPriceType = "MINOR";
            state.selectedStockId = null;
            state.effectivePrice = 0;
            state.selectedLotId = null;
        },
    },
});

export const {
    setOrders,
    setOrderItems,
    setActiveOrder,
    setSelectedProduct,
    setProductPresentations,
    setProductPresentation,
    setSelectedPriceId,
    setSellPriceType,
    setEffectivePrice,
    setSelectedLotId,
    setSelectedStockId,
    setIsCheckOutOpen,
    resetAfterOrderCreation,
} = orderSlice.actions;

export default orderSlice.reducer;
