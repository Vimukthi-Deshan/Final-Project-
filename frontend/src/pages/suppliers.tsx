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
        supplierName,
        contactPerson,
        email,
        phone,
        address,
        city,
        country,
        products: [],
        certifications: certification
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        reviews: [],
      };

      await createSupplier(payload);
      await refreshSuppliers();
      setStatus("Supplier saved successfully.");
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
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Supplier"}
        </button>
      </form>

      <h3>Suppliers</h3>
      <div className="card-grid">
        {suppliers.map((supplier) => (
          <article className="metric" key={supplier.supplierName}>
            <h3>{supplier.supplierName}</h3>
            <p>Contact: {supplier.contactPerson}</p>
            <p>
              Location: {supplier.city}, {supplier.country}
            </p>
            <p>Email: {supplier.email}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
