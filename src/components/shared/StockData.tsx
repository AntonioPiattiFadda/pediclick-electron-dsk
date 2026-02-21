
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import type { Stock } from "@/types/stocks"
import { Info } from "lucide-react"

export function StockData({
    stock
}: {
    stock: Stock | null
}) {
    if (!stock) {
        return null
    }

    return (
        <Dialog>
            <form>
                <DialogTrigger asChild>
                    <button className="cursor-pointer">
                        <Info width={12} height={12} />
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Stock</DialogTitle>
                    </DialogHeader>
                    <Table className="rounded-lg border">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">Stock Total</TableHead>
                                <TableHead className="text-center">Reservado para venta</TableHead>
                                <TableHead className="text-center">Reservado para transferir</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow >
                                <TableCell className="text-center">{stock.quantity || 0}</TableCell>
                                <TableCell className="text-center">{stock.reserved_for_selling_quantity || 0}</TableCell>
                                <TableCell className="text-center">{stock.reserved_for_transferring_quantity || 0}</TableCell>
                            </TableRow>
                        </TableBody>
                        {/* <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3}>Total</TableCell>
                                <TableCell className="text-right">$2,500.00</TableCell>
                            </TableRow>
                        </TableFooter> */}
                    </Table>

                </DialogContent>
            </form>
        </Dialog>
    )
}
