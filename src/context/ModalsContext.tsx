import React, { createContext, useContext, useState } from "react";


type ModalsContextType = {
    clientPaymentModalOpen: boolean;
    setClientPaymentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ModalsContext = createContext<ModalsContextType>({
    clientPaymentModalOpen: false,
    setClientPaymentModalOpen: () => { },
});

export const ModalsProvider = ({ children }: { children: React.ReactNode }) => {
    const [clientPaymentModalOpen, setClientPaymentModalOpen] = useState(false);

    return (
        <ModalsContext.Provider value={{ clientPaymentModalOpen, setClientPaymentModalOpen }}>
            {children}
        </ModalsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useModalsContext = () => useContext(ModalsContext);
