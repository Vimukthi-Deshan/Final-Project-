import { FormEvent, useState } from "react";

import {
  markSupplierVerifiedOnChain,
  recordSupplierOnChain,
  updateSupplierProductCountOnChain,
  verifySupplierHashOnChain,
  verifySupplierOnChain,
} from "../components/api-client";

export default function TraceabilityPage() {
  const [mongoDbId, setMongoDbId] = useState("");
  const [dataHash, setDataHash] = useState("");
  const [productCount, setProductCount] = useState("0");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function executeAction(action: () => Promise<Record<string, unknown>>) {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const data = await action();
      setResult(data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Blockchain traceability request failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onRecordSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await executeAction(() =>
      recordSupplierOnChain(mongoDbId, {
        dataHash,
        productCount: Number(productCount),
      }),
    );
  }

  async function onMarkVerified() {
    await executeAction(() => markSupplierVerifiedOnChain(mongoDbId));
  }

  async function onUpdateProducts() {
    await executeAction(() =>
      updateSupplierProductCountOnChain(mongoDbId, Number(productCount)),
    );
  }

  async function onVerifySupplier() {
    await executeAction(() => verifySupplierOnChain(mongoDbId));
  }

  async function onVerifyHash() {
    await executeAction(async () => {
      const response = await verifySupplierHashOnChain(mongoDbId, dataHash);
      return {
        ...response,
        mongoDbId,
        dataHash,
      };
    });
  }

  return (
    <section className="page">
      <h2>Blockchain Traceability</h2>
      <p>Record and verify supplier trust data on Sepolia.</p>
      <p>
        Saving a supplier in Supplier Management stores data in MongoDB only. To
        appear on-chain, you must run "Record Supplier On-Chain" with the same
        supplier ID used in batches.
      </p>
      {error ? <p className="status-error">{error}</p> : null}
      <form className="form" onSubmit={onRecordSupplier}>
        <div className="row">
          <input
            placeholder="Supplier ID used in batch (example: Demo Cinnamon Supplier B)"
            value={mongoDbId}
            onChange={(event) => setMongoDbId(event.target.value)}
            required
          />
          <input
            placeholder="Data Hash (0x-prefixed bytes32)"
            value={dataHash}
            onChange={(event) => setDataHash(event.target.value)}
            required
          />
          <input
            placeholder="Product Count"
            type="number"
            min={0}
            value={productCount}
            onChange={(event) => setProductCount(event.target.value)}
            required
          />
        </div>
        <div className="row">
          <button type="submit" disabled={loading || !mongoDbId || !dataHash}>
            {loading ? "Submitting..." : "Record Supplier On-Chain"}
          </button>
          <button
            type="button"
            className="button-soft"
            disabled={loading || !mongoDbId}
            onClick={() => void onMarkVerified()}
          >
            Mark Supplier Verified
          </button>
          <button
            type="button"
            className="button-soft"
            disabled={loading || !mongoDbId}
            onClick={() => void onUpdateProducts()}
          >
            Update Product Count
          </button>
        </div>
        <div className="row">
          <button
            type="button"
            className="button-soft"
            disabled={loading || !mongoDbId}
            onClick={() => void onVerifySupplier()}
          >
            Verify Supplier State
          </button>
          <button
            type="button"
            className="button-soft"
            disabled={loading || !mongoDbId || !dataHash}
            onClick={() => void onVerifyHash()}
          >
            Verify Supplier Hash
          </button>
        </div>
      </form>
      {result ? (
        <pre className="metric">{JSON.stringify(result, null, 2)}</pre>
      ) : null}
    </section>
  );
}
