import { FormEvent, useEffect, useRef, useState } from "react";

import {
  generateInvoice,
  getInvoice,
  listBatches,
  listInvoices,
  listSuppliers,
  type InvoiceItem,
  type InvoiceParty,
  type ProformaInvoice,
  type BatchPayload,
  type SupplierPayload,
} from "../components/api-client";

type ItemDraft = {
  productName: string;
  quantity: string;
  price: string;
  hsCode: string;
  quantityUnit: string;
  grade: string;
};

const emptyParty = (): InvoiceParty => ({
  name: "",
  address: "",
  contact: "",
  email: "",
  taxId: "",
});

const emptyItem = (): ItemDraft => ({
  productName: "",
  quantity: "",
  price: "",
  hsCode: "",
  quantityUnit: "kg",
  grade: "",
});

function formatDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString();
}

function statusBadgeClass(status: string) {
  if (status === "paid") return "badge-ok";
  if (status === "pending") return "badge-warn";
  if (status === "failed") return "badge-err";
  return "badge-neutral";
}

function InvoiceView({
  invoice,
  onBack,
}: {
  invoice: ProformaInvoice;
  onBack: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <div className="no-print button-row" style={{ marginBottom: "0.8rem" }}>
        <button
          type="button"
          className="button-soft"
          onClick={onBack}
          style={{ width: "auto" }}
        >
          Back to list
        </button>
        <button type="button" onClick={handlePrint} style={{ width: "auto" }}>
          Print / Save as PDF
        </button>
      </div>

      <div className="invoice-wrapper" ref={printRef} id="invoice-content">
        <div className="invoice-header-band">
          <div>
            <div className="invoice-brand">Canela Trace</div>
            <div className="invoice-title">
              {invoice.type === "PROFORMA"
                ? "Proforma Invoice"
                : "Commercial Invoice"}
            </div>
            <div className="invoice-id">#{invoice.documentId}</div>
          </div>
          <div className="invoice-meta-right">
            <span
              className={`invoice-badge ${statusBadgeClass(invoice.paymentStatus)}`}
            >
              {invoice.paymentStatus.toUpperCase()}
            </span>
            <span
              className="invoice-badge badge-neutral"
              style={{ marginTop: "0.3rem" }}
            >
              {invoice.type}
            </span>
          </div>
        </div>

        <div className="invoice-date-row">
          <div>
            <strong>Date</strong>
            <div>{formatDate(invoice.date)}</div>
          </div>
          <div>
            <strong>Due Date</strong>
            <div>{formatDate(invoice.dueDate)}</div>
          </div>
          <div>
            <strong>Currency</strong>
            <div>{invoice.currency}</div>
          </div>
          <div>
            <strong>Batch</strong>
            <div>{invoice.batchId}</div>
          </div>
          <div>
            <strong>Total</strong>
            <div className="invoice-total">
              {invoice.currency} {invoice.total.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="invoice-parties">
          <div className="invoice-party-card">
            <div className="invoice-party-header">Seller</div>
            <div className="invoice-party-body">
              <strong>{invoice.seller.name}</strong>
              <div>{invoice.seller.address}</div>
              <div>{invoice.seller.contact}</div>
              <div>{invoice.seller.email}</div>
              {invoice.seller.taxId ? (
                <div>Tax ID: {invoice.seller.taxId}</div>
              ) : null}
            </div>
          </div>
          <div className="invoice-party-card">
            <div className="invoice-party-header">Buyer</div>
            <div className="invoice-party-body">
              <strong>{invoice.buyer.name}</strong>
              <div>{invoice.buyer.address}</div>
              <div>{invoice.buyer.contact}</div>
              <div>{invoice.buyer.email}</div>
              {invoice.buyer.taxId ? (
                <div>Tax ID: {invoice.buyer.taxId}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="invoice-section-title">Invoice Items</div>
        <div className="forecast-table-wrap">
          <table className="forecast-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>HS Code</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    <div>{item.productName}</div>
                    {item.grade ? (
                      <small style={{ color: "#7c6555" }}>
                        Grade: {item.grade}
                      </small>
                    ) : null}
                  </td>
                  <td>{item.hsCode ?? "-"}</td>
                  <td>{item.quantity}</td>
                  <td>{item.quantityUnit ?? "-"}</td>
                  <td>
                    {invoice.currency} {item.price.toFixed(2)}
                  </td>
                  <td>
                    <strong>
                      {invoice.currency} {item.lineTotal.toFixed(2)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} style={{ textAlign: "right" }}>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>
                    {invoice.currency} {invoice.total.toFixed(2)}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {invoice.incoterm ||
        invoice.portOfLoading ||
        invoice.portOfDischarge ? (
          <>
            <div className="invoice-section-title">Shipping Details</div>
            <div className="invoice-date-row">
              {invoice.incoterm ? (
                <div>
                  <strong>Incoterm</strong>
                  <div>{invoice.incoterm}</div>
                </div>
              ) : null}
              {invoice.incotermNamedPlace ? (
                <div>
                  <strong>Named Place</strong>
                  <div>{invoice.incotermNamedPlace}</div>
                </div>
              ) : null}
              {invoice.portOfLoading ? (
                <div>
                  <strong>Port of Loading</strong>
                  <div>{invoice.portOfLoading}</div>
                </div>
              ) : null}
              {invoice.portOfDischarge ? (
                <div>
                  <strong>Port of Discharge</strong>
                  <div>{invoice.portOfDischarge}</div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {invoice.countryOfOrigin ||
        invoice.paymentTerms ||
        invoice.amountInWords ? (
          <>
            <div className="invoice-section-title">Additional Information</div>
            <div className="invoice-additional">
              {invoice.countryOfOrigin ? (
                <p>
                  <strong>Country of Origin:</strong> {invoice.countryOfOrigin}
                </p>
              ) : null}
              {invoice.paymentTerms ? (
                <p>
                  <strong>Payment Terms:</strong> {invoice.paymentTerms.term}
                  {invoice.paymentTerms.notes
                    ? ` — ${invoice.paymentTerms.notes}`
                    : ""}
                </p>
              ) : null}
              {invoice.amountInWords ? (
                <p>
                  <strong>Amount in Words:</strong> {invoice.amountInWords}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {invoice.blockchainRef ? (
          <>
            <div className="invoice-section-title invoice-blockchain-title">
              Blockchain Verification
            </div>
            <div className="invoice-blockchain">
              <div className="kv">
                <span>Transaction Hash</span>
                <span className="mono-text">
                  {invoice.blockchainRef.hash ?? "-"}
                </span>
                <span>Transaction ID</span>
                <span>
                  {invoice.blockchainRef.explorerUrl ? (
                    <a
                      className="link-inline"
                      href={invoice.blockchainRef.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {String(invoice.blockchainRef.txId ?? "").slice(0, 20)}...
                      View on explorer
                    </a>
                  ) : (
                    <span className="mono-text">
                      {invoice.blockchainRef.txId ?? "-"}
                    </span>
                  )}
                </span>
                <span>Network</span>
                <span>{invoice.blockchainRef.network ?? "-"}</span>
                <span>Recorded At</span>
                <span>{formatDate(invoice.blockchainRef.recordedAt)}</span>
                <span>Contract Address</span>
                <span className="mono-text">
                  {invoice.blockchainRef.contractAddress ?? "-"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="status-error" style={{ marginTop: "0.8rem" }}>
            No blockchain record — this invoice has not been recorded on-chain.
          </div>
        )}
      </div>
    </>
  );
}

export default function ExportDocsPage() {
  const didLoad = useRef(false);
  const [batches, setBatches] = useState<BatchPayload[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierPayload[]>([]);
  const [invoices, setInvoices] = useState<ProformaInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProformaInvoice | null>(null);

  const [batchId, setBatchId] = useState("");
  const [invoiceType, setInvoiceType] = useState<"PROFORMA" | "COMMERCIAL">(
    "PROFORMA",
  );
  const [currency, setCurrency] = useState("USD");
  const [dueDate, setDueDate] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [incotermPlace, setIncotermPlace] = useState("");
  const [portLoad, setPortLoad] = useState("");
  const [portDischarge, setPortDischarge] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [countryOrigin, setCountryOrigin] = useState("Sri Lanka");
  const [amountWords, setAmountWords] = useState("");

  const [seller, setSeller] = useState<InvoiceParty>(emptyParty());
  const [buyer, setBuyer] = useState<InvoiceParty>(emptyParty());
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    void (async () => {
      const [b, s, inv] = await Promise.all([
        listBatches(),
        listSuppliers(),
        listInvoices(),
      ]);
      setBatches(b);
      setSuppliers(s);
      setInvoices(inv);
    })();
  }, []);

  function updateItem(index: number, field: keyof ItemDraft, value: string) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setStatus(null);

      const builtItems = items
        .filter((it) => it.productName.trim() && it.quantity && it.price)
        .map((it) => ({
          productName: it.productName.trim(),
          quantity: Number(it.quantity),
          price: Number(it.price),
          hsCode: it.hsCode || undefined,
          quantityUnit: it.quantityUnit || undefined,
          grade: it.grade || undefined,
          batchId: batchId || undefined,
        }));

      if (builtItems.length === 0) {
        setError(
          "Add at least one valid item with product name, quantity, and price.",
        );
        return;
      }

      const payload = {
        batchId,
        type: invoiceType,
        currency,
        dueDate: dueDate || undefined,
        seller: { ...seller, taxId: seller.taxId || undefined },
        buyer: { ...buyer, taxId: buyer.taxId || undefined },
        items: builtItems,
        incoterm: incoterm || undefined,
        incotermNamedPlace: incotermPlace || undefined,
        portOfLoading: portLoad || undefined,
        portOfDischarge: portDischarge || undefined,
        paymentTerms: paymentTerm ? { term: paymentTerm } : undefined,
        countryOfOrigin: countryOrigin || undefined,
        amountInWords: amountWords || undefined,
      };

      const invoice = await generateInvoice(
        payload as Parameters<typeof generateInvoice>[0],
      );
      setInvoices((prev) => [invoice, ...prev]);
      setStatus(`Invoice ${invoice.documentId} created.`);
      setSelected(invoice);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate invoice",
      );
    } finally {
      setLoading(false);
    }
  }

  async function openInvoice(documentId: string) {
    try {
      const inv = await getInvoice(documentId);
      setSelected(inv);
    } catch {
      setError("Failed to load invoice");
    }
  }

  if (selected) {
    return (
      <section className="page">
        <InvoiceView invoice={selected} onBack={() => setSelected(null)} />
      </section>
    );
  }

  return (
    <section className="page">
      <h2>Export Documents</h2>
      <p>Generate a proforma or commercial invoice for a batch.</p>

      {status ? <p className="status-ok">{status}</p> : null}
      {error ? <p className="status-error">{error}</p> : null}

      <form className="form" onSubmit={onSubmit}>
        <h3 style={{ margin: "0.5rem 0 0.25rem" }}>Invoice Header</h3>
        <div className="row">
          <label className="form-field">
            <span>Batch</span>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              required
            >
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchId} — {b.exportDestination}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Type</span>
            <select
              value={invoiceType}
              onChange={(e) =>
                setInvoiceType(e.target.value as "PROFORMA" | "COMMERCIAL")
              }
            >
              <option value="PROFORMA">Proforma Invoice</option>
              <option value="COMMERCIAL">Commercial Invoice</option>
            </select>
          </label>
          <label className="form-field">
            <span>Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="LKR">LKR</option>
            </select>
          </label>
          <label className="form-field">
            <span>Due Date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>

        {(["Seller", "Buyer"] as const).map((role) => {
          const party = role === "Seller" ? seller : buyer;
          const setParty = role === "Seller" ? setSeller : setBuyer;
          return (
            <div key={role}>
              <h3 style={{ margin: "0.75rem 0 0.25rem" }}>{role}</h3>
              <div className="row">
                {(
                  ["name", "address", "contact", "email", "taxId"] as const
                ).map((field) => (
                  <label className="form-field" key={field}>
                    <span>
                      {field === "taxId"
                        ? "Tax ID"
                        : field.charAt(0).toUpperCase() + field.slice(1)}
                    </span>
                    <input
                      value={party[field] ?? ""}
                      onChange={(e) =>
                        setParty((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      required={field !== "taxId"}
                      type={field === "email" ? "email" : "text"}
                    />
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <h3 style={{ margin: "0.75rem 0 0.25rem" }}>Line Items</h3>
        {items.map((item, index) => (
          <div className="row" key={index} style={{ alignItems: "end" }}>
            <label className="form-field">
              <span>Product Name</span>
              <input
                value={item.productName}
                onChange={(e) =>
                  updateItem(index, "productName", e.target.value)
                }
                required
              />
            </label>
            <label className="form-field">
              <span>Qty</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span>Unit</span>
              <input
                value={item.quantityUnit}
                onChange={(e) =>
                  updateItem(index, "quantityUnit", e.target.value)
                }
              />
            </label>
            <label className="form-field">
              <span>Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={(e) => updateItem(index, "price", e.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span>Grade</span>
              <select
                value={item.grade}
                onChange={(e) => updateItem(index, "grade", e.target.value)}
              >
                <option value="">-</option>
                {["Alba", "C5", "C4", "Mexico", "Hamburg"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>HS Code</span>
              <input
                value={item.hsCode}
                onChange={(e) => updateItem(index, "hsCode", e.target.value)}
                placeholder="0906.11"
              />
            </label>
            <button
              type="button"
              className="button-soft"
              disabled={items.length === 1}
              onClick={() =>
                setItems((prev) => prev.filter((_, i) => i !== index))
              }
              style={{
                alignSelf: "end",
                width: "auto",
                padding: "0.7rem 1rem",
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button-soft"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
          style={{ width: "auto" }}
        >
          Add Line Item
        </button>

        <h3 style={{ margin: "0.75rem 0 0.25rem" }}>Shipping & Terms</h3>
        <div className="row">
          <label className="form-field">
            <span>Incoterm</span>
            <input
              value={incoterm}
              onChange={(e) => setIncoterm(e.target.value)}
              placeholder="CIF"
            />
          </label>
          <label className="form-field">
            <span>Named Place</span>
            <input
              value={incotermPlace}
              onChange={(e) => setIncotermPlace(e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Port of Loading</span>
            <input
              value={portLoad}
              onChange={(e) => setPortLoad(e.target.value)}
              placeholder="Colombo"
            />
          </label>
          <label className="form-field">
            <span>Port of Discharge</span>
            <input
              value={portDischarge}
              onChange={(e) => setPortDischarge(e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Payment Terms</span>
            <input
              value={paymentTerm}
              onChange={(e) => setPaymentTerm(e.target.value)}
              placeholder="30% advance, 70% on BL"
            />
          </label>
          <label className="form-field">
            <span>Country of Origin</span>
            <input
              value={countryOrigin}
              onChange={(e) => setCountryOrigin(e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Amount in Words</span>
            <input
              value={amountWords}
              onChange={(e) => setAmountWords(e.target.value)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: "0.5rem" }}
        >
          {loading ? "Generating..." : "Generate Invoice"}
        </button>
      </form>

      {invoices.length > 0 ? (
        <>
          <h3 style={{ marginTop: "1.5rem" }}>Generated Invoices</h3>
          <div className="forecast-table-wrap">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Document ID</th>
                  <th>Type</th>
                  <th>Batch</th>
                  <th>Buyer</th>
                  <th>Currency</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.documentId}>
                    <td className="mono-text">{inv.documentId}</td>
                    <td>{inv.type}</td>
                    <td>{inv.batchId}</td>
                    <td>{inv.buyer.name}</td>
                    <td>{inv.currency}</td>
                    <td>{inv.total.toFixed(2)}</td>
                    <td>{inv.paymentStatus.toUpperCase()}</td>
                    <td>{formatDate(inv.date)}</td>
                    <td>
                      <button
                        type="button"
                        className="button-soft"
                        style={{
                          width: "auto",
                          padding: "0.3rem 0.8rem",
                          fontSize: "0.85rem",
                        }}
                        onClick={() => void openInvoice(inv.documentId)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
