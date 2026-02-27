
import PrinterStatusPopover from "@/components/hardware/printer/PrinterStatusPopover";
import ScaleStatusPopover from "@/components/hardware/scales/ScaleStatusPopover";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger
} from "@/components/ui/menubar";
import { useTerminalSessionData } from "@/hooks/useTerminalSessionData";
import OrderHistoryDialog from "@/pages/inSiteOrders/components/OrderHistoryDialog";
import RegisterWasteModal from "../registerWaste/RegisterWasteModal";
import { setClientPaymentModalOpen, setTerminalSessionClosure } from "@/stores/modalsSlice";
import type { AppDispatch } from "@/stores/store";
import { Menu, Sparkle } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import MarketStoreIcon from '../../assets/icons/MarketStoreIcon.png';
import RegisterClientPayment from "../registerClientPayment/RegisterClientPayment";
import OpenSessionsManager from "../teminalSessions/openSessionsManager/OpenSessionsManager";
import TerminalSessionClosure from "../teminalSessions/terminalSessionClosure/TerminalSessionClosure";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import UserData from "./UserData";


const Header = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [openSessionsManagerOpen, setOpenSessionsManagerOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
    const { handleGetTerminalSession } = useTerminalSessionData();
    const terminalSessionId = handleGetTerminalSession()?.terminal_session_id ?? 0;

    const handleOpenClientPaymentModal = () => {
        dispatch(setClientPaymentModalOpen(true));
    }

    const handleOpenTerminalSessionClosureModal = () => {
        dispatch(setTerminalSessionClosure(true));
    }

    // const handleOpenSessionsManager = () => {
    //     setOpenSessionsManagerOpen(true);
    // }

    const handleNavigateTo = (path: string) => {
        navigate(path);
    }

    return (
        <header className="w-full bg-card border-b">
            <div className=" px-8">
                <div className="flex h-14 items-center justify-between gap-4">
                    <div className="flex gap-4 items-center">
                        <Avatar className="w-12 h-12">
                            <AvatarImage
                                src={MarketStoreIcon}
                                alt="Usuario"
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {/* JP */}
                            </AvatarFallback>
                        </Avatar>
                        <h1 className="text-base font-semibold text-foreground">Market Store</h1>
                    </div>
                    <div className="ml-auto">
                        <UserData />
                    </div>
                    <ScaleStatusPopover />
                    <PrinterStatusPopover />

                    <Menubar>
                        <MenubarMenu>
                            <MenubarTrigger>
                                <Menu />
                            </MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem onClick={() => handleNavigateTo("/in-site-orders")}>
                                    Ordenes de compra
                                    {/* <MenubarShortcut>⌘T</MenubarShortcut> */}
                                </MenubarItem>
                                <MenubarItem onClick={() => handleNavigateTo("/delivery-orders")}>
                                    Pedidos
                                    {/* <MenubarShortcut>⌘T</MenubarShortcut> */}
                                </MenubarItem>
                                <MenubarItem onClick={() => handleNavigateTo("/delivery-orders-ai")}>
                                    Pedidos (AI) <Sparkle />
                                    {/* <MenubarShortcut>⌘T</MenubarShortcut> */}
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem onClick={handleOpenTerminalSessionClosureModal}>
                                    Cierre de caja
                                    {/* <MenubarShortcut>⌘T</MenubarShortcut> */}
                                </MenubarItem>
                                <MenubarItem onClick={handleOpenClientPaymentModal}>
                                    Registrar pago de cliente
                                    {/* <MenubarShortcut>⌘T</MenubarShortcut> */}
                                </MenubarItem>
                                <MenubarSeparator />

                                <MenubarItem onClick={() => setIsHistoryOpen(true)}>
                                    Historial de órdenes
                                    {/* <MenubarShortcut>⌘T</MenubarShortcut> */}
                                </MenubarItem>

                                <MenubarSeparator />

                                <MenubarItem onClick={() => setIsWasteModalOpen(true)}>
                                    Registrar merma
                                    {/* <MenubarShortcut>⌘T</MenubarShortcut> */}
                                </MenubarItem>

                                {/* <MenubarItem disabled>New Incognito Window</MenubarItem>
                                <MenubarSeparator />
                                <MenubarSub>
                                    <MenubarSubTrigger>Clientes</MenubarSubTrigger>
                                    <MenubarSubContent>
                                        <MenubarItem>Registrar pago</MenubarItem>

                                    </MenubarSubContent>
                                </MenubarSub>
                                <MenubarSeparator />
                                <MenubarItem>
                                    Print... <MenubarShortcut>⌘P</MenubarShortcut>
                                </MenubarItem> */}
                            </MenubarContent>
                        </MenubarMenu>
                    </Menubar>

                    <RegisterClientPayment />
                    <TerminalSessionClosure />
                    <OpenSessionsManager
                        open={openSessionsManagerOpen}
                        onOpenChange={setOpenSessionsManagerOpen}
                    />
                    <OrderHistoryDialog
                        open={isHistoryOpen}
                        onOpenChange={setIsHistoryOpen}
                        terminalSessionId={terminalSessionId}
                    />
                    <RegisterWasteModal
                        open={isWasteModalOpen}
                        onOpenChange={setIsWasteModalOpen}
                    />
                </div >
            </div >
        </header >
    )
}

export default Header

