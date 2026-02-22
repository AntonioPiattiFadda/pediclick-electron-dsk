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
import { RefButton } from "@/components/ui/refButton";
import { emptyPayments } from "@/constants";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/stores/store";
import { setDeliveryIsCheckOutOpen } from "@/stores/deliveryOrderSlice";
import { useTerminalSessionData } from "@/hooks/useTerminalSessionData";
import { completeDeliveryOrder, getDeliveryOrderItems } from "@/service";
import { CheckOutOptions } from "@/types";
import { OrderT } from "@/types/orders";
import { Payment } from "@/types/payments";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    n || 0
  );

export function DeliveryCheckout({
  order,
  hasClient,
}: {
  order: OrderT;
  hasClient: boolean;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const isCheckOutOpen = useSelector((state: RootState) => state.deliveryOrder.isCheckOutOpen);
  const setIsCheckOutOpen = (v: boolean) => dispatch(setDeliveryIsCheckOutOpen(v));
  const queryClient = useQueryClient();

  const [checkOutOptions, setCheckOutOptions] = useState<CheckOutOptions>({
    printTicket: false,
    registerPositiveCredit: false,
  });

  // Fetch order items from database
  const { data: orderItems = [] } = useQuery({
    queryKey: ["delivery-order-items", order.order_id],
    queryFn: async () => getDeliveryOrderItems(order.order_id!),
    enabled: !!order.order_id,
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const items = useMemo(
    () =>
      orderItems.map((it) => ({
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

  const [payments, setPayments] = useState<
    Pick<Payment, "payment_method" | "amount">[]
  >(emptyPayments);

  useEffect(() => {
    if (!hasClient) {
      setPayments((prev) =>
        prev.filter((p) => p.payment_method !== "ON_CREDIT")
      );
    } else {
      if (!payments.find((p) => p.payment_method === "ON_CREDIT")) {
        setPayments((prev) => [
          ...prev,
          { payment_method: "ON_CREDIT", amount: 0 },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasClient]);

  const paidSum = useMemo(
    () => payments.reduce((s, p) => s + Number(p.amount || 0), 0),
    [payments]
  );
  const remaining = useMemo(
    () => Number(Number(totals.total || 0) - paidSum).toFixed(2),
    [totals.total, paidSum]
  );
  const remainingToShow = Number(remaining) < 0 ? 0 : Number(remaining);
  const changeOrCredit =
    Number(remaining) < 0 ? Math.abs(Number(remaining)) : 0;

  const completeOrderMutation = useMutation({
    mutationFn: async (orderPayments: Omit<Payment, "payment_id" | "created_at" | "selected">[]) => {
      return await completeDeliveryOrder(order.order_id, orderPayments as Payment[]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["delivery-order", order.order_id],
      });
      toast.success("Orden completada exitosamente");
      setIsCheckOutOpen(false);
    },
    onError: (e) => {
      console.error("Error al completar orden", e);
      toast.error(
        "Error al completar la orden: " +
        (e instanceof Error ? e.message : "Error desconocido")
      );
    },
  });
  const { handleGetTerminalSessionId } = useTerminalSessionData();

  const handleConfirm = async () => {
    try {
      if (Number(remaining) > 0 || payments.length === 0) {
        throw new Error("El total pagado no coincide con el total de la orden.");
      }


      const orderPayments = payments.map((p) => ({
        order_id: order.order_id || 0,
        payment_method: p.payment_method,
        amount: Number(p.amount || 0),
        payment_direction: "IN" as const,
        payment_type: "ORDER" as const,
        client_id: order.client_id || null,
        //TODO Check if provider_id and terminal_session_id are needed here, if not remove from backend
        provider_id: null,
        terminal_session_id: handleGetTerminalSessionId(),
      }));

      await completeOrderMutation.mutateAsync(orderPayments);
    } catch (err) {
      console.error("Error al confirmar checkout", err);
      toast.error(
        err instanceof Error ? err.message : "Error al confirmar checkout"
      );
    }
  };

  const handleAssignRest = (paymentMethod: string) => {
    const selectedPayAmount =
      payments.find((p) => p.payment_method === paymentMethod)?.amount || 0;
    const rest = Number(remaining + Number(selectedPayAmount || 0)).toFixed(2);

    setPayments((prev) =>
      prev.map((pay) =>
        pay.payment_method === paymentMethod
          ? { ...pay, amount: Number(rest) }
          : pay
      )
    );
  };

  const clientAvailableCredit = order?.client?.available_credit || 0;
  const showChangeOpt = changeOrCredit > 0 && hasClient;

  const confirmOrderRef = useRef<HTMLButtonElement | null>(null);
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingActionRef = useRef(false);

  const openCheckOutDisabled = items.length === 0 || completeOrderMutation.isPending;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (openCheckOutDisabled) return;

        if (pendingActionRef.current) {
          if (pendingTimeoutRef.current) {
            clearTimeout(pendingTimeoutRef.current);
          }

          pendingActionRef.current = false;
          pendingTimeoutRef.current = null;

          if (isCheckOutOpen) {
            confirmOrderRef.current?.click();
            return;
          }

          setIsCheckOutOpen(true);
          return;
        }

        pendingActionRef.current = true;

        pendingTimeoutRef.current = setTimeout(() => {
          pendingActionRef.current = false;
          pendingTimeoutRef.current = null;
        }, 300);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCheckOutOpen, setIsCheckOutOpen]);

  return (
    <Dialog open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={openCheckOutDisabled}
          variant="default"
        >
          Registrar pago
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Confirma los detalles del pago antes de finalizar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Items:</span>
            <span>{totals.itemCount}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Métodos de pago</p>
            {payments.map((pay, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs w-24">
                  {pay.payment_method === "CASH"
                    ? "Efectivo"
                    : pay.payment_method === "BANK_TRANSFER"
                      ? "Transferencia"
                      : pay.payment_method === "DEBIT_CARD"
                        ? "Débito"
                        : pay.payment_method === "CREDIT_CARD"
                          ? "Crédito"
                          : "Cta. Cte."}
                </span>
                <MoneyInput
                  label=""
                  value={pay.amount || undefined}
                  onChange={(val) => {
                    setPayments((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, amount: val || 0 } : p
                      )
                    );
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignRest(pay.payment_method)}
                >
                  Todo
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-sm border-t pt-2">
            <span>Pagado:</span>
            <span className="font-semibold">{formatCurrency(paidSum)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Resta pagar:</span>
            <span className="font-semibold text-red-600">
              {formatCurrency(remainingToShow)}
            </span>
          </div>

          {showChangeOpt && (
            <div className="border rounded p-2 bg-muted">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={checkOutOptions.registerPositiveCredit}
                  onCheckedChange={(checked) =>
                    setCheckOutOptions((prev) => ({
                      ...prev,
                      registerPositiveCredit: !!checked,
                    }))
                  }
                />
                <span className="text-sm">
                  Registrar vuelto como saldo a favor (
                  {formatCurrency(changeOrCredit)})
                </span>
              </div>
              {!checkOutOptions.registerPositiveCredit && (
                <p className="text-xs text-muted-foreground mt-1">
                  Vuelto: {formatCurrency(changeOrCredit)}
                </p>
              )}
            </div>
          )}

          {hasClient && (
            <div className="text-xs text-muted-foreground">
              Crédito disponible: {formatCurrency(clientAvailableCredit)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCheckOutOpen(false)}>
            Cancelar
          </Button>


          <RefButton
            disabled={Number(remaining) > 0 || completeOrderMutation.isPending}
            onClick={handleConfirm}
            btnRef={confirmOrderRef}
          >
            {completeOrderMutation.isPending
              ? "Procesando..."
              : "Confirmar pago"}
          </RefButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
