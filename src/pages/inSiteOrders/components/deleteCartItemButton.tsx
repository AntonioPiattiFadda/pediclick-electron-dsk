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
import { useOrderContext } from "@/context/OrderContext"
import { OrderItem } from "@/types/orderItems"
import { Trash2 } from "lucide-react"

export function DeleteCartItemButton({ itemData }: {
    itemData: OrderItem
}) {

    const { orderItems, setOrderItems } = useOrderContext()

    const handleDelete = () => {
        const itemToDeleteIndex = orderItems.findIndex(it => it === itemData);

        if (itemToDeleteIndex > -1) {
            // Clonamos el array para no mutar el original
            const newOrderItems = [...orderItems];



            // Insertamos después del índice encontrado
            newOrderItems.splice(itemToDeleteIndex + 1, 0, {
                ...itemData,
                quantity: itemData.quantity * -1,
                price: itemData.price * -1,
                subtotal: itemData.subtotal * -1,
                total: itemData.total * -1,
                status: 'CANCELLED'
            });

            newOrderItems[itemToDeleteIndex] = {
                ...itemData,
                status: 'CANCELLED'
            };

            console.log("New order items after insertion:", newOrderItems);

            setOrderItems(newOrderItems);

        }

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
                        Eliminar {itemData.product_name} de la orden.
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
