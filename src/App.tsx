// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./layout/layout";
import { SignIn } from "./pages/auth/Login";
import { InSiteOrders } from "./pages/inSiteOrders/InSiteOrders";
import { store } from "./stores/store";
import { Toaster } from "sonner";
import { ShortCutProvider } from "./context/ShortCutContext";
import { DeliveryOrders } from "./pages/deliveryOrders/DeliveryOrders";
import { ScaleIpcBridge } from "./context/ScaleContext";
import SetupSession from "./pages/setupSession/SetupSession";
import { DeliveryAiOrders } from "./pages/deliveryOrdersAi/DeliveryAiOrders";

// ---- App raíz mínima con QueryClient local ----
const queryClient = new QueryClient();


function App() {

  return (

    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <Toaster />
        <ScaleIpcBridge />
        <ShortCutProvider>
          <HashRouter>
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={<SignIn />}
                />

                <Route
                  path="/login"
                  element={<SignIn />}
                />

                <Route
                  path="/setup-session"
                  element={<SetupSession />}
                />

                <Route
                  path="/in-site-orders"
                  element={<InSiteOrders />}
                />

                <Route
                  path="/delivery-orders"
                  element={<DeliveryOrders />}
                />

                <Route
                  path="/delivery-orders-ai"
                  element={<DeliveryAiOrders />}
                />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </HashRouter>
        </ShortCutProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
