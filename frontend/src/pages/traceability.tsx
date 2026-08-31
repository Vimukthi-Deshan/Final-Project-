import { FormEvent, useEffect, useState } from "react";

import {
  autoRecordSupplierOnChain,
  getSupplierTraceabilityInsights,
  listSuppliers,
  markSupplierVerifiedOnChain,
  recordSupplierOnChain,
  type SupplierTraceabilityInsights,
  type SupplierPayload,
  updateSupplierProductCountOnChain,
  verifySupplierHashOnChain,
  verifySupplierOnChain,
} from "../components/api-client";

export default function TraceabilityPage() {
  const [suppliers, setSuppliers] = useState<SupplierPayload[]>([]);
  const [mongoDbId, setMongoDbId] = useState("");
  const [dataHash, setDataHash] = useState("");
  const [productCount, setProductCount] = useState("0");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [insights, setInsights] = useState<SupplierTraceabilityInsights | null>(
    null,
  );

  useEffect(() => {
    void (async () => {
      const data = await listSuppliers();
      setSuppliers(data);
    })();
  }, []);

  useEffect(() => {
    if (!mongoDbId.trim()) {
      setInsights(null);
      return;
    }

    void (async () => {
      try {
        const data = await getSupplierTraceabilityInsights(mongoDbId);
        setInsights(data);
      } catch {
        setInsights(null);
      }
    })();
  }, [mongoDbId]);

  function onSupplierSelect(value: string) {
    setMongoDbId(value);
    const selected = suppliers.find(
      (supplier) => supplier.supplierName === value,
    );
    if (selected?.blockchainRef?.hash) {
      setDataHash(selected.blockchainRef.hash);
    }
  }

  async function executeAction(action: () => Promise<Record<string, unknown>>) {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const data = await action();
      setResult(data);
      const supplierInsights = await getSupplierTraceabilityInsights(mongoDbId);
      setInsights(supplierInsights);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Blockchain traceability request failed";

      if (message.toLowerCase().includes("supplier already recorded")) {
        setError(
          "Supplier is already recorded on-chain. Use Verify Supplier State or Update Product Count.",
        );
      } else if (message.toLowerCase().includes("supplier not found")) {
        setError(
          "Supplier is not recorded on-chain yet. Use Auto Record From Supplier Profile first.",
        );
      } else {
        setError(message);
      }
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

  async function onAutoRecordFromProfile() {
    await executeAction(() =>
      autoRecordSupplierOnChain(mongoDbId, Number(productCount)),
    );
  }

  function getString(value: unknown) {
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : null;
  }

  function getNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  function getBoolean(value: unknown) {
    return typeof value === "boolean" ? value : null;
  }

  function shortHash(value: string, head = 10, tail = 8) {
    if (value.length <= head + tail + 3) {
      return value;
    }
    return `${value.slice(0, head)}...${value.slice(-tail)}`;
  }

  function renderResultPanel() {
    if (!result) {
      return null;
    }

    const txHash = getString(result.txHash) ?? getString(result.txId);
    const contractAddress = getString(result.contractAddress);
    const network = getString(result.network);
    const chainId = getNumber(result.chainId);
    const blockNumber = getNumber(result.blockNumber);
    const explorerUrl = getString(result.explorerUrl);
    const valid = getBoolean(result.valid);
    const verified = getBoolean(result.verified);
    const stateLabel =
      valid !== null
        ? valid
          ? "Hash Verified"
          : "Hash Mismatch"
        : verified !== null
          ? verified
            ? "Supplier Verified On-Chain"
            : "Supplier Not Verified On-Chain"
          : "Action Completed";

    return (
      <section className="metric">
        <h3>Last Blockchain Action</h3>
        <p className={valid === false ? "status-error" : "status-ok"}>
          {stateLabel}
        </p>

        <div className="kv supplier-kv">
          <span>Supplier ID</span>
          <span>{mongoDbId}</span>

          {network ? (
            <>
              <span>Network</span>
              <span>{network}</span>
            </>
          ) : null}

          {chainId !== null ? (
            <>
              <span>Chain ID</span>
              <span>{chainId}</span>
            </>
          ) : null}

          {blockNumber !== null ? (
            <>
              <span>Block Number</span>
              <span>{blockNumber}</span>
            </>
          ) : null}

          {txHash ? (
            <>
              <span>Transaction</span>
              <span className="mono-text" title={txHash}>
                {shortHash(txHash)}
              </span>
            </>
          ) : null}

          {contractAddress ? (
            <>
              <span>Contract</span>
              <span className="mono-text" title={contractAddress}>
                {shortHash(contractAddress)}
              </span>
            </>
          ) : null}

          {explorerUrl ? (
            <>
              <span>Explorer</span>
              <a
                className="link-inline"
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open transaction on explorer
              </a>
            </>
          ) : null}
        </div>

        <details>
          <summary>Technical details</summary>
          <pre className="metric">{JSON.stringify(result, null, 2)}</pre>
        </details>
      </section>
    );
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
      <p>
        Practical flow: choose a supplier, click "Auto Record From Supplier
        Profile", then use Verify / Mark Verified / Update Product Count.
      </p>
      {error ? <p className="status-error">{error}</p> : null}
      <form className="form" onSubmit={onRecordSupplier}>
        <div className="row">
          <label className="form-field">
            <span>Supplier</span>
            <select
              value={mongoDbId}
              onChange={(event) => onSupplierSelect(event.target.value)}
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option
                  key={supplier.supplierName}
                  value={supplier.supplierName}
                >
                  {supplier.supplierName}
                </option>
              ))}
            </select>
          </label>
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
          <button
            type="button"
            disabled={loading || !mongoDbId}
            onClick={() => void onAutoRecordFromProfile()}
          >
            Auto Record From Supplier Profile
          </button>
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

      {insights ? (
        <section className="metric">
          <h3>Supplier Insights</h3>
          <div className="kv supplier-kv">
            <span>Supplier</span>
            <span>{insights.supplier.supplierName}</span>
            <span>Contact</span>
            <span>{insights.supplier.contactPerson}</span>
            <span>Location</span>
            <span>
              {insights.supplier.city}, {insights.supplier.country}
            </span>
            <span>Total Batches</span>
            <span>{insights.contribution.totalBatches}</span>
            <span>Total Contribution (kg)</span>
            <span>{insights.contribution.totalContributionKg}</span>
          </div>

          <h4>Supplier Products</h4>
          {insights.supplier.products.length === 0 ? (
            <p className="help-text">
              No products defined for this supplier profile yet.
            </p>
          ) : (
            <div className="forecast-table-wrap">
              <table className="forecast-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Grade</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.supplier.products.map((product, index) => (
                    <tr key={`${product.productName}-${index}`}>
                      <td>{product.productName}</td>
                      <td>{product.grade ?? "N/A"}</td>
                      <td>
                        {product.quantity}
                        {product.quantityUnit ? ` ${product.quantityUnit}` : ""}
                      </td>
                      <td>
                        {product.price}
                        {product.currency ? ` ${product.currency}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h4>Batch Contributions</h4>
          {insights.contribution.batches.length === 0 ? (
            <p className="help-text">
              This supplier has no recorded batch contributions yet.
            </p>
          ) : (
            <div className="forecast-table-wrap">
              <table className="forecast-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Date</th>
                    <th>Grade</th>
                    <th>Destination</th>
                    <th>Contribution (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.contribution.batches.map((batch) => (
                    <tr key={batch.batchId}>
                      <td>{batch.batchId}</td>
                      <td>{batch.processingDate}</td>
                      <td>{batch.qualityGrade ?? "N/A"}</td>
                      <td>{batch.exportDestination}</td>
                      <td>{batch.contributionKg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {renderResultPanel()}
    </section>
  );
}
