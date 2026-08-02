export default function ForecastingPage() {
  return (
    <section className="page">
      <h2>Demand Forecasting</h2>
      <p>
        Comparison area for naive baseline, ARIMA, Prophet, and lightweight
        LSTM.
      </p>
      <div className="card-grid">
        <article className="metric">
          <h3>Naive Baseline</h3>
          <p>Interpretability: High</p>
        </article>
        <article className="metric">
          <h3>ARIMA</h3>
          <p>Interpretability: High</p>
        </article>
        <article className="metric">
          <h3>Prophet</h3>
          <p>Interpretability: High</p>
        </article>
        <article className="metric">
          <h3>Lightweight LSTM</h3>
          <p>Interpretability: Low</p>
        </article>
      </div>
    </section>
  );
}
