import { NavLink, Route, Routes } from "react-router-dom";

import BatchesPage from "./pages/batches";
import DashboardPage from "./pages/dashboard";
import ExportDocsPage from "./pages/export-docs";
import ForecastingPage from "./pages/forecasting";
import GradingPage from "./pages/grading";
import SuppliersPage from "./pages/suppliers";
import TraceabilityPage from "./pages/traceability";
import VerifyPage from "./pages/verify";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/batches", label: "Batches" },
  { to: "/export-docs", label: "Invoices" },
  { to: "/grading", label: "Grading" },
  { to: "/forecasting", label: "Forecasting" },
  { to: "/traceability", label: "Traceability" },
  { to: "/verify", label: "Verify" },
];

export default function App() {
  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="brand-group">
          <span className="brand-text">Canela Trace</span>
        </div>
        <span className="env-pill">Production</span>
        <nav className="topbar-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "topbar-link active" : "topbar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="layout-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/batches" element={<BatchesPage />} />
          <Route path="/export-docs" element={<ExportDocsPage />} />
          <Route path="/grading" element={<GradingPage />} />
          <Route path="/forecasting" element={<ForecastingPage />} />
          <Route path="/traceability" element={<TraceabilityPage />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Routes>
      </main>
    </div>
  );
}
