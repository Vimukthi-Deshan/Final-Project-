export default function BatchesPage() {
  return (
    <section className="page">
      <h2>Batch Management</h2>
      <p>Use the required format CC-BATCH-YYYY-MM-XXXXX for every new batch.</p>
      <form className="form">
        <div className="row">
          <input placeholder="CC-BATCH-2026-08-00001" />
          <input placeholder="Processing Date" />
          <input placeholder="Export Destination" />
        </div>
        <div className="row">
          <input placeholder="Supplier IDs (comma separated)" />
          <input placeholder="Quality Grade" />
          <input placeholder="Logistics Handover Timestamp" />
        </div>
        <button type="button">Create Batch</button>
      </form>
    </section>
  );
}
