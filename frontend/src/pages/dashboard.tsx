import { useEffect, useRef, useState } from "react";

import {
  fetchHealth,
  fetchInventory,
  listBatches,
  listSuppliers,
} from "../components/api-client";

export default function DashboardPage() {
  const didLoadRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState("unknown");
  const [suppliersCount, setSuppliersCount] = useState(0);
  const [batchesCount, setBatchesCount] = useState(0);
  const [inventoryTotal, setInventoryTotal] = useState(0);

  useEffect(() => {
    if (didLoadRef.current) {
      return;
    }
    didLoadRef.current = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [health, suppliers, batches, inventory] = await Promise.all([
          fetchHealth(),
          listSuppliers(),
          listBatches(),
          fetchInventory(),
        ]);

        setService(health.status);
        setSuppliersCount(suppliers.length);
        setBatchesCount(batches.length);
        setInventoryTotal(
          inventory.reduce((sum, item) => sum + (item.quantityKg ?? 0), 0),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Load failed",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <section className="page">
      <h2>Operations Dashboard</h2>
      <p>Live snapshot from backend APIs and services.</p>
      {loading ? <p>Loading dashboard metrics...</p> : null}
      {error ? <p className="status-error">{error}</p> : null}
      <div className="card-grid">
        <article className="metric">
          <h3>Service Health</h3>
          <strong>{service}</strong>
        </article>
        <article className="metric">
          <h3>Active Suppliers</h3>
          <strong>{suppliersCount}</strong>
        </article>
        <article className="metric">
          <h3>Open Batches</h3>
          <strong>{batchesCount}</strong>
        </article>
        <article className="metric">
          <h3>Total Inventory (kg)</h3>
          <strong>{inventoryTotal.toFixed(2)}</strong>
        </article>
      </div>
    </section>
  );
}
