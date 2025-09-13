// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BarcodeFetcher from "./components/barcodeReaders/BarcodeReaderFetcher";
import ScaleFetcher from "./components/scales/ScaleFetcher";
import { signIn } from "./service/auth";
import { getAllProducts } from "./service/products";
import PrinterFetcher from "./components/printers/PrinterFetcher";
import "./App.css";

// ---- API súper mínima de ejemplo ----
type LoginInput = { email: string; password: string };
type Session = { token: string; name: string };
type Product = { id: number; name: string };

// eslint-disable-next-line react-refresh/only-export-components
export const api = {
  login: async ({ email, password }: LoginInput): Promise<Session> => {
    // simulación de red
    if (!email || !password) throw new Error("Email y contraseña requeridos");
    const response = await signIn(email, password);
    // acá llamarías a tu backend real
    return {
      token: response?.session?.access_token,
      name: response?.user?.email || "",
    };
  },
  getProducts: async (token: string): Promise<Product[]> => {
    const response = await getAllProducts("OWNER");
    if (!token) throw new Error("No auth");
    // reemplaza con fetch a tu endpoint real
    return response.products.map((p) => ({
      id: p.product_id,
      name: p.product_name,
    })) as Product[];
  },
};

// ---- App raíz mínima con QueryClient local ----
const queryClient = new QueryClient();

function App() {
  // const [session, setSession] = useState<Session | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <header className="app-header">
          <div>
            <h1 className="app-title">Panel de control del dispositivo</h1>
            <div className="app-subtitle">Básculas, lectores de códigos de barras e impresoras</div>
          </div>
        </header>

        <section className="card-grid">
          <div className="card">
            <h3>Básculas</h3>
            <ScaleFetcher />
          </div>

          <div className="card">
            <h3>Lectores de códigos de barras</h3>
            <BarcodeFetcher />
          </div>

          <div className="card">
            <h3>Impresora</h3>
            <PrinterFetcher />
          </div>
        </section>

        {/* Future: Auth + Products */}
      </div>
    </QueryClientProvider>
  );
}

export default App;
