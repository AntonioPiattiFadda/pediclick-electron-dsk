import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  ClientSelectorRoot,
  SelectClient,
  CancelClientSelection,
  CreateClient,
} from "@/components/shared/selectors/clientSelector";
import { useDeliveryOrderAiContext } from "@/context/DeliveryOrderAiContext";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { createAiOrder } from "@/service/aiOrders";
import { OrderItem } from "@/types/orderItems";
import { Client } from "@/types/clients";
import { Info, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { AiOrderItemsReview } from "./AiOrderItemsReview";

type DialogState = "input" | "loading" | "review";

interface AiOrderCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiOrderCreationDialog({
  open,
  onOpenChange,
}: AiOrderCreationDialogProps) {
  const { aiOrder, orderItems, setOrderItems, setAiOrder } = useDeliveryOrderAiContext();
  const { handleGetLocationId } = useGetLocationData();

  const [dialogState, setDialogState] = useState<DialogState>("input");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [textInput, setTextInput] = useState("");
  const [reviewItems, setReviewItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    // Reset state when closing
    setDialogState("input");
    setTextInput("");
    setSelectedClient(null);
    setReviewItems([]);
    setError(null);
    onOpenChange(false);
  };

  const handleCreateOrder = async () => {
    // Validation
    if (textInput.trim().length === 0) {
      setError("Por favor, describe el pedido que deseas crear");
      return;
    }

    setError(null);
    setDialogState("loading");

    try {
      // TODO: Get organizationId from user context/store

      const aiOrderItems = await createAiOrder({
        locationId: handleGetLocationId(),
        clientId: selectedClient?.client_id || null,
        message: textInput.trim(),
      });

      console.log("AI Order Creation Response:", aiOrderItems);

      // Check if items were returned
      if (!aiOrderItems || aiOrderItems.length === 0) {
        setError(
          "No se detectaron productos en la descripción. Intenta ser más específico."
        );
        setDialogState("input");
        return;
      }

      // Success - show review state
      setReviewItems(aiOrderItems);
      setDialogState("review");
    } catch (err) {
      console.error("Error creating AI order:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al procesar la orden. Por favor, intenta nuevamente.";
      setError(errorMessage);
      setDialogState("input");
    }
  };

  const handleAcceptItems = () => {
    // Add reviewed items to existing orderItems with AI flag
    const itemsToAdd = reviewItems.map((item) => ({
      ...item,
      order_id: aiOrder!.order_id,
      is_ai_assisted: true,
      created_at: new Date().toISOString(),
    }));

    setOrderItems([...orderItems, ...itemsToAdd]);

    // Update order with client if selected
    if (selectedClient && aiOrder) {
      setAiOrder({
        ...aiOrder,
        client_id: selectedClient.client_id,
        client: selectedClient,
      });
    }

    toast.success(`✨ ${reviewItems.length} productos agregados con AI`);
    handleClose();
  };

  const handleUpdateItem = (index: number, updatedItem: OrderItem) => {
    const newItems = [...reviewItems];
    newItems[index] = updatedItem;
    setReviewItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = reviewItems.filter((_, i) => i !== index);
    setReviewItems(newItems);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-fit max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dialogState === "review"
              ? "Orden Generada por AI - Revisar y Confirmar"
              : "Crear Orden con AI"}
          </DialogTitle>
          {dialogState === "input" && (
            <DialogDescription>
              Describe el pedido en lenguaje natural y el AI generará la orden
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* INPUT STATE */}
        {dialogState === "input" && (
          <div className="flex flex-col gap-6">
            {/* Client Selector */}
            <div className="flex flex-col gap-2">
              <Label>Cliente (opcional)</Label>
              <ClientSelectorRoot
                value={selectedClient}
                onChange={(client) => setSelectedClient(client)}
                showInfo={false}
              >
                <SelectClient />
                <CancelClientSelection />
                <CreateClient />
              </ClientSelectorRoot>

              {/* Info Alert */}
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  Seleccionar un cliente permite al AI analizar pedidos
                  anteriores y ser más eficiente en las sugerencias
                </AlertDescription>
              </Alert>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="texto" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="texto">Texto</TabsTrigger>
                <TabsTrigger value="imagen" disabled>
                  Imagen
                  <Badge variant="secondary" className="ml-2">
                    Próximamente
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="texto" className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>Descripción del pedido</Label>
                  <Textarea
                    placeholder="Describe el pedido... (ej: 5kg de tomates, 3 cajas de lechuga...)"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="imagen">
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  <Info className="mr-2 h-5 w-5" />
                  Próximamente: Carga de imágenes para generar pedidos
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* LOADING STATE */}
        {dialogState === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 px-14">
            <Spinner className="h-12 w-12" />
            <p className="text-lg text-muted-foreground">
              Generando orden con AI...
            </p>
          </div>
        )}

        {/* REVIEW STATE */}
        {dialogState === "review" && (
          <AiOrderItemsReview
            items={reviewItems}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        )}

        {/* Footer Buttons */}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {dialogState === "input" && (
            <Button onClick={handleCreateOrder}>Crear Orden con AI</Button>
          )}
          {dialogState === "review" && (
            <Button onClick={handleAcceptItems}>Aceptar y Agregar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
