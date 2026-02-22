import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OrderItem } from "@/types/orderItems";
import type { OrderT } from "@/types/orders";

interface DeliveryOrderAiState {
    aiOrder: OrderT | null;
    orderItems: OrderItem[];
}

const initialState: DeliveryOrderAiState = {
    aiOrder: null,
    orderItems: [],
};

const deliveryOrderAiSlice = createSlice({
    name: "deliveryOrderAi",
    initialState,
    reducers: {
        setAiOrder(state, action: PayloadAction<OrderT | null>) {
            state.aiOrder = action.payload;
        },
        setAiOrderItems(state, action: PayloadAction<OrderItem[]>) {
            state.orderItems = action.payload;
        },
        startAiOrder(state) {
            state.aiOrder = {
                order_id: Date.now(),
                is_ai_assisted: true,
                order_type: "DELIVERY",
                status: "PENDING",
                created_at: new Date().toISOString(),
                location_id: 0,
                terminal_session_id: 0,
                client_id: null,
                total: 0,
                client_type: "FINAL",
                order_number: "",
                order_status: "NEW",
                payment_status: "PENDING",
                subtotal: 0,
                total_amount: 0,
                currency: "ARS",
                is_delivery: true,
            } as OrderT;
            state.orderItems = [];
        },
        clearAiOrder(state) {
            state.aiOrder = null;
            state.orderItems = [];
        },
    },
});

export const { setAiOrder, setAiOrderItems, startAiOrder, clearAiOrder } =
    deliveryOrderAiSlice.actions;

export default deliveryOrderAiSlice.reducer;
