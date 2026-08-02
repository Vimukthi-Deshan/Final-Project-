export default function VerifyPage() {
  return (
    <section className="page">
      <h2>Public Batch Verification</h2>
      <p>Buyer-facing verification view for QR traceability checks.</p>
      <div className="metric">
        <div className="kv">
          <span>Batch ID</span>
          <span>CC-BATCH-2026-08-00001</span>
          <span>Status</span>
          <span>Awaiting live backend verification</span>
          <span>Network</span>
          <span>Ethereum Sepolia</span>
        </div>
      </div>
    </section>
  );
}
