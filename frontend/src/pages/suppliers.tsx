import { FormEvent, useEffect, useRef, useState } from "react";

import {
  createSupplier,
  listSuppliers,
  type SupplierPayload,
} from "../components/api-client";

export default function SuppliersPage() {
  const didLoadRef = useRef(false);
  const [suppliers, setSuppliers] = useState<SupplierPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [supplierName, setSupplierName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [certification, setCertification] = useState("");
  const [autoRecordOnChain, setAutoRecordOnChain] = useState(false);
  const [onChainProductCount, setOnChainProductCount] = useState("0");

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
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setStatus(null);

      const payload: SupplierPayload = {
        supplierName: supplierName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
        products: [],
        certifications: certification
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        reviews: [],
        autoRecordOnChain,
        onChainProductCount: Number(onChainProductCount),
      };

      await createSupplier(payload);
      await refreshSuppliers();
      setStatus(
        autoRecordOnChain
          ? "Supplier saved and recorded on Sepolia."
          : "Supplier saved successfully.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Save failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <h2>Supplier Management</h2>
      <p>Create and inspect supplier records through live backend CRUD.</p>
      {status ? <p className="status-ok">{status}</p> : null}
      {error ? <p className="status-error">{error}</p> : null}
      <form className="form" onSubmit={onSubmit}>
        <div className="row">
          <input
            placeholder="Supplier Name"
            value={supplierName}
            onChange={(event) => setSupplierName(event.target.value)}
            required
          />
          <input
            placeholder="Contact Person"
            value={contactPerson}
            onChange={(event) => setContactPerson(event.target.value)}
            required
          />
          <input
            placeholder="City"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            required
          />
        </div>
        <div className="row">
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
          <input
            placeholder="Address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
          />
        </div>
        <div className="row">
          <input
            placeholder="Country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            required
          />
          <input
            placeholder="Certifications (comma separated)"
            value={certification}
            onChange={(event) => setCertification(event.target.value)}
          />
        </div>
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={autoRecordOnChain}
            onChange={(event) => setAutoRecordOnChain(event.target.checked)}
          />
          <span>Auto-record this supplier on Sepolia</span>
        </label>
        {autoRecordOnChain ? (
          <div className="row">
            <input
              type="number"
              min={0}
              placeholder="On-chain product count"
              value={onChainProductCount}
              onChange={(event) => setOnChainProductCount(event.target.value)}
              required
            />
          </div>
        ) : null}
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Supplier"}
        </button>
      </form>

      <h3>Suppliers</h3>
      <div className="card-grid">
        {suppliers.map((supplier) => (
          <article className="metric" key={supplier.supplierName}>
            <h3>{supplier.supplierName}</h3>
            <div className="kv supplier-kv">
              <span>Contact</span>
              <span>{supplier.contactPerson}</span>
              <span>Email</span>
              <span>{supplier.email}</span>
              <span>Phone</span>
              <span>{supplier.phone}</span>
              <span>Address</span>
              <span>{supplier.address}</span>
              <span>Location</span>
              <span>
                {supplier.city}, {supplier.country}
              </span>
              <span>Created At</span>
              <span>{supplier.createdAt ?? "N/A"}</span>
              <span>Updated At</span>
              <span>{supplier.updatedAt ?? "N/A"}</span>
            </div>

            <h4>Blockchain</h4>
            {supplier.blockchainRef ? (
              <div className="kv supplier-kv">
                <span>Network</span>
                <span>{supplier.blockchainRef.network ?? "N/A"}</span>
                <span>Chain ID</span>
                <span>{supplier.blockchainRef.chainId ?? "N/A"}</span>
                <span>Tx Hash</span>
                <span className="mono-text">
                  {supplier.blockchainRef.txId ?? "N/A"}
                </span>
                <span>Contract</span>
                <span className="mono-text">
                  {supplier.blockchainRef.contractAddress ?? "N/A"}
                </span>
                <span>Data Hash</span>
                <span className="mono-text">
                  {supplier.blockchainRef.hash ?? "N/A"}
                </span>
                <span>Explorer</span>
                {supplier.blockchainRef.explorerUrl ? (
                  <a
                    className="link-inline"
                    href={supplier.blockchainRef.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open transaction
                  </a>
                ) : (
                  <span>N/A</span>
                )}
              </div>
            ) : (
              <p className="help-text">Not recorded on-chain yet.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
