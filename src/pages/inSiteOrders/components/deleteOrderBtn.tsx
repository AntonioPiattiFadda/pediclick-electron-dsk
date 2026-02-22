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
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/stores/store"
import { setOrders, setOrderItems, setActiveOrder, resetAfterOrderCreation } from "@/stores/orderSlice"
import { cancelOrder } from "@/service/orders"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

export function DeleteOrderBtn({ orderId }: {
    orderId: number;
}) {
    const dispatch = useDispatch<AppDispatch>()
    const orders = useSelector((state: RootState) => state.order.orders)
    const orderItems = useSelector((state: RootState) => state.order.orderItems)
    const [open, setOpen] = useState(false)

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
            toast.success("Orden Cancelada con éxito", {
                description: "Se notificara la cancelación de la orden",
            })
            const filteredOrders = orders.filter(o => o.order_id !== orderId);
            dispatch(setOrders(filteredOrders));
            dispatch(setActiveOrder(filteredOrders[0]?.order_id.toString() || ""));
            dispatch(setOrderItems(orderItems.filter(oi => oi.order_id !== orderId)));
            dispatch(resetAfterOrderCreation());
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
            console.error("Error al cancelar la orden", e)
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
