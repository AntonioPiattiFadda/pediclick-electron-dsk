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
import CheckBoxesSelector from "../shared/checkBoxesSelector";
import { ClientSelector } from "../shared/clientSelector";
import { ClientType } from "@/types/orders";


const clientTypeOptions: {
  label: string;
  value: ClientType;
}[] = [
    { label: "Consumidor final", value: "FINAL" },
    { label: "Registrado", value: "REGISTERED" }
  ];


const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    n || 0
  );

export default function CheckoutOrder({
  onConfirm,
  isLoading
}: {
  onConfirm?: () => void | Promise<void>;
  isLoading: boolean;
}) {
  const { orderItems, setOrder, order } = useOrderContext();

  const [open, setOpen] = useState(false);

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


    try {
      if (onConfirm) {
        await onConfirm();
      } else {
        // Placeholder hasta que agregues la función real en /src/service
        // Reemplaza este console.log por tu función futura (por ejemplo: services.purchase.checkout(payload))
        // sin romper el build actual.
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

        <CheckBoxesSelector
          options={clientTypeOptions}
          selectedOption={order.client_type || null}
          onSelectOption={v => setOrder({ ...order, client_type: v as typeof order.client_type })}
          disabled={false}
        />

        {order.client_type === "REGISTERED" && (
          <ClientSelector
            value={order.client_id ?? null}
            onChange={v => setOrder({ ...order, client_id: v ? Number(v) : null })}
            disabled={false}
          />
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={order.created_at}
                onChange={(e) => setOrder({ ...order, created_at: e.target.value })}
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
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Volver
          </Button>
          <Button onClick={handleConfirm} disabled={items.length === 0 || isLoading}>
            {isLoading ? "Generando..." : "Generar orden y ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
