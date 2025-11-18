import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ToastProvider } from "./components/ToastProvider";

const storedTheme = localStorage.getItem('theme');
if(storedTheme){
    document.documentElement.dataset.theme = storedTheme;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ToastProvider>
            <App />
        </ToastProvider>
    </React.StrictMode>
);