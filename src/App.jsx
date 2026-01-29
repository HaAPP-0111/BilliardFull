
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Tables from "./pages/Tables";
import Products from "./pages/Products";
import Bills from "./pages/Bills";
import Employees from "./pages/Employees";
import Dashboard from "./pages/Dashboard";
import Cashier from "./pages/Cashier";
import TvBoards from "./pages/TvBoards";

// Layout & Route
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";

import TvBoards from "./pages/TvBoards";
import Landing from "./pages/Landing";





export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/tv" element={<TvBoards />} />


      <Route path="/welcome" element={<Landing />} />



      {/* Khu vực admin */}

      {/* Protected admin area */}

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Redirect root to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Admin pages */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cashier" element={<Cashier />} />
        <Route path="tables" element={<Tables />} />
        <Route path="products" element={<Products />} />
        <Route path="bills" element={<Bills />} />
        <Route path="employees" element={<Employees />} />
      </Route>

      {/* Fallback route for 404 */}
      <Route path="*" element={<div style={{padding: 32, textAlign: 'center'}}><h2>404 - Không tìm thấy trang</h2></div>} />
    </Routes>
  );
}