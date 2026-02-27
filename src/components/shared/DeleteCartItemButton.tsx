import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { OrderItem } from "@/types/orderItems"
import { Trash2 } from "lucide-react"
import React from "react"

export function DeleteCartItemButton({ items, orderItems, setOrderItems }: {
    items: OrderItem[]
    orderItems: OrderItem[]
    setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>
}) {

    const handleDelete = () => {
        const newOrderItems = [...orderItems];

        for (const itemData of items) {
            const idx = newOrderItems.findIndex(it => it === itemData);
            if (idx === -1) continue;

            newOrderItems.splice(idx + 1, 0, {
                ...newOrderItems[idx],
                quantity: newOrderItems[idx].quantity * -1,
                price: newOrderItems[idx].price * -1,
                subtotal: newOrderItems[idx].subtotal * -1,
                total: newOrderItems[idx].total * -1,
                status: 'CANCELLED'
            });

            newOrderItems[idx] = {
                ...newOrderItems[idx],
                status: 'CANCELLED'
            };
        }

        setOrderItems(newOrderItems);
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                >
                    <Trash2 className="w-5 h-5" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Eliminar {items[0]?.product_name} de la orden.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
