// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./layout/layout";
import { SignIn } from "./pages/Login";
import { Orders } from "./pages/Orders";
import SelectStore from "./pages/SelectStore";
import { store } from "./stores/store";
import { OrderProvider } from "./context/OrderContext";
import { Toaster } from "sonner";
import { ShortCutProvider } from "./context/ShortCutContext";

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
      <ShortCutProvider>
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
                    path="/select-store"
                    element={<SelectStore />}
                  />
                  <Route
                    path="/orders"
                    element={
                      <Orders />
                    }
                  />

                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            </HashRouter>
          </Provider>
        </OrderProvider>
      </ShortCutProvider>
    </QueryClientProvider >
  );
}

export default App;
