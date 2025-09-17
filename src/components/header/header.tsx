import BarcodeFetcher from "../barcodeReaders/BarcodeReaderFetcher"
import PrinterFetcher from "../printers/PrinterFetcher"
import ScaleFetcher from "../scales/ScaleFetcher"

const Header = () => {
    return (
        <header className="w-screen bg-white shadow flex justify-between">
            <div className="mx-auto max-w-7xl px-4 py-2">
                <h1 className="text-lg font-semibold">My App</h1>
            </div>
            <div className="ml-auto flex gap-2">
                <div>
                    <ScaleFetcher />
                </div>
                <div>
                    <BarcodeFetcher />
                </div>
                <div>
                    <PrinterFetcher />
                </div>


            </div>
        </header>
    )
}

export default Header