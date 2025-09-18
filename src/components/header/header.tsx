import BarcodeFetcher from "../barcodeReaders/BarcodeReaderFetcher"
import PrinterFetcher from "../printers/PrinterFetcher"
import ScaleFetcher from "../scales/ScaleFetcher"

const Header = () => {
    return (
        <header className="w-full bg-card border-b">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex h-14 items-center justify-between">
                    <h1 className="text-base font-semibold text-foreground">My App</h1>
                    <div className="flex items-center gap-2">
                        <ScaleFetcher />
                        <BarcodeFetcher />
                        <PrinterFetcher />
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header