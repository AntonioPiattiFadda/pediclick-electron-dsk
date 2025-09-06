// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BarcodeFetcher from "./components/barcodeReaders/BarcodeReaderFetcher";
import ScaleFetcher from "./components/scales/ScaleFetcher";
import { signIn } from "./service/auth";
import { getAllProducts } from "./service/products";
import PrinterFetcher from "./components/printers/PrinterFetcher";

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
      <div
        className="w-screen h-screen flex items-center justify-center bg-red-200"
        style={{
          padding: 24,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "850px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
            marginBottom: "auto",
            marginTop: "15rem",
          }}
        >
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
        {/* {!session ? (
          <Login onSuccess={setSession} />
        ) : (
          <Products token={session.token} onLogout={() => setSession(null)} />
        )} */}
      </div>
    </QueryClientProvider>
  );
}

export default App;
