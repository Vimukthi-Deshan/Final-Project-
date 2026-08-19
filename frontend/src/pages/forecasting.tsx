import { FormEvent, useState } from "react";

import {
  ingestAndPredictForecast,
  predictForecast,
  type ForecastIngestionResponse,
} from "../components/api-client";

type ForecastView = {
  model: string;
  horizonDays: number;
  observations: number;
  sourcePath: string;
  dateColumn: string;
  targetColumn: string;
  values: number[];
};

type ForecastStats = {
  min: number;
  max: number;
  avg: number;
  latest: number;
};

type ChartPoint = {
  x: number;
  y: number;
  value: number;
  day: number;
};

function toForecastView(result: Record<string, unknown>): ForecastView | null {
  const valuesRaw = result.values;
  if (!Array.isArray(valuesRaw)) {
    return null;
  }

  const values = valuesRaw
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  return {
    model: String(result.model ?? "unknown"),
    horizonDays: Number(result.horizon_days ?? values.length),
    observations: Number(result.observations ?? 0),
    sourcePath: String(result.source_path ?? "unknown"),
    dateColumn: String(result.date_column ?? "date"),
    targetColumn: String(result.target_column ?? "target"),
    values,
  };
}

function computeStats(values: number[]): ForecastStats | null {
  if (values.length === 0) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const latest = values[values.length - 1];

  return { min, max, avg, latest };
}

function buildChartPoints(values: number[]): ChartPoint[] {
  if (values.length === 0) {
    return [];
  }

  const width = 680;
  const height = 260;
  const paddingX = 24;
  const paddingTop = 18;
  const paddingBottom = 28;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const safeSpan = span === 0 ? 1 : span;

  return values.map((value, index) => {
    const xRatio = values.length === 1 ? 0.5 : index / (values.length - 1);
    const yRatio = (value - min) / safeSpan;
    const x = paddingX + xRatio * (width - paddingX * 2);
    const y =
      height - paddingBottom - yRatio * (height - paddingTop - paddingBottom);
    return {
      x,
      y,
      value,
      day: index + 1,
    };
  });
}

