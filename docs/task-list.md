# Project Task List

## Current Status

- Frontend: Partially restored; source runtime files rebuilt and routed app shell restored.
- Backend: Scaffold only, with traceability service/routes drafted but no runnable Express server.
- AI Grading: Dataset, training pipeline, and FastAPI service exist.
- AI Forecasting: Placeholder code exists but real models/evaluation remain unfinished.
- Blockchain: Contracts and deployment script exist, but Hardhat runtime configuration is incomplete.

## Priority Order

1. Restore frontend runnable state and keep it stable.
2. Bootstrap backend runtime and mount `/api/v1` routes.
3. Implement MongoDB models and CRUD for suppliers and batches.
4. Connect traceability routes to live backend runtime.
5. Complete Hardhat configuration and Sepolia deployment workflow.
6. Replace frontend placeholders with live API integration.
7. Finish forecasting implementations and comparison reporting.
8. Add Jest, pytest, k6, and end-to-end coverage.
9. Align OpenAPI spec with running implementation.
10. Prepare final evaluation and report artefacts.

## Near-Term Deliverables

### Frontend

- Rebuild `package.json`, `index.html`, Vite config, TypeScript config, and app entry.
- Restore navigation and route mounting around existing pages.
- Reconnect pages to backend APIs once backend runtime is live.

### Backend

- Create `package.json`, TypeScript config, Express app, and server entry.
- Add health route, error middleware, and rate-limiter stub.
- Mount traceability routes under `/api/v1`.

### Data and AI

- Keep grading Track 1 and Track 2 outputs strictly separated.
- Add tests for grading train/predict behavior.
- Implement real forecasting model pipeline and evaluation table.

### Blockchain

- Add Hardhat project config and dependency manifest.
- Deploy proxy + implementation to Sepolia.
- Store proxy address in backend environment configuration.

## Acceptance Targets

- Frontend runs locally from source with `npm run dev`.
- Backend starts locally and serves `/api/v1/health`.
- Grading model trains from local CSV data.
- Traceability registration and verification work through backend once Sepolia config is provided.
