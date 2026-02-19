import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ScaleContextValue = {
    // Current scale weight in kilograms (mocked for now)
    weightKg: number | undefined;
    setWeightKg: React.Dispatch<React.SetStateAction<number | undefined>>;

    // Units selected by user when sell_measurement_mode === "QUANTITY"
    unitsCount: number | undefined;
    setUnitsCount: React.Dispatch<React.SetStateAction<number | undefined>>;

    // Live connection status from IPC stream
    isScaleConnected: boolean;
    isScaleError: boolean;
};

const ScaleContext = createContext<ScaleContextValue>({
    weightKg: 0,
    setWeightKg: () => { },
    unitsCount: 1,
    setUnitsCount: () => { },
    isScaleConnected: false,
    isScaleError: false,
});

export const ScaleProvider = ({ children }: { children: ReactNode }) => {
    const [weightKg, setWeightKg] = useState<number | undefined>(1);

    const [scaleData, setScaleData] = useState<{
        isScaleConnected: boolean;
        isScaleError: boolean;
    } | null>(null);

    const [unitsCount, setUnitsCount] = useState<number | undefined>(1);

    useEffect(() => {
        window.scaleAPI.onWeight((data) => {
            console.log("Received weight from scaleAPI:", data);
            if (data.isScaleError === scaleData?.isScaleError && data.isScaleConnected === scaleData?.isScaleConnected) {
                return;
            } else {
                console.log("Updating scale connection/error status:", data);
                setScaleData({
                    isScaleConnected: data.isScaleConnected,
                    isScaleError: data.isScaleError,
                });
            }
            if (Number(data.weight) === weightKg) {
                return;
            } else {
                console.log("Updating scale connection/error status:", data);

                setWeightKg(Number(data.weight));
            }



        });
    }, []);

    return (
        <ScaleContext.Provider
            value={{
                weightKg,
                setWeightKg,
                unitsCount,
                setUnitsCount,
                isScaleConnected: scaleData?.isScaleConnected ?? false,
                isScaleError: scaleData?.isScaleError ?? false,
            }}
        >
            {children}
        </ScaleContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useScaleContext = () => useContext(ScaleContext);