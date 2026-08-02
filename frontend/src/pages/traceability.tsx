export default function TraceabilityPage() {
  return (
    <section className="page">
      <h2>Blockchain Traceability</h2>
      <p>Register batch metadata on Sepolia and verify it publicly.</p>
      <form className="form">
        <div className="row">
          <input placeholder="Batch ID" />
          <input placeholder="Supplier IDs (comma separated)" />
          <input placeholder="Processing Date Unix Timestamp" />
        </div>
        <div className="row">
          <select defaultValue="C5">
            <option value="Alba">Alba</option>
            <option value="C5">C5</option>
            <option value="C4">C4</option>
            <option value="Mexico">Mexico</option>
            <option value="Hamburg">Hamburg</option>
          </select>
          <input placeholder="Export Destination" />
          <input placeholder="Logistics Handover Unix Timestamp" />
        </div>
        <button type="button">Register On-chain Metadata</button>
      </form>
    </section>
  );
}
