// store.ts
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import scaleReducer from "./scaleSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    scale: scaleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;