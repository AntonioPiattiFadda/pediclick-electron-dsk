import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useOrderContext } from "@/context/OrderContext"
import { cancelOrder } from "@/service/orders"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

export function DeleteOrderBtn({ orderId }: {
    orderId: number;
}) {
    const { orderItems, setOrderItems, orders, setOrders, setactiveOrder, activeOrder, resetAfterOrderCreation } = useOrderContext()
    const [open, setOpen] = useState(false)

    console.log("Orden activeOrder:", activeOrder)
    console.log("Orden orders:", orders)

    const queryClient = useQueryClient();


    const cancelOrderMutation = useMutation({
        mutationFn: async () => {
            const orderToDelete = orders.find(o => o.order_id === orderId);
            if (!orderToDelete) {
                throw new Error("Order not found");
            }
            const orderItemsToDelete = orderItems.filter(oi => oi.order_id === orderId);
            return await cancelOrder(orderToDelete, orderItemsToDelete);
        },
        onSuccess: (orderId) => {
            if (import.meta.env.DEV) console.log("Orden cancelada:", orderId)
            queryClient.invalidateQueries({ queryKey: ["orders"] })
            toast.success("Orden Cancelada con éxito")
            const filteredOrders = orders.filter(o => o.order_id !== orderId);
            setOrders(filteredOrders);
            setactiveOrder(filteredOrders[0]?.order_id.toString() || "");
            const filteredOrderItems = orderItems.filter(oi => oi.order_id !== orderId);
            setOrderItems(filteredOrderItems);
            resetAfterOrderCreation();
            setOpen(false);
        },
        onError: (e) => {
            console.error("Error al cancelar la orden", e)
            toast.error("Error al cancelar la orden")
        },
    })

    const handleCancelOrder = async () => {
        try {
            await cancelOrderMutation.mutateAsync()
        } catch (e) {
            console.error("Error al crear la orden", e)
        }
    }

    const hasNoOrderItems = orderItems.filter(oi => oi.order_id === orderId).length === 0;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    disabled={hasNoOrderItems}
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                >
                    Cancelar orden
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Seguro que deseas eliminar la orden?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={cancelOrderMutation.isPending}>No</AlertDialogCancel>
                    <Button disabled={cancelOrderMutation.isPending} onClick={handleCancelOrder}>{cancelOrderMutation.isPending ? "Cancelando Orden..." : "Sí"}</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
