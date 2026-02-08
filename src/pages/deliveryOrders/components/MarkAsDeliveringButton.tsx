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
import { updateDeliveryOrderStatus } from "@/service"
import { OrderT } from "@/types/orders"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

export function MarkAsDeliveringButton({ order }: { order: OrderT }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  // Only show button for orders that can transition to DELIVERING
  const canMarkAsDelivering = ["NEW", "PROCESSING"].includes(order.order_status)

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      return await updateDeliveryOrderStatus(order.order_id, "DELIVERING")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] })
      queryClient.invalidateQueries({ queryKey: ["delivery-order", order.order_id] })
      toast.success("Orden marcada como 'En reparto'")
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
      console.error("Error al marcar como en reparto", e)
    }
  }

  // Don't render if order can't transition to DELIVERING
  if (!canMarkAsDelivering) return null

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="secondary"
          disabled={updateStatusMutation.isPending}
        >
          En reparto
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Marcar orden como 'En reparto'?
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
