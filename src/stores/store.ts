// store.ts
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import scaleReducer from "./scaleSlice";
import modalsReducer from "./modalsSlice";
import orderReducer from "./orderSlice";
import deliveryOrderReducer from "./deliveryOrderSlice";
import deliveryOrderAiReducer from "./deliveryOrderAiSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    scale: scaleReducer,
    modals: modalsReducer,
    order: orderReducer,
    deliveryOrder: deliveryOrderReducer,
    deliveryOrderAi: deliveryOrderAiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;