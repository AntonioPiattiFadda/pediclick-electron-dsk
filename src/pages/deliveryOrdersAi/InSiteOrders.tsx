import { Button } from "@/components/ui/button";
import { RefButton } from "@/components/ui/refButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeliveryOrderAiContext } from "@/context/DeliveryOrderAiContext";
import { Bot } from "lucide-react";
import { useRef, useState } from "react";
import Order from "./Order";
import { AiOrderCreationDialog } from "./components/AiOrderCreationDialog";

export function DeliveryOrdersAi() {
  const { aiOrder, startAiOrder, clearAiOrder } = useDeliveryOrderAiContext();
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);

  const initiateOrderBtnRef = useRef<HTMLButtonElement>(null);

  const handleStartNewOrder = () => {
    if (aiOrder) {
      // Show confirmation dialog if order exists
      setShowReplaceDialog(true);
    } else {
      // Start new order and open AI dialog
      startAiOrder();
      setShowAiDialog(true);
    }
  };

  const handleConfirmReplace = () => {
    clearAiOrder();
    startAiOrder();
    setShowReplaceDialog(false);
    setShowAiDialog(true);
  };

  return (
    <>
      <div className="w-full">
        <div className="w-full flex justify-between items-center px-4">
          <h1 className="text-2xl flex items-center gap-2">
            <Bot className="w-6 h-6" />
            AI Delivery Orders
          </h1>
          {aiOrder && (
            <Button
              type="button"
              variant="outline"
              onClick={handleStartNewOrder}
              className="mt-4"
            >
              New AI Order
            </Button>
          )}
        </div>

        {!aiOrder && (
          <div className="w-full flex items-center justify-center h-[80%] absolute top-0 left-0 bg-background/70 translate-y-18 z-10">
            <RefButton
              onClick={handleStartNewOrder}
              btnRef={initiateOrderBtnRef}
            >
              Start AI Order
            </RefButton>
          </div>
        )}

        {aiOrder && (
          <Order
            order={aiOrder}
            onChangeOrder={(updatedOrder) => {
              // Update order in context if needed
              console.log("Order updated:", updatedOrder);
            }}
          />
        )}
      </div>

      {/* Replace Order Confirmation Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Current AI Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard your current AI-assisted order and all its items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>
              Replace & Start New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Order Creation Dialog */}
      <AiOrderCreationDialog
        open={showAiDialog}
        onOpenChange={setShowAiDialog}
      />
    </>
  );
}
