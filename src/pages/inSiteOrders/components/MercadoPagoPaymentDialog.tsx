import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Smartphone, QrCode } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n || 0);

type Mode = "point" | "qr";
type Status = "idle" | "loading" | "waiting" | "success" | "error";

interface MpItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total_price: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  orderId: number;
  items: MpItem[];
  onSuccess: (paidAmount: number) => void;
}

export default function MercadoPagoPaymentDialog({
  open,
  onOpenChange,
  amount,
  orderId,
  items,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<Mode>("point");
  const [status, setStatus] = useState<Status>("idle");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paidAmountRef = useRef(amount);
  const currentModeRef = useRef<Mode>("point");

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleSuccess = useCallback(
    (paidAmount: number) => {
      stopPolling();
      paidAmountRef.current = paidAmount;
      setStatus("success");
      setTimeout(() => {
        onSuccess(paidAmount);
        onOpenChange(false);
      }, 1500);
    },
    [stopPolling, onSuccess, onOpenChange],
  );

  const handleError = useCallback(
    (msg: string) => {
      stopPolling();
      setStatus("error");
      setErrorMsg(msg);
    },
    [stopPolling],
  );

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setMode("point");
      setStatus("idle");
      setQrImage(null);
      setErrorMsg("");
      paidAmountRef.current = amount;
    } else {
      stopPolling();
    }
  }, [open, amount, stopPolling]);

  // Cancel in-flight payment when dialog closes mid-flow
  const handleOpenChange = useCallback(
    async (next: boolean) => {
      if (!next && (status === "waiting" || status === "loading")) {
        stopPolling();
        try {
          if (currentModeRef.current === "point") {
            await window.mercadoPago.cancelPointIntent();
          } else {
            await window.mercadoPago.deleteQROrder();
          }
        } catch {
          // best-effort
        }
      }
      onOpenChange(next);
    },
    [status, stopPolling, onOpenChange],
  );

  // ─── Point payment ──────────────────────────────────────────────────────────
  const startPointPayment = useCallback(async () => {
    currentModeRef.current = "point";
    setStatus("loading");
    const ref = `pediclick-${orderId}-${Date.now()}`;

    try {
      const result = await window.mercadoPago.createPointIntent(
        amount,
        "Venta en tienda",
        ref,
      );

      if (!result.id) {
        handleError(
          (result.message as string) || "No se pudo crear el intento de pago en la terminal",
        );
        return;
      }

      const intentId = result.id;
      setStatus("waiting");

      pollRef.current = setInterval(async () => {
        try {
          const check = await window.mercadoPago.checkPointIntent(intentId);
          if (check.state === "FINISHED") {
            const paid = check.payment?.total_paid_amount ?? amount;
            handleSuccess(paid);
          } else if (check.state === "ABANDONED" || check.state === "ERROR") {
            handleError("El pago fue cancelado o venció en la terminal");
          }
        } catch {
          // transient error — keep polling
        }
      }, 2500);
    } catch {
      handleError("No se pudo conectar con la terminal");
    }
  }, [amount, orderId, handleSuccess, handleError]);

  // ─── QR payment ─────────────────────────────────────────────────────────────
  const startQRPayment = useCallback(async () => {
    currentModeRef.current = "qr";
    setStatus("loading");
    const ref = `pediclick-${orderId}-${Date.now()}`;

    try {
      const result = await window.mercadoPago.createQROrder(items, amount, ref);

      if (!result.qr_image) {
        handleError(
          (result.message as string) || "No se pudo generar el código QR",
        );
        return;
      }

      setQrImage(result.qr_image);
      setStatus("waiting");

      pollRef.current = setInterval(async () => {
        try {
          const check = await window.mercadoPago.checkMerchantOrder(ref);
          const order = check.elements?.[0];
          if (order) {
            const approved = order.payments?.find((p) => p.status === "approved");
            if (approved) {
              handleSuccess(approved.amount ?? amount);
            }
          }
        } catch {
          // transient error — keep polling
        }
      }, 2500);
    } catch {
      handleError("No se pudo generar el código QR");
    }
  }, [items, amount, orderId, handleSuccess, handleError]);

  const handleCancel = useCallback(async () => {
    stopPolling();
    try {
      if (currentModeRef.current === "point") {
        await window.mercadoPago.cancelPointIntent();
      } else {
        await window.mercadoPago.deleteQROrder();
      }
    } catch {
      // best-effort
    }
    setStatus("idle");
    setQrImage(null);
  }, [stopPolling]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pago con Mercado Pago</DialogTitle>
          <DialogDescription>
            Total a cobrar:{" "}
            <span className="font-semibold">{formatCurrency(amount)}</span>
          </DialogDescription>
        </DialogHeader>

        {/* ── Idle: mode selector ── */}
        {status === "idle" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("point")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors cursor-pointer ${
                  mode === "point"
                    ? "border-blue-500 bg-blue-50"
                    : "border-muted hover:border-muted-foreground"
                }`}
              >
                <Smartphone className="h-8 w-8" />
                <span className="text-sm font-medium">Terminal Point</span>
                <span className="text-xs text-muted-foreground text-center">
                  Pago en postnet
                </span>
              </button>

              <button
                onClick={() => setMode("qr")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors cursor-pointer ${
                  mode === "qr"
                    ? "border-blue-500 bg-blue-50"
                    : "border-muted hover:border-muted-foreground"
                }`}
              >
                <QrCode className="h-8 w-8" />
                <span className="text-sm font-medium">QR en pantalla</span>
                <span className="text-xs text-muted-foreground text-center">
                  Cliente escanea con celular
                </span>
              </button>
            </div>

            <Button
              className="w-full"
              onClick={mode === "point" ? startPointPayment : startQRPayment}
            >
              Iniciar pago
            </Button>
          </div>
        )}

        {/* ── Loading ── */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-sm text-muted-foreground">
              {mode === "point" ? "Enviando a terminal..." : "Generando QR..."}
            </p>
          </div>
        )}

        {/* ── Waiting — Point ── */}
        {status === "waiting" && mode === "point" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Smartphone className="h-16 w-16 text-blue-500" />
            <div className="text-center">
              <p className="font-medium">Esperando pago en terminal</p>
              <p className="text-sm text-muted-foreground mt-1">
                El cliente debe completar el pago en el postnet
              </p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        )}

        {/* ── Waiting — QR ── */}
        {status === "waiting" && mode === "qr" && (
          <div className="flex flex-col items-center gap-4 py-2">
            {qrImage && (
              <img
                src={qrImage}
                alt="QR Mercado Pago"
                className="rounded-lg border"
                width={280}
                height={280}
              />
            )}
            <div className="text-center">
              <p className="font-medium">Esperando escaneo</p>
              <p className="text-sm text-muted-foreground mt-1">
                El cliente debe escanear el QR con la app de Mercado Pago
              </p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        )}

        {/* ── Success ── */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div className="text-center">
              <p className="font-semibold text-green-700 text-lg">¡Pago aprobado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(paidAmountRef.current)} cobrados con Mercado Pago
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <XCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <p className="font-medium text-red-700">Error en el pago</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setStatus("idle");
                  setQrImage(null);
                  setErrorMsg("");
                }}
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
