import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrdersByTerminalSession, getOrderDetail } from "@/service/orders";
import { OrderItem } from "@/types/orderItems";
import { Payment, PaymentMethod } from "@/types/payments";
import { OrderStatus, PaymentStatus } from "@/types/orders";
import usePrinter from "@/hooks/usePrinter";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n || 0);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

const paymentMethodLabel: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta de crédito",
  DEBIT_CARD: "Tarjeta de débito",
  BANK_TRANSFER: "Transferencia",
  MOBILE_PAYMENT: "Pago móvil",
  CHECK: "Cheque",
  ON_CREDIT: "Cuenta corriente",
  CRYPTO: "Cripto",
  OVERPAYMENT: "Vuelto",
};

const orderStatusLabel: Record<OrderStatus, string> = {
  NEW: "Nueva",
  PROCESSING: "En proceso",
  DELIVERED: "Entregada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  RETURNED: "Devuelta",
  DELIVERING: "En camino",
};

const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pago pendiente",
  PAID: "Pagado",
  PARTIALLY_PAID: "Pago parcial",
  REFUNDED: "Devuelto",
  PARTIALLY_REFUNDED: "Dev. parcial",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terminalSessionId: number;
}

export default function OrderHistoryDialog({ open, onOpenChange, terminalSessionId }: Props) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { handlePrintTicket } = usePrinter();

  const ordersQuery = useQuery({
    queryKey: ["session-orders", terminalSessionId],
    queryFn: () => getOrdersByTerminalSession(terminalSessionId),
    enabled: open && !!terminalSessionId,
  });

  const detailQuery = useQuery({
    queryKey: ["order-detail", selectedOrderId],
    queryFn: () => getOrderDetail(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const detail = detailQuery.data;

  const handlePrint = () => {
    if (!detail) return;
    handlePrintTicket({
      order: detail,
      orderItems: detail.order_items ?? [],
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelectedOrderId(null);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto pb-14">
        <DialogHeader>
          <DialogTitle>Historial de órdenes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Order selector ── */}
          {ordersQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando órdenes...</span>
            </div>
          ) : (
            <Select
              value={selectedOrderId?.toString() ?? ""}
              onValueChange={(v) => setSelectedOrderId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná una orden..." />
              </SelectTrigger>
              <SelectContent>
                {ordersQuery.data?.map((order) => (
                  <SelectItem key={order.order_id} value={order.order_id.toString()}>
                    #{order.order_number} — {formatCurrency(order.total_amount)} — {formatDate(order.created_at)}
                  </SelectItem>
                ))}
                {ordersQuery.data?.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No hay órdenes en esta sesión
                  </div>
                )}
              </SelectContent>
            </Select>
          )}

          {/* ── Detail loading ── */}
          {detailQuery.isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando detalle...</span>
            </div>
          )}

          {/* ── Order detail ── */}
          {detail && (
            <div className="space-y-4">
              {/* Status badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">
                  {orderStatusLabel[detail.order_status as OrderStatus] ?? detail.order_status}
                </Badge>
                <Badge variant="outline">
                  {paymentStatusLabel[detail.payment_status as PaymentStatus] ?? detail.payment_status}
                </Badge>
              </div>

              {/* Client info */}
              {detail.client && (
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                  <p className="text-sm font-semibold">{detail.client.full_name}</p>
                  {detail.client.phone && (
                    <p className="text-sm text-muted-foreground">{detail.client.phone}</p>
                  )}
                  {detail.client.email && (
                    <p className="text-sm text-muted-foreground">{detail.client.email}</p>
                  )}
                  {detail.client.document_number && (
                    <p className="text-sm text-muted-foreground">
                      Doc: {detail.client.document_number}
                    </p>
                  )}
                </div>
              )}

              {/* Payments */}
              {detail.payments?.length > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Pagos</p>
                  {detail.payments.map((p: Payment) => (
                    <div key={p.payment_id} className="flex justify-between text-sm">
                      <span>{paymentMethodLabel[p.payment_method] ?? p.payment_method}</span>
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium">Total pagado</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        detail.payments
                          .filter((p: Payment) => p.payment_method !== "OVERPAYMENT")
                          .reduce((sum: number, p: Payment) => sum + p.amount, 0),
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Items table */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Producto</th>
                      <th className="text-right px-3 py-2 font-medium">Cant.</th>
                      <th className="text-right px-3 py-2 font-medium">Precio</th>
                      <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.order_items?.map((item: OrderItem) => (
                      <tr key={item.order_item_id} className="border-t">
                        <td className="px-3 py-2">
                          <p>{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.product_presentation_name}
                          </p>
                        </td>
                        <td className="text-right px-3 py-2">{item.quantity}</td>
                        <td className="text-right px-3 py-2">{formatCurrency(item.price)}</td>
                        <td className="text-right px-3 py-2">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td colSpan={3} className="text-right px-3 py-2 font-medium">
                        Total
                      </td>
                      <td className="text-right px-3 py-2 font-semibold">
                        {formatCurrency(detail.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Print button */}
              <div className="flex justify-end">
                <Button onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Reimprimir ticket
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
