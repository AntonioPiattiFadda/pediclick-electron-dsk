import React, { createContext, useContext, useState } from "react";


type ModalsContextType = {
    clientPaymentModalOpen: boolean;
    setClientPaymentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    terminalSessionClosure: boolean;
    setTerminalSessionClosure: React.Dispatch<React.SetStateAction<boolean>>;
};

const ModalsContext = createContext<ModalsContextType>({
    clientPaymentModalOpen: false,
    setClientPaymentModalOpen: () => { },
    terminalSessionClosure: false,
    setTerminalSessionClosure: () => { }
});

export const ModalsProvider = ({ children }: { children: React.ReactNode }) => {
    const [clientPaymentModalOpen, setClientPaymentModalOpen] = useState(false);
    const [terminalSessionClosure, setTerminalSessionClosure] = useState(false);

    return (
        <ModalsContext.Provider value={{
            clientPaymentModalOpen,
            setClientPaymentModalOpen,
            terminalSessionClosure,
            setTerminalSessionClosure
        }}>
            {children}
        </ModalsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useModalsContext = () => useContext(ModalsContext);
