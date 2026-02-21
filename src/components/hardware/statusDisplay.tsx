import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import clsx from "clsx";
import { DevicesStatus } from "@/types/devices";

const statusConfig: Record<DevicesStatus, { color: string; label: string }> = {
    connected: { color: "bg-green-500", label: "Connected" },
    disconnected: { color: "bg-gray-400", label: "Disconnected" },
    error: { color: "bg-red-500", label: "Error" },
    loading: { color: "bg-yellow-400", label: "Loading" },
    connecting: { color: "bg-blue-500", label: "Connecting..." },
};

export const StatusDisplay = ({ status }: { status: DevicesStatus }) => {
    const { color, label } = statusConfig[status];

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={clsx(
                            "relative h-3 w-3 rounded-full",
                            color,
                            "after:absolute after:inset-0 after:rounded-full after:opacity-75 after:animate-ping"
                        )}
                    />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    {label}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default StatusDisplay;
