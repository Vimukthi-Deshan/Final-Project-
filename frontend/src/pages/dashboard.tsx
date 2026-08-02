export default function DashboardPage() {
  return (
    <section className="page">
      <h2>Operations Dashboard</h2>
      <p>High-level snapshot of the six project modules in one place.</p>
      <div className="card-grid">
        <article className="metric">
          <h3>Active Suppliers</h3>
          <strong>12</strong>
        </article>
        <article className="metric">
          <h3>Open Batches</h3>
          <strong>31</strong>
        </article>
        <article className="metric">
          <h3>Inventory Alerts</h3>
          <strong>2</strong>
        </article>
        <article className="metric">
          <h3>On-chain Registrations</h3>
          <strong>18</strong>
        </article>
      </div>
    </section>
  );
}
