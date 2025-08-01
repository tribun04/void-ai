import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import axios from 'axios'; // 1. Import axios

// ✅ --- THIS IS THE FIX --- ✅
// 2. Set the default base URL for all future axios requests in your entire application.
// Now, any call like axios.get('/api/users') will automatically go to 'http://localhost:5000/api/users'.
axios.defaults.baseURL = 'http://localhost:5000';


// This part remains the same.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);