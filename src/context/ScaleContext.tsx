import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setScaleData } from "@/stores/scaleSlice";
import type { AppDispatch } from "@/stores/store";

/**
 * Subscribes to the Electron IPC scale stream and dispatches updates to Redux.
 * Renders nothing — place this once inside the Redux Provider.
 */
export const ScaleIpcBridge = () => {
    const dispatch = useDispatch<AppDispatch>();
    const lastRef = useRef<{ weight: number; isConnected: boolean; isError: boolean } | null>(null);

    useEffect(() => {
        window.scaleAPI.onWeight((data) => {
            const weight = Number(Number(data.weight).toFixed(3));
            const last = lastRef.current;

            if (
                last &&
                last.weight === weight &&
                last.isConnected === data.isScaleConnected &&
                last.isError === data.isScaleError
            ) {
                return;
            }

            lastRef.current = {
                weight,
                isConnected: data.isScaleConnected,
                isError: data.isScaleError,
            };

            dispatch(
                setScaleData({
                    weightKg: weight,
                    isScaleConnected: data.isScaleConnected,
                    isScaleError: data.isScaleError,
                })
            );
        });
    }, [dispatch]);

    return null;
};
