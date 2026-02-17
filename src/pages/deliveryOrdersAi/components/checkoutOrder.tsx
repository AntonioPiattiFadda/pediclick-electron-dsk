import { MoneyInput } from "@/components/shared/MoneyInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefButton } from "@/components/ui/refButton";
import { emptyPayments, paymentMethodOpt, } from "@/constants";
import { useOrderContext } from "@/context/OrderContext";
import { useDeliveryOrderAiContext } from "@/context/DeliveryOrderAiContext";
import { CheckOutOptions } from "@/types";
import { Payment } from "@/types/payments";
import { OrderT } from "@/types/orders";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    n || 0
  );

export default function CheckoutOrder({
  onConfirm,
  isLoading,
  order,
  onChangeOrder,
  hasClient,
  checkOutOptions,
  onChangeOptions
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onConfirm?: (orderPayments: any[]) => Promise<void>;
  isLoading: boolean;
  order: OrderT,
  onChangeOrder: (order: OrderT) => void,
  hasClient: boolean,
  checkOutOptions: CheckOutOptions;
  onChangeOptions: (options: CheckOutOptions) => void;
}) {

  const { isCheckOutOpen, setIsCheckOutOpen } = useOrderContext();
  const { orderItems } = useDeliveryOrderAiContext();

  const items = useMemo(
    () =>
      orderItems
        .filter((it) => it.order_id === order.order_id)
        .map((it) => ({
          product_id: it.product_id,
          product_name: it.product_name,
          quantity: Number(it.quantity ?? 0),
          price: Number(it.price ?? 0),
          subtotal: Number(it.subtotal ?? 0),
          total_price: Number(it.total ?? 0),
        })),
    [orderItems]
  );

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (it.total_price || 0), 0);
    return { subtotal, total: subtotal, itemCount: items.length };
  }, [items]);

  const [payments, setPayments] = useState<Pick<Payment, "payment_method" | "amount">[]>(emptyPayments);

  useEffect(() => {
    if (!hasClient) {
      // If no client, remove ON_CREDIT payment method
      setPayments((prev) => prev.filter(p => p.payment_method !== 'ON_CREDIT'));
    } else {
      if (!payments.find(p => p.payment_method === 'ON_CREDIT')) {
        // If has client, ensure ON_CREDIT payment method is present
        setPayments((prev) => [...prev, { payment_method: 'ON_CREDIT', amount: 0 }]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasClient]);

  const paidSum = useMemo(() => payments.reduce((s, p) => s + Number(p.amount || 0), 0), [payments]);
  const remaining = useMemo(() => Number(Number(totals.total || 0) - paidSum).toFixed(2), [totals.total, paidSum]);
  const remainingToShow = Number(remaining) < 0 ? 0 : Number(remaining);
  const changeOrCredit = Number(remaining) < 0 ? Math.abs(Number(remaining)) : 0;

  const handleConfirm = async () => {
    try {
      if (Number(remaining) > 0 || payments.length === 0) {
        throw new Error("El total pagado no coincide con el total de la orden.");
      }

      if (onConfirm) {
        const orderPayments = payments.map((p) => ({
          order_id: order.order_id || 0,
          payment_method: p.payment_method,
          amount: Number(p.amount || 0),
        }));
        await onConfirm(orderPayments);
      }
      setIsCheckOutOpen(false);
    } catch (err) {
      console.error("Error al confirmar checkout", err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleAssignRest = (paymentMethod: string) => {
    const selectedPayAmount = payments.find(p => p.payment_method === paymentMethod)?.amount || 0;
    const rest = Number(remaining + Number(selectedPayAmount || 0)).toFixed(2)

    setPayments((prev) =>
      prev.map((pay) =>
        pay.payment_method === paymentMethod ? { ...pay, amount: Number(rest) } : pay
      )
    );
  }

  const clientAvailableCredit = order?.client?.available_credit || 0;

  const showChangeOpt = (changeOrCredit > 0) && hasClient;

  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmOrderRef = useRef<HTMLButtonElement | null>(null);

  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingActionRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {


      if (e.key === "Enter") {
        e.preventDefault();

        // 👉 Segundo Enter dentro del tiempo → EJECUTA
        if (pendingActionRef.current) {
          if (pendingTimeoutRef.current) {
            clearTimeout(pendingTimeoutRef.current);
          }

          pendingActionRef.current = false;
          pendingTimeoutRef.current = null;

          if (isCheckOutOpen) {
            confirmOrderRef.current?.click(); // ✅ acción confirmada
          } else {
            addButtonRef.current?.click(); // ✅ acción confirmada
          }

          return;
        }

        // 👉 Primer Enter → queda esperando
        pendingActionRef.current = true;

        pendingTimeoutRef.current = setTimeout(() => {
          // ⏱️ Si no hubo segundo Enter, se cancela silenciosamente
          pendingActionRef.current = false;
          pendingTimeoutRef.current = null;
        }, 300);
      } else {

        const isKeySomePaymentShortcut = paymentMethodOpt.find(opt => opt.keyCode === e.key);
        console.log("isKeySomePaymentShortcut", isKeySomePaymentShortcut);
        if (isKeySomePaymentShortcut) {
          e.preventDefault();

          console.log("isKeySomePaymentShortcut", isKeySomePaymentShortcut.value);
          handleAssignRest(isKeySomePaymentShortcut.value);
        }

      }



    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);

  }, [handleAssignRest, isCheckOutOpen]);

  const isDelivery = order.order_type === 'DELIVERY';


  return (
    <Dialog open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
      <DialogTrigger asChild>
        <RefButton
          disabled={orderItems.length === 0}
          btnRef={addButtonRef}
        >
          {isDelivery ? "Registrar pedido" : "Finalizar compra"}
        </RefButton>
        {/* <Button disabled={orderItems.length === 0}>Finalizar compra</Button> */}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="flex flex-row justify-between">
          <div>
            <DialogTitle>{isDelivery ? "Registrar pedido" : "Finalizar compra"}</DialogTitle>
            <DialogDescription>
              Revise los items y complete los datos  antes de generar <br /> {
                isDelivery ? "el pedido." : "la orden y el ticket."
              }
            </DialogDescription>
          </div>
          <div className="space-y-1.5 mr-4">

            <Input
              id="date"
              type="date"
              value={order.created_at ? order.created_at.split("T")[0] : ""}
              onChange={(e) => onChangeOrder({ ...order, created_at: e.target.value })}
            />
          </div>


        </DialogHeader>

        <div className="space-y-4">

          <div className="mt-2 flex gap-2">
            <Label>Opciones:</Label>
            <div className="flex gap-2">
              <Checkbox checked={checkOutOptions.printTicket} onCheckedChange={(e) => onChangeOptions({ ...checkOutOptions, printTicket: e as boolean })} />
              <Label className="text-xs font-normal">Imprimir ticket</Label>
            </div>


            {showChangeOpt &&
              (
                <div className="flex gap-2">
                  <Checkbox checked={checkOutOptions.registerPositiveCredit} onCheckedChange={(e) => onChangeOptions({ ...checkOutOptions, registerPositiveCredit: e as boolean })} />
                  <Label className="text-xs font-normal">Saldo a favor (no dar cambio)</Label>
                </div>
              )
            }
          </div>
          {/* <div className="border rounded-md">
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
                    {formatCurrency(it.price)}
                  </div>
                  <div className="col-span-2 text-right">
                    {formatCurrency(it.subtotal)}
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
          </div> */}

          <div className="mt-2 space-y-2">
            <Label>Pagos</Label>

            {/* {payments.find(p => p.payment_method === 'ON_CREDIT')?.amount} */}

            {payments.map((p, idx) => {
              return (<div key={idx} className="grid grid-cols-10 gap-2 items-center">
                <div>
                  <Input
                    value={paymentMethodOpt.find((o) => o.value === p.payment_method)?.keyCode || ''}
                    disabled
                  />

                </div>
                <div className="col-span-4">
                  <Input
                    value={paymentMethodOpt.find((o) => o.value === p.payment_method)?.label || ''}
                    disabled
                  />

                </div>

                <div className="col-span-4">
                  <MoneyInput
                    value={p.amount || undefined}
                    onChange={(v) => {
                      const numberValue = Number(v);

                      if (p.payment_method === 'ON_CREDIT' && numberValue > clientAvailableCredit) {
                        toast.error('Limite de credito para cliente alcanzado: ' + formatCurrency(clientAvailableCredit))
                        return
                      }

                      if (numberValue < 0) {
                        setPayments((prev) =>
                          prev.map((pay, i) =>
                            i === idx ? { ...pay, amount: 0 } : pay
                          )
                        );
                        return;
                      }

                      setPayments((prev) =>
                        prev.map((pay, i) =>
                          i === idx ? { ...pay, amount: numberValue } : pay
                        )
                      );
                    }}
                  />
                  {/* <InputGroup>
                    <InputGroupInput
                      type="number"
                    />
                    <InputGroupAddon>
                      $
                    </InputGroupAddon>
                  </InputGroup> */}

                  {/* <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={p.amount ?? 0}
                    onChange={(e) => {
                      const amount = Number(e.target.value || 0);
                      console.log(amount)
                      setPayments((prev) =>
                        prev.map((pay, i) =>
                          i === idx ? { ...pay, amount } : pay
                        )
                      );
                    }}
                  /> */}
                </div>

                <div className="col-span-1">
                  <Button
                    onClick={() => handleAssignRest(p.payment_method)}
                    size={'icon'}
                    variant={'ghost'}
                    className="col-span-1 cursor-pointer"
                    disabled={Number(remaining) <= 0}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>)
            })}

            <div className="flex flex-col justify-between  text-sm">
              <div>
                Restante:{" "}
                <span className={Number(remaining) === 0 ? "text-green-600" : "text-amber-600"}>
                  {formatCurrency(remainingToShow)}
                </span>
              </div>
              <div>
                Cambio:{" "}
                <span className={Number(remaining) === 0 ? "text-green-600" : "text-amber-600"}>
                  {formatCurrency(changeOrCredit)}
                </span>
              </div>
              {/* <Button
                variant="secondary"
                type="button"
                onClick={() =>
                  setPayments((prev) => [
                    ...prev,
                    { method: "CASH", amount: Math.max(0, Number(totals.total) - paidSum) },
                  ])
                }
              >
                Agregar pago
              </Button> */}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCheckOutOpen(false)} disabled={isLoading}>
            Volver
          </Button>
          <RefButton
            onClick={handleConfirm}
            btnRef={confirmOrderRef}
            disabled={items.length === 0 || isLoading || payments.length === 0 || Number(remaining) > 0}
          >
            {isLoading ? "Generando..." : "Generar orden y ticket"}
          </RefButton>
          {/* <Button

          >

          </Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}
