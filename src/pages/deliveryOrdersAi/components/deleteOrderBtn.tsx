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
import { resetAfterOrderCreation } from "@/stores/orderSlice"
import { clearAiOrder } from "@/stores/deliveryOrderAiSlice"
import { useState } from "react"
import { toast } from "sonner"

export function DeleteOrderBtn({ orderId }: {
    orderId: number;
}) {
    const dispatch = useDispatch<AppDispatch>();
    const orderItems = useSelector((state: RootState) => state.deliveryOrderAi.orderItems);
    const [open, setOpen] = useState(false)

    const handleCancelOrder = () => {
        dispatch(clearAiOrder());
        dispatch(resetAfterOrderCreation());
        toast.success("Orden AI cancelada");
        setOpen(false);
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
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <Button onClick={handleCancelOrder}>Sí</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
