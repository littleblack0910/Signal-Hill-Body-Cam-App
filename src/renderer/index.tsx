import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import '@fortawesome/fontawesome-free/css/all.min.css';

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);
root.render(<App />);
