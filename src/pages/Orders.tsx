
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrderContext } from "@/context/OrderContext";
import { ScaleProvider } from "@/context/ScaleContext";
import { startEmptyOrder } from "@/service/orders";
import { OrderT } from "@/types/orders";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import Selling from "./selling/selling";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { useEffect, useRef } from "react";
import { RefButton } from "@/components/ui/refButton";


export function Orders() {
    const { orders, setOrders, activeOrder, setactiveOrder } = useOrderContext();

    const { handleGetLocationId } = useGetLocationData();

    const queryClient = useQueryClient();

    const startOrderMutation = useMutation({
        mutationFn: async () => {
            return await startEmptyOrder(handleGetLocationId());
        },
        onSuccess: (data) => {
            if (import.meta.env.DEV) console.log("Orden iniciada:", data)
            setOrders([...orders, { ...data } as OrderT])
            setactiveOrder((data as OrderT).order_id.toString());
            queryClient.invalidateQueries({ queryKey: ["orders"] })
        },
        onError: (e) => {
            console.error("Error iniciando orden vacía", e)
        },
    })

    const handleAddTab = () => {
        if (startOrderMutation.isPending) return;
        startOrderMutation.mutate();
    };

    const handleChangeOrder = (updatedOrder: OrderT) => {
        const orderIndex = orders.findIndex(o => o.order_id === updatedOrder.order_id);
        if (orderIndex !== -1) {
            const updatedOrders = [...orders];
            updatedOrders[orderIndex] = updatedOrder;
            setOrders(updatedOrders);
        } else {
            setOrders([...orders, updatedOrder]);
        }
    };

    const initiateOrderBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (startOrderMutation.isPending) return;
            if (e.key === "F8") {
                e.preventDefault();
                initiateOrderBtnRef.current?.click();
                return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    return (
        <ScaleProvider>
            <Tabs value={activeOrder} onValueChange={(newValue) => {
                if (startOrderMutation.isPending) return;
                setactiveOrder(newValue);
            }} className="w-full">
                <TabsList className="flex items-center gap-1 mt-4 ml-4 h-[43px]">
                    {orders.map((order, index) => (
                        <TabsTrigger
                            key={order.order_id}
                            value={order.order_id.toString()}>
                            {`Orden ${index + 1}`}
                        </TabsTrigger>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-md"
                        onClick={handleAddTab}
                    >
                        {startOrderMutation.isPending ? <Spinner /> : <PlusCircle />}

                    </Button>
                </TabsList>

                {orders.length === 0 && (
                    <div className="w-full flex items-center justify-center h-full absolute top-0 left-0 bg-background/70 z-10">
                        <RefButton
                            onClick={() => startOrderMutation.mutate()}
                            disabled={startOrderMutation.isPending}
                            btnRef={initiateOrderBtnRef}
                        >
                            {startOrderMutation.isPending ? "Iniciando..." :
                                "Iniciar orden"
                            }
                        </RefButton>
                        {/* <Button
                            ref={initiateOrderBtnRef}
                            onClick={() => startOrderMutation.mutate()} disabled={startOrderMutation.isPending}>

                        </Button> */}
                    </div>
                )}

                {orders.map((order) => (
                    <TabsContent key={order.order_id} value={order.order_id.toString()} >
                        <Selling order={order} onChangeOrder={(updatedOrder: OrderT) => {
                            handleChangeOrder(updatedOrder)
                        }} />
                    </TabsContent>
                ))}
            </Tabs>
        </ScaleProvider>
    );
}
