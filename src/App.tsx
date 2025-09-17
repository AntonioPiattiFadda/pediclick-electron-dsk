// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import { SignIn } from "./pages/Login";
import SelectStore from "./pages/SelectStore";
import Selling from "./pages/selling";
import { store } from "./stores/store";
import { Layout } from "./layout/Layout";

// ---- App raíz mínima con QueryClient local ----
const queryClient = new QueryClient();



function App() {

  // const handleLogout = () => {
  //   setSession(null);
  // };

  return (

    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
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
              path="/selling"
              element={<Selling />}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
