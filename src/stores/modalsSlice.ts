import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ModalsState {
    clientPaymentModalOpen: boolean;
    terminalSessionClosure: boolean;
}

const initialState: ModalsState = {
    clientPaymentModalOpen: false,
    terminalSessionClosure: false,
};

const modalsSlice = createSlice({
    name: "modals",
    initialState,
    reducers: {
        setClientPaymentModalOpen(state, action: PayloadAction<boolean>) {
            state.clientPaymentModalOpen = action.payload;
        },
        setTerminalSessionClosure(state, action: PayloadAction<boolean>) {
            state.terminalSessionClosure = action.payload;
        },
    },
});

export const { setClientPaymentModalOpen, setTerminalSessionClosure } = modalsSlice.actions;
export default modalsSlice.reducer;
