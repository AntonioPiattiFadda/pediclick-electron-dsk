
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger
} from "@/components/ui/menubar";
import { useModalsContext } from "@/context/ModalsContext";
import { Menu, Sparkle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MarketStoreIcon from '../../assets/icons/MarketStoreIcon.png';
import RegisterClientPayment from "../registerClientPayment/RegisterClientPayment";
import TerminalSessionClosure from "../teminalSessions/terminalSessionClosure/TerminalSessionClosure";
import OpenSessionsManager from "../teminalSessions/openSessionsManager/OpenSessionsManager";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import UserData from "./UserData";
import PrinterStatusPopover from "@/components/printer/PrinterStatusPopover";
import { useState } from "react";

// const devices: { title: string; description: string; selector: React.ReactNode }[] = [
//     {
//         title: "Balanza",
//         description:
//             "Allows users to select from a range of values by moving a slider thumb along a track.",
//         selector: <ScaleFetcher />
//     },
//     {
//         title: "Lector de Códigos de Barras",
//         description:
//             "Component that enables users to scan and read barcode information.",
//         selector: <BarcodeFetcher />
//     },
//     {
//         title: "Impresora",
//         description:
//             "Component that manages printing tasks and settings.",
//         selector: <PrinterFetcher />
//     },
// ]

const Header = () => {
    const { setClientPaymentModalOpen, setTerminalSessionClosure } = useModalsContext();
    const navigate = useNavigate();
    const [openSessionsManagerOpen, setOpenSessionsManagerOpen] = useState(false);

    const handleOpenClientPaymentModal = () => {
        setClientPaymentModalOpen(true);
    }

    const handleOpenTerminalSessionClosureModal = () => {
        setTerminalSessionClosure(true);
    }

    const handleOpenSessionsManager = () => {
        setOpenSessionsManagerOpen(true);
    }

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
                                <MenubarItem onClick={handleOpenSessionsManager}>
                                    Sesiones abiertas (Dev)
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
                </div >
            </div >
        </header >
    )
}

export default Header

