import { FormEvent, useEffect, useRef, useState } from "react";

import {
  createBatch,
  listBatches,
  listSuppliers,
  type BatchCreatePayload,
  type BatchPayload,
  type SupplierPayload,
} from "../components/api-client";

type SupplierContributionDraft = {
  supplierId: string;
  contributionKg: string;
};

export default function BatchesPage() {
  const didLoadRef = useRef(false);
  const [batches, setBatches] = useState<BatchPayload[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [processingDate, setProcessingDate] = useState("");
  const [exportDestination, setExportDestination] = useState("");
  const [supplierPairs, setSupplierPairs] = useState<
    SupplierContributionDraft[]
  >([{ supplierId: "", contributionKg: "" }]);
  const [qualityGrade, setQualityGrade] =
    useState<BatchPayload["qualityGrade"]>("C5");
  const [logisticsHandoverAt, setLogisticsHandoverAt] = useState("");

  async function refreshBatches() {
    const data = await listBatches();
    setBatches(data);
  }

  async function refreshSuppliers() {
    const data = await listSuppliers();
    setSuppliers(data);
  }

  useEffect(() => {
    if (didLoadRef.current) {
      return;
    }
    didLoadRef.current = true;

    void refreshSuppliers();
    void refreshBatches();
  }, []);

  function updateSupplierContribution(
    index: number,
    field: keyof SupplierContributionDraft,
    value: string,
  ) {
    setSupplierPairs((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addSupplierContribution() {
    setSupplierPairs((current) => [
      ...current,
      { supplierId: "", contributionKg: "" },
    ]);
  }

  function removeSupplierContribution(index: number) {
    setSupplierPairs((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setStatus(null);

      const payload: BatchCreatePayload = {
        sourceSuppliers: supplierPairs
          .map((item) => ({
            supplierId: item.supplierId.trim(),
            contributionKg: Number(item.contributionKg),
          }))
          .filter(
            (item) =>
              item.supplierId &&
              Number.isFinite(item.contributionKg) &&
              item.contributionKg > 0,
          ),
        processingDate,
        qualityGrade,
        exportDestination,
        logisticsHandoverAt: logisticsHandoverAt || undefined,
      };

      await createBatch(payload);
      await refreshBatches();
      setStatus("Batch created successfully.");
      setProcessingDate("");
      setExportDestination("");
      setSupplierPairs([{ supplierId: "", contributionKg: "" }]);
      setQualityGrade("C5");
      setLogisticsHandoverAt("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Batch create failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <h2>Batch Management</h2>
      <p>
        Create a batch and a QR code is generated automatically for public
        verification.
      </p>
      {status ? <p className="status-ok">{status}</p> : null}
      {error ? <p className="status-error">{error}</p> : null}
      <form className="form" onSubmit={onSubmit}>
        <div className="row">
          <label className="form-field">
            <span>Processing Date</span>
            <input
              type="datetime-local"
              value={processingDate}
              onChange={(event) => setProcessingDate(event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Export Destination</span>
            <input
              placeholder="e.g. Hamburg"
              value={exportDestination}
              onChange={(event) => setExportDestination(event.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-field">
          <span>Supplier Contributions</span>
          {supplierPairs.map((item, index) => (
            <div className="row" key={`supplier-row-${index}`}>
              <input
                list="supplier-id-options"
                placeholder="Type supplier ID or select one"
                value={item.supplierId}
                onChange={(event) =>
                  updateSupplierContribution(
                    index,
                    "supplierId",
                    event.target.value,
                  )
                }
                required
              />
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Contribution kg"
                value={item.contributionKg}
                onChange={(event) =>
                  updateSupplierContribution(
                    index,
                    "contributionKg",
                    event.target.value,
                  )
                }
                required
              />
              <button
                type="button"
                onClick={() => removeSupplierContribution(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <datalist id="supplier-id-options">
            {suppliers.map((supplier) => (
              <option key={supplier.supplierName} value={supplier.supplierName}>
                {supplier.contactPerson} - {supplier.city}
              </option>
            ))}
          </datalist>
          <p className="help-text">
            Start typing to pick a supplier from the live database.
          </p>
          <button type="button" onClick={addSupplierContribution}>
            Add Supplier
          </button>
        </div>
        <div className="row">
          <label className="form-field">
            <span>Quality Grade</span>
            <select
              value={qualityGrade ?? "C5"}
              onChange={(event) =>
                setQualityGrade(
                  event.target.value as
                    | "Alba"
                    | "C5"
                    | "C4"
                    | "Mexico"
                    | "Hamburg",
                )
              }
            >
              <option value="Alba">Alba</option>
              <option value="C5">C5</option>
              <option value="C4">C4</option>
              <option value="Mexico">Mexico</option>
              <option value="Hamburg">Hamburg</option>
            </select>
          </label>
          <label className="form-field">
            <span>Logistics Handover (optional)</span>
            <input
              type="datetime-local"
              value={logisticsHandoverAt}
              onChange={(event) => setLogisticsHandoverAt(event.target.value)}
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Batch"}
        </button>
      </form>

      <h3>Batches</h3>
      <div className="card-grid">
        {batches.map((batch) => (
          <article className="metric" key={batch.batchId}>
            <h3>{batch.batchId}</h3>
            <p>Destination: {batch.exportDestination}</p>
            <p>Grade: {batch.qualityGrade ?? "N/A"}</p>
            <p>Suppliers: {batch.sourceSuppliers.length}</p>
            {batch.qrCodeDataUrl ? (
              <div className="qr-block">
                <img
                  src={batch.qrCodeDataUrl}
                  alt={`QR code for ${batch.batchId}`}
                  className="qr-image"
                />
                <a
                  href={batch.verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="link-inline"
                >
                  Open verification page
                </a>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
