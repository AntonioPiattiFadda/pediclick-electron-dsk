// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./layout/layout";
import { SignIn } from "./pages/auth/Login";
import { InSiteOrders } from "./pages/inSiteOrders/InSiteOrders";
import SelectStore from "./pages/selectStore/SelectStore";
import { store } from "./stores/store";
import { OrderProvider } from "./context/OrderContext";
import { Toaster } from "sonner";
import { ShortCutProvider } from "./context/ShortCutContext";
import { ModalsProvider } from "./context/ModalsContext";
import { DeliveryOrders } from "./pages/deliveryOrders/DeliveryOrders";
import { ScaleProvider } from "./context/ScaleContext";
import SelectTerminalPage from "./pages/selectTerminal/SelectTerminal";
import { DeliveryOrderProvider } from "./context/DeliveryOrderContext";
import { DeliveryOrderAiProvider } from "./context/DeliveryOrderAiContext";
import { DeliveryOrdersAi } from "./pages/deliveryOrdersAi/InSiteOrders";

// ---- App raíz mínima con QueryClient local ----
const queryClient = new QueryClient();


function App() {

  // const handleLogout = () => {
  //   setSession(null);
  // };

  return (

    <QueryClientProvider client={queryClient}>
      {/* <ReactHotToast
        position="bottom-right" /> */}
      <Toaster />
      <ScaleProvider>
        <ShortCutProvider>
          <ModalsProvider>
            <OrderProvider >

              <Provider store={store}>

                <HashRouter>
                  <Layout>


                    <Routes>
                      <Route
                        path="/"
                        element={<SignIn />}
                      />

                      <Route
                        path="/login"
                        element={
                          <SignIn />

                        }
                      />

                      <Route
                        path="/select-terminal"
                        element={
                          <SelectTerminalPage />

                        }
                      />

                      <Route
                        path="/select-store"
                        element={<SelectStore />}
                      />

                      <Route
                        path="/in-site-orders"
                        element={
                          <InSiteOrders />
                        }
                      />

                      <Route
                        path="/delivery-orders"
                        element={
                          <DeliveryOrderProvider>
                            <DeliveryOrders />
                          </DeliveryOrderProvider>
                        }
                      />

                      <Route
                        path="/delivery-orders-ai"
                        element={
                          <DeliveryOrderAiProvider>
                            <DeliveryOrdersAi />
                          </DeliveryOrderAiProvider>
                        }
                      />

                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Layout>
                </HashRouter>
              </Provider>
            </OrderProvider>
          </ModalsProvider>
        </ShortCutProvider>
      </ScaleProvider >
    </QueryClientProvider >
  );
}

export default App;
