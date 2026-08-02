# Wireframes (Phase 1)

## Dashboard

- KPI cards: active suppliers, total inventory kg by grade, pending export docs, blockchain registrations.
- Timeline: recent batches and logistics handovers.
- Alerts: low inventory and failed blockchain registrations.

## Suppliers Page

- Data table with filters (region, certification, status).
- Create/Edit supplier form drawer.
- Performance history chart per supplier.

## Batches Page

- Batch creation form with format hint: `CC-BATCH-YYYY-MM-XXXXX`.
- Supplier contribution sub-table.
- Batch status chips: graded, registered on-chain, document-ready.

## Grading Page

- Input form: diameter, color category, texture/foxing category.
- Output panel: predicted class, confidence, and explanation.
- Track visibility panel: real Track 1 metrics vs Track 2 `generalization test` metrics.

## Forecasting Page

- Model selector: naive, ARIMA, Prophet, LSTM.
- Evaluation table: MAPE, training time, inference latency, interpretability, deployment decision.
- Forecast chart with train/test split markers.

## Traceability Page

- Batch registration actions with tx hash display.
- Contract/network panel fixed to Sepolia.
- QR generator for buyer verification links.

## Public Verification Page

- QR landing route with batch lookup.
- Read-only chain metadata display.
- Verification banner with block number and tx hash.
