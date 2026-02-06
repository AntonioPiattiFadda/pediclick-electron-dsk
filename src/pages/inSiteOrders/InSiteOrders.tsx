
import { Button } from "@/components/ui/button";
import { RefButton } from "@/components/ui/refButton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrderContext } from "@/context/OrderContext";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { startEmptyOrder } from "@/service/orders";
import { OrderT } from "@/types/orders";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import Order from "./Order";
import { useTerminalSessionData } from "@/hooks/useTerminalSessionData";


export function InSiteOrders() {
    const { orders, setOrders, activeOrder, setactiveOrder } = useOrderContext();

    const { handleGetLocationId } = useGetLocationData();

    const { handleGetTerminalSessionId } = useTerminalSessionData();

    const queryClient = useQueryClient();

    const startOrderMutation = useMutation({
        mutationFn: async () => {
            const terminalSessionId = await handleGetTerminalSessionId();
            return await startEmptyOrder(handleGetLocationId(), terminalSessionId);
        },
        onSuccess: (data) => {
            if (import.meta.env.DEV) console.log("Orden iniciada:", data)
            setOrders([...orders, { ...data, order_type: "DIRECT_SALE" } as OrderT])
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

    const filteredOrders = orders.filter(order => order.order_type === "DIRECT_SALE");

    return (

        <Tabs value={activeOrder} onValueChange={(newValue) => {
            if (startOrderMutation.isPending) return;
            setactiveOrder(newValue);
        }} className="w-full">
            <div className="w-full  flex justify-between items-center px-4">
                <h1 className="text-2xl">Ordenes de compra</h1>
                <TabsList className="flex items-center gap-1 mt-4  h-[43px]">
                    {filteredOrders.map((order, index) => (
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



            </div>



            {filteredOrders.length === 0 && (
                <div className="w-full flex items-center justify-center h-[80%] absolute top-0 left-0 bg-background/70 translate-y-18 z-10">
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

            {filteredOrders.map((order) => (
                <TabsContent key={order.order_id} value={order.order_id.toString()} >
                    <Order
                        order={order}
                        onChangeOrder={(updatedOrder: OrderT) => {
                            handleChangeOrder(updatedOrder)
                        }} />
                </TabsContent>
            ))}
        </Tabs>
    );
}
