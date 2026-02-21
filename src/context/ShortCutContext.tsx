import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

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

    // Stable callbacks — itemsRef.current is mutable, no deps needed
    const register = useCallback((item: FocusItem) => {
        itemsRef.current = [
            ...itemsRef.current.filter(i => i.id !== item.id),
            item,
        ];
    }, []);

    const unregister = useCallback((id: string) => {
        itemsRef.current = itemsRef.current.filter(i => i.id !== id);
    }, []);

    const handleFocusWithOrderNumber = useCallback((order: number) => {
        const item = itemsRef.current.find(i => i.order === order);
        item?.ref.current?.focus();
        item?.ref.current?.select();
    }, []);

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
                return;
            }

            if (index === -1) {
                if (itemsRef.current.length === 0) return;
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const first = itemsRef.current[0]?.ref.current;
                    first?.focus();
                    first?.select();
                }
                return;
            }

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

    // Stable value — only changes if the callbacks above change (they never do)
    const value = useMemo(
        () => ({ register, unregister, handleFocusWithOrderNumber }),
        [register, unregister, handleFocusWithOrderNumber]
    );

    return (
        <ShortCutContext.Provider value={value}>
            {children}
        </ShortCutContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useShortCutContext = () => useContext(ShortCutContext);
