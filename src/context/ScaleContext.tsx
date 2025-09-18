import React, { createContext, useContext, useState, type ReactNode } from "react";

type ScaleContextValue = {
    // Current scale weight in kilograms (mocked for now)
    weightKg: number;
    setWeightKg: React.Dispatch<React.SetStateAction<number>>;

    // Units selected by user when sell_measurement_mode === "QUANTITY"
    unitsCount: number;
    setUnitsCount: React.Dispatch<React.SetStateAction<number>>;
};

const ScaleContext = createContext<ScaleContextValue>({
    weightKg: 0,
    setWeightKg: () => { },
    unitsCount: 1,
    setUnitsCount: () => { },
});

export const ScaleProvider = ({ children }: { children: ReactNode }) => {
    const [weightKg, setWeightKg] = useState<number>(0);
    const [unitsCount, setUnitsCount] = useState<number>(1);

    return (
        <ScaleContext.Provider
            value={{
                weightKg,
                setWeightKg,
                unitsCount,
                setUnitsCount,
            }}
        >
            {children}
        </ScaleContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useScaleContext = () => useContext(ScaleContext);