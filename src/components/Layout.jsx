import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Segoe UI, Roboto, Arial" }}>
      <Sidebar />

      <div style={{ flex: 1, background: "#f3f6fb", overflow: "auto" }}>
        <Header />
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