export default function ForecastingPage() {
  const [model, setModel] = useState<"naive" | "arima" | "prophet" | "lstm">(
    "naive",
  );
  const [horizonDays, setHorizonDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [ingestionResult, setIngestionResult] =
    useState<ForecastIngestionResponse | null>(null);
  const [websiteFile, setWebsiteFile] = useState<File | undefined>(undefined);
  const [darazFile, setDarazFile] = useState<File | undefined>(undefined);
  const forecastView = result ? toForecastView(result) : null;
  const forecastStats = forecastView ? computeStats(forecastView.values) : null;
  const chartPoints = forecastView ? buildChartPoints(forecastView.values) : [];
  const chartLine = chartPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const areaLine = chartPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const areaPath =
    chartPoints.length > 0
      ? `${areaLine} ${chartPoints[chartPoints.length - 1].x},232 ${chartPoints[0].x},232`
      : "";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setIngestionResult(null);
      const data = await predictForecast({ model, horizonDays });
      setResult(data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Forecast request failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onIngestAndPredict(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setUploading(true);
      setError(null);
      setResult(null);
      setIngestionResult(null);

      const data = await ingestAndPredictForecast({
        model,
        horizonDays,
        websiteFile,
        darazFile,
      });
      setIngestionResult(data);
      setResult(data.forecast);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Ingestion + forecast request failed",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="page">
      <h2>Demand Forecasting</h2>
      <p>
        Comparison area for naive baseline, ARIMA, Prophet, and lightweight
        LSTM.
      </p>
      {error ? <p className="status-error">{error}</p> : null}

      <form className="form" onSubmit={onSubmit}>
        <div className="row">
          <select
            value={model}
            onChange={(event) =>
              setModel(
                event.target.value as "naive" | "arima" | "prophet" | "lstm",
              )
            }
          >
            <option value="naive">naive</option>
            <option value="arima">arima</option>
            <option value="prophet">prophet</option>
            <option value="lstm">lstm</option>
          </select>
          <input
            type="number"
            min={1}
            max={90}
            value={horizonDays}
            onChange={(event) => setHorizonDays(Number(event.target.value))}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Running..." : "Run Forecast"}
        </button>
      </form>

      <form className="form" onSubmit={onIngestAndPredict}>
        <h3>Upload Website + Daraz CSV</h3>
        <p>
          Upload one or both CSV files. The backend will merge paid orders into
          one daily target series and run the selected forecasting model.
        </p>
        <div className="row">
          <label>
            Website CSV
            <input
              type="file"
              accept=".csv"
              onChange={(event) =>
                setWebsiteFile(event.target.files?.[0] ?? undefined)
              }
            />
          </label>
          <label>
            Daraz CSV
            <input
              type="file"
              accept=".csv"
              onChange={(event) =>
                setDarazFile(event.target.files?.[0] ?? undefined)
              }
            />
          </label>
        </div>
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Ingest Files And Forecast"}
        </button>
      </form>

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

      {result ? (
        <section className="metric">
          <h3>Forecast Output</h3>
          {forecastView ? (
            <>
              <div className="kv">
                <span>Model</span>
                <strong>{forecastView.model}</strong>
                <span>Horizon (days)</span>
                <strong>{forecastView.horizonDays}</strong>
                <span>Observations Used</span>
                <strong>{forecastView.observations}</strong>
                <span>Target Column</span>
                <strong>{forecastView.targetColumn}</strong>
                <span>Source</span>
                <strong className="mono-text">{forecastView.sourcePath}</strong>
              </div>

              {forecastStats ? (
                <div className="forecast-stats-grid">
                  <article className="metric">
                    <h4>Average</h4>
                    <strong>{forecastStats.avg.toFixed(2)}</strong>
                  </article>
                  <article className="metric">
                    <h4>Maximum</h4>
                    <strong>{forecastStats.max.toFixed(2)}</strong>
                  </article>
                  <article className="metric">
                    <h4>Minimum</h4>
                    <strong>{forecastStats.min.toFixed(2)}</strong>
                  </article>
                  <article className="metric">
                    <h4>Latest Point</h4>
                    <strong>{forecastStats.latest.toFixed(2)}</strong>
                  </article>
                </div>
              ) : null}

              {chartPoints.length > 0 ? (
                <div className="forecast-chart-wrap">
                  <h4>Forecast Trend</h4>
                  <svg
                    viewBox="0 0 680 260"
                    role="img"
                    aria-label="Forecast trend chart"
                    className="forecast-chart"
                  >
                    <line
                      x1="24"
                      y1="232"
                      x2="656"
                      y2="232"
                      className="axis-line"
                    />
                    <line
                      x1="24"
                      y1="18"
                      x2="24"
                      y2="232"
                      className="axis-line"
                    />
                    {areaPath ? (
                      <polygon className="forecast-area" points={areaPath} />
                    ) : null}
                    <polyline className="forecast-line" points={chartLine} />
                    {chartPoints.map((point) => (
                      <g key={`p-${point.day}-${point.value}`}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="3"
                          className="forecast-dot"
                        />
                        <title>{`Day ${point.day}: ${point.value.toFixed(2)}`}</title>
                      </g>
                    ))}
                  </svg>
                </div>
              ) : null}

              <div className="forecast-table-wrap">
                <table className="forecast-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Predicted {forecastView.targetColumn}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastView.values.map((value, index) => (
                      <tr key={`${index + 1}-${value}`}>
                        <td>Day {index + 1}</td>
                        <td>{value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="help-text">
              Forecast returned in an unexpected format.
            </p>
          )}
        </section>
      ) : null}

      {ingestionResult ? (
        <section className="metric">
          <h3>Ingestion Summary</h3>
          <div className="kv">
            <span>Ingestion ID</span>
            <strong>{ingestionResult.ingestion.ingestionId}</strong>
            <span>Target</span>
            <strong>{ingestionResult.ingestion.target}</strong>
            <span>Merged Rows</span>
            <strong>{ingestionResult.ingestion.rows}</strong>
            <span>Merged CSV Path</span>
            <strong className="mono-text">
              {ingestionResult.ingestion.mergedFilePath}
            </strong>
          </div>

          <h4>Columns Used</h4>
          <div className="forecast-columns-grid">
            <article className="metric">
              <h4>Website</h4>
              <ul>
                {ingestionResult.ingestion.columnsUsed.website.map((column) => (
                  <li key={column}>{column}</li>
                ))}
              </ul>
            </article>
            <article className="metric">
              <h4>Daraz</h4>
              <ul>
                {ingestionResult.ingestion.columnsUsed.daraz.map((column) => (
                  <li key={column}>{column}</li>
                ))}
              </ul>
            </article>
            <article className="metric">
              <h4>Merged</h4>
              <ul>
                {ingestionResult.ingestion.columnsUsed.merged.map((column) => (
                  <li key={column}>{column}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      ) : null}
    </section>
  );
}
