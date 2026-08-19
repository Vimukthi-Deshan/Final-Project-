# Project Task List

## Current Status

- Frontend: Restored and buildable from source. Runtime/config files and routed shell are back in place.
- Backend: Runnable Express server with module-grouped /api/v1 routes, MongoDB-backed suppliers/batches/traceability persistence, and startup readiness checks for MongoDB + Sepolia contract connectivity.
- AI Grading: Dataset, training pipeline, and FastAPI service exist.
- AI Forecasting: Placeholder code exists but real models/evaluation remain unfinished.
- Blockchain: Supplier registry deployment script and Sepolia deployment flow exist; backend integrates with deployed proxy using ethers v6.

## Priority Order

1. Execute end-to-end runtime smoke tests with real external services (Mongo Atlas + Sepolia).
2. Align OpenAPI 3.0 specs with current live backend routes and envelopes.
3. Finish forecasting implementations and comparison reporting.
4. Add Jest, pytest, k6, and end-to-end coverage.
5. Prepare final evaluation and report artefacts.

## Near-Term Deliverables

### Frontend

- Source runtime is restored and validated with build.
- Route shell/navigation are restored and API-connected pages are in place.
- Perform browser-based acceptance checks against a running backend.

### Backend

- Keep startup readiness checks healthy for MongoDB and Sepolia contract connectivity.
- Complete endpoint-level smoke testing for suppliers, batches, inventory, traceability, grading, and forecasting routes.
- Ensure deployment-time environment values are documented and consistent.

### Data and AI

- Keep grading Track 1 and Track 2 outputs strictly separated.
- Add tests for grading train/predict behavior.
- Implement real forecasting model pipeline and evaluation table.

### Blockchain

- Keep Sepolia-only deployment and backend proxy wiring stable.
- Verify deployed ABI compatibility against backend startup checks after each redeploy.

## Acceptance Targets

- Frontend runs locally from source with `npm run dev`.
- Backend starts locally and serves `/api/v1/health`.
- Grading model trains from local CSV data.
- Traceability registration and verification work through backend with configured Sepolia credentials and deployed proxy address.
