import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ScaleState {
    weightKg: number | undefined;
    unitsCount: number | undefined;
    isScaleConnected: boolean;
    isScaleError: boolean;
}

const initialState: ScaleState = {
    weightKg: 1,
    unitsCount: 1,
    isScaleConnected: false,
    isScaleError: false,
};

const scaleSlice = createSlice({
    name: "scale",
    initialState,
    reducers: {
        setWeight(state, action: PayloadAction<number | undefined>) {
            state.weightKg = action.payload;
        },
        setUnitsCount(state, action: PayloadAction<number | undefined>) {
            state.unitsCount = action.payload;
        },
        setScaleData(
            state,
            action: PayloadAction<{
                weightKg: number;
                isScaleConnected: boolean;
                isScaleError: boolean;
            }>
        ) {
            state.weightKg = action.payload.weightKg;
            state.isScaleConnected = action.payload.isScaleConnected;
            state.isScaleError = action.payload.isScaleError;
        },
    },
});

export const { setWeight, setUnitsCount, setScaleData } = scaleSlice.actions;
export default scaleSlice.reducer;
