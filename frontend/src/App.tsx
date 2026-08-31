import { NavLink, Route, Routes, useLocation } from "react-router-dom";

import BatchesPage from "./pages/batches";
import DashboardPage from "./pages/dashboard";
import ExportDocsPage from "./pages/export-docs";
import ForecastingPage from "./pages/forecasting";
import GradingPage from "./pages/grading";
import LoginPage from "./pages/login";
import SuppliersPage from "./pages/suppliers";
import TraceabilityPage from "./pages/traceability";
import VerifyPage from "./pages/verify";

import { clearToken, getDecodedPayload, isLoggedIn } from "./lib/auth";
import { useState } from "react";

const PUBLIC_PATHS = ["/verify"];

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/batches", label: "Batches" },
  { to: "/export-docs", label: "Invoices" },
  { to: "/grading", label: "Grading" },
  { to: "/forecasting", label: "Forecasting" },
  { to: "/traceability", label: "Traceability" },
];

function AppShell() {
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [showLogin, setShowLogin] = useState(false);
  const user = loggedIn ? getDecodedPayload() : null;

  const isPublic = PUBLIC_PATHS.some((p) => location.pathname.startsWith(p));

  // Staff routes show login wall; public routes render without any auth check.
  if ((!loggedIn && !isPublic) || showLogin) {
    return (
      <LoginPage
        onLogin={() => {
          setLoggedIn(true);
          setShowLogin(false);
        }}
      />
    );
  }

  function handleLogout() {
    clearToken();
    setLoggedIn(false);
  }

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="brand-group">
          <span className="brand-text">Canela Trace</span>
        </div>
        <span className="env-pill">Production</span>
        {loggedIn ? (
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
        ) : null}
        {loggedIn && user ? (
          <div className="topbar-user">
            <span className="topbar-username">{user.username}</span>
            <span className={`topbar-role-badge role-${user.role}`}>
              {user.role}
            </span>
            <button className="topbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : !isPublic ? null : (
          <button
            className="topbar-logout"
            style={{ marginLeft: "auto" }}
            onClick={() => setShowLogin(true)}
          >
            Staff Login
          </button>
        )}
      </header>

      <main className="layout-content">
        <Routes>
          <Route path="/verify" element={<VerifyPage />} />
          {loggedIn ? (
            <>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/batches" element={<BatchesPage />} />
              <Route path="/export-docs" element={<ExportDocsPage />} />
              <Route path="/grading" element={<GradingPage />} />
              <Route path="/forecasting" element={<ForecastingPage />} />
              <Route path="/traceability" element={<TraceabilityPage />} />
            </>
          ) : null}
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
