import React, { createContext, useContext, useEffect, useRef } from "react";

type FocusItem = {
    id: string;
    ref: React.RefObject<HTMLInputElement>;
    order: number;
};

type ShortCutContextType = {
    register: (item: FocusItem) => void;
    unregister: (id: string) => void;
    handleFocusWithOrderNumber: (order: number) => void;
};

const ShortCutContext = createContext<ShortCutContextType>({
    register: () => { },
    unregister: () => { },
    handleFocusWithOrderNumber: () => { },
});

export const ShortCutProvider = ({ children }: { children: React.ReactNode }) => {

    const itemsRef = useRef<FocusItem[]>([]);


    const register = (item: FocusItem) => {
        itemsRef.current = [
            ...itemsRef.current.filter(i => i.id !== item.id),
            item,
        ]
        // .sort((a, b) => a.order - b.order);
    };

    const unregister = (id: string) => {
        itemsRef.current = itemsRef.current.filter(i => i.id !== id);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;

            const index = itemsRef.current.findIndex(
                i => i.ref.current === active
            );

            if (e.key === "Enter") {
                e.preventDefault();
                console.log("itemsRef.current", itemsRef.current.length);
                console.log("itemsRef.current", itemsRef.current);
                // const first = itemsRef.current[0]?.ref.current;
                // first?.focus();
                // first?.select();
                return;
            }


            // 🟢 NUEVO: si no hay ningún input enfocado
            if (index === -1) {

                if (itemsRef.current.length === 0) return;
                console.log("itemsRef.current", itemsRef.current.length);
                console.log("itemsRef.current", itemsRef.current);
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    console.log("itemsRef.current", itemsRef.current.length);
                    console.log("itemsRef.current", itemsRef.current);
                    const first = itemsRef.current[0]?.ref.current;
                    first?.focus();
                    first?.select();
                }

                return;
            }


            console.log("itemsRef.current", itemsRef.current.length);
            console.log("itemsRef.current", itemsRef.current);

            // 🔽 navegación normal
            if (e.key === "ArrowDown") {
                e.preventDefault();
                const next = itemsRef.current[index + 1]?.ref.current;
                next?.focus();
                next?.select();
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();

                const prev = itemsRef.current[index - 1]?.ref.current;
                prev?.focus();
                prev?.select();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleFocusWithOrderNumber = (order: number) => {
        const item = itemsRef.current.find(i => i.order === order);
        item?.ref.current?.focus();
        item?.ref.current?.select();
    };

    return (
        <ShortCutContext.Provider value={{ register, unregister, handleFocusWithOrderNumber }}>
            {children}
        </ShortCutContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useShortCutContext = () => useContext(ShortCutContext);
//