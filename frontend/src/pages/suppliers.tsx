export default function SuppliersPage() {
  return (
    <section className="page">
      <h2>Supplier Management</h2>
      <p>
        Create and inspect supplier records before wiring live backend CRUD.
      </p>
      <form className="form">
        <div className="row">
          <input placeholder="Supplier ID (SUP-001)" />
          <input placeholder="Supplier Name" />
          <input placeholder="Region" />
        </div>
        <div className="row">
          <input placeholder="Email" />
          <input placeholder="Phone" />
          <input placeholder="Certification" />
        </div>
        <button type="button">Save Supplier</button>
      </form>
    </section>
  );
}
