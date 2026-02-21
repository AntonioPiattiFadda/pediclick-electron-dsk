// store.ts
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import scaleReducer from "./scaleSlice";
import modalsReducer from "./modalsSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    scale: scaleReducer,
    modals: modalsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;