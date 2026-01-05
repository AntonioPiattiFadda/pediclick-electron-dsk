import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  //   <BrowserRouter>
  //   </BrowserRouter>
  // </React.StrictMode>
  <App />
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  if (import.meta.env.DEV) console.log(message);
});
