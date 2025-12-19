import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Tables from "./pages/Tables";
import Products from "./pages/Products";
import Bills from "./pages/Bills";
import Employees from "./pages/Employees";
import Dashboard from "./pages/Dashboard";
import Cashier from "./pages/Cashier";

import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";

export default function App() {
return ( <Routes>
{/* Trang đăng nhập */}
<Route path="/login" element={<Login />} />

```
  {/* Khu vực admin */}
  <Route
    path="/"
    element={
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    }
  >
    {/* Trang mặc định → Dashboard */}
    <Route index element={<Navigate to="/dashboard" replace />} />

    <Route path="dashboard" element={<Dashboard />} />
    <Route path="cashier" element={<Cashier />} />
    <Route path="tables" element={<Tables />} />
    <Route path="products" element={<Products />} />
    <Route path="bills" element={<Bills />} />
    <Route path="employees" element={<Employees />} />
  </Route>
</Routes>
);
}
