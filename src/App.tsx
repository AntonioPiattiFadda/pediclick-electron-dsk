// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import BarcodeFetcher from "./components/barcodeReaders/BarcodeReaderFetcher";
import PrinterFetcher from "./components/printers/PrinterFetcher";
import ScaleFetcher from "./components/scales/ScaleFetcher";
import Login from "./pages/Login";

// ---- API súper mínima de ejemplo ----
type Session = { token: string; name: string };

// ---- App raíz mínima con QueryClient local ----
const queryClient = new QueryClient();

function MainDashboard() {
  return (
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
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);

  // const handleLogout = () => {
  //   setSession(null);
  // };

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route
          path="/login"
          element={
            session ? (
              <Navigate to="/" />
            ) : (
              <Login onSuccess={(data) => setSession(data)} />
            )
          }
        />
        <Route
          path="/"
          element={session ? <MainDashboard /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to={session ? "/" : "/login"} />} />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
