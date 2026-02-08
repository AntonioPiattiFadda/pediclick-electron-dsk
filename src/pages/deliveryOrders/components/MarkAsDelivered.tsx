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
import { updateDeliveredOrderStatus } from "@/service"
import { OrderT } from "@/types/orders"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

export function MarkAsDeliveredButton({ order }: { order: OrderT }) {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    // Only show button for orders that can transition to DELIVERING
    const canMarkAsDelivered = ["DELIVERING"].includes(order.order_status)

    const updateStatusMutation = useMutation({
        mutationFn: async () => {
            return await updateDeliveredOrderStatus(order.order_id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["delivery-orders"] })
            queryClient.invalidateQueries({ queryKey: ["delivery-order", order.order_id] })
            toast.success("Orden marcada como 'Entregado'")
            setOpen(false)
        },
        onError: (e) => {
            console.error("Error al actualizar estado de orden", e)
            toast.error("Error al actualizar el estado de la orden")
        },
    })

    const handleConfirm = async () => {
        try {
            await updateStatusMutation.mutateAsync()
        } catch (e) {
            console.error("Error al marcar como entregado", e)
        }
    }

    // Don't render if order can't transition to DELIVERED
    if (!canMarkAsDelivered) return null

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="secondary"
                    disabled={updateStatusMutation.isPending}
                >
                    Entregar
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        ¿Marcar orden como 'Entregado'?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Orden #{order.order_number}
                        {order.client && ` - ${order.client.full_name}`}
                        <br />
                        Estado actual: {order.order_status === "NEW" ? "Nueva" : "Procesando"}
                        <br />
                        Total: ${Number(order.total_amount).toFixed(2)}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={updateStatusMutation.isPending}>
                        Cancelar
                    </AlertDialogCancel>
                    <Button
                        disabled={updateStatusMutation.isPending}
                        onClick={handleConfirm}
                    >
                        {updateStatusMutation.isPending ? "Actualizando..." : "Confirmar"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
