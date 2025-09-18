import { useMemo, useState } from "react";
import { useOrderContext } from "@/context/OrderContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CheckoutPayload = {
  date: string; // ISO yyyy-mm-dd
  client_id: number | null;
  client_name?: string;
  notes?: string;
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  totals: { subtotal: number; total: number; itemCount: number };
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    n || 0
  );

export default function CheckoutOrder({
  onConfirm,
}: {
  onConfirm?: (payload: CheckoutPayload) => void | Promise<void>;
}) {
  const { orderItems } = useOrderContext();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const items = useMemo(
    () =>
      orderItems.map((it) => ({
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: Number(it.quantity ?? 0),
        unit_price: Number(it.unit_price ?? 0),
        total: Number(it.total_price ?? it.subtotal ?? 0),
      })),
    [orderItems]
  );

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (it.total || 0), 0);
    return { subtotal, total: subtotal, itemCount: items.length };
  }, [items]);

  const handleConfirm = async () => {
    const payload: CheckoutPayload = {
      date,
      client_id: clientId ? Number(clientId) : null,
      client_name: clientName || undefined,
      notes: notes || undefined,
      items,
      totals,
    };

    try {
      if (onConfirm) {
        await onConfirm(payload);
      } else {
        // Placeholder hasta que agregues la función real en /src/service
        // Reemplaza este console.log por tu función futura (por ejemplo: services.purchase.checkout(payload))
        // sin romper el build actual.
        console.log("Checkout payload -> ", payload);
      }
      setOpen(false);
    } catch (err) {
      console.error("Error al confirmar checkout", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={orderItems.length === 0}>Finalizar compra</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar orden de compra</DialogTitle>
          <DialogDescription>
            Revise los items y complete los datos antes de generar la orden y el
            ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clientId">Cliente (ID opcional)</Label>
              <Input
                id="clientId"
                type="number"
                placeholder="Ej: 123"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="clientName">Cliente (nombre)</Label>
              <Input
                id="clientName"
                placeholder="Nombre del cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                placeholder="Observaciones"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-slate-600">
              <div className="col-span-6">Descripción</div>
              <div className="col-span-2 text-right">Cantidad</div>
              <div className="col-span-2 text-right">P. Unit</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <div className="max-h-60 overflow-auto divide-y">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 px-3 py-2 text-sm"
                >
                  <div className="col-span-6 truncate">{it.product_name}</div>
                  <div className="col-span-2 text-right">{it.quantity}</div>
                  <div className="col-span-2 text-right">
                    {formatCurrency(it.unit_price)}
                  </div>
                  <div className="col-span-2 text-right">
                    {formatCurrency(it.total)}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="px-3 py-4 text-sm text-slate-500">
                  Sin items.
                </div>
              )}
            </div>

            <div className="px-3 py-2 border-t flex justify-between text-sm">
              <span>Total</span>
              <span className="font-semibold">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Volver
          </Button>
          <Button onClick={handleConfirm} disabled={items.length === 0}>
            Generar orden y ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
