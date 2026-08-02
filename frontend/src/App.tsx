import { NavLink, Route, Routes } from "react-router-dom";

import BatchesPage from "./pages/batches";
import DashboardPage from "./pages/dashboard";
import ForecastingPage from "./pages/forecasting";
import GradingPage from "./pages/grading";
import SuppliersPage from "./pages/suppliers";
import TraceabilityPage from "./pages/traceability";
import VerifyPage from "./pages/verify";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/batches", label: "Batches" },
  { to: "/grading", label: "Grading" },
  { to: "/forecasting", label: "Forecasting" },
  { to: "/traceability", label: "Traceability" },
  { to: "/verify", label: "Verify" },
];

export default function App() {
  return (
    <div className="shell">
      <header className="hero">
        <p className="eyebrow">Canela Ceylon</p>
        <h1>AI-Integrated Supply Chain Management System</h1>
        <p>
          Restored React frontend shell for supply-chain operations, grading,
          forecasting, and blockchain traceability flows.
        </p>
      </header>

      <nav className="nav-grid" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              isActive ? "nav-card active" : "nav-card"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/batches" element={<BatchesPage />} />
          <Route path="/grading" element={<GradingPage />} />
          <Route path="/forecasting" element={<ForecastingPage />} />
          <Route path="/traceability" element={<TraceabilityPage />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Routes>
      </main>
    </div>
  );
}
