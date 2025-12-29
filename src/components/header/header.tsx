import { SettingsIcon } from "../ui/settings"
import { Button } from "../ui/button"
// import BarcodeFetcher from "../barcodeReaders/BarcodeReaderFetcher"
// import PrinterFetcher from "../printersUNUSED/PrinterFetcher"
// import ScaleFetcher from "../scales/ScaleFetcher"

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

    return (
        <header className="w-full bg-card border-b">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex h-14 items-center justify-between">
                    <h1 className="text-base font-semibold text-foreground">Market Store</h1>

                    {/* <div className="flex gap-2">
                        {devices.map((device) => (
                            <div >
                    {device.selector}
                </div>
                        ))}
            </div> */}
                    <Button disabled size={'icon'} variant={'ghost'} className="cursor-pointer">
                        <SettingsIcon />
                    </Button>


                </div >
            </div >
        </header >
    )
}

export default Header

