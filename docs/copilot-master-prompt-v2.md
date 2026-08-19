# Copilot Master Prompt V2

Paste everything below into Copilot Chat Agent mode when you open this repository from the directory.

You are helping me build my final year BSc Software Engineering project:

AI-Integrated Supply Chain Management System with Blockchain Traceability for Ceylon Cinnamon Export Operations: A Case Study of Canela Ceylon (Pvt) Ltd.

Treat these as fixed decisions:

- Backend: Node.js + TypeScript + Express + MongoDB
- Frontend: React
- AI Services: Python + FastAPI
- Grading model: scikit-learn Random Forest
- Forecasting: Naive baseline, ARIMA (statsmodels), Prophet, lightweight LSTM (PyTorch)
- Blockchain: Solidity + Hardhat + Sepolia testnet + ethers.js v6
- API contract: OpenAPI 3.0 under /api/v1
- Testing: Jest, pytest, k6

Hard rules:

- Never claim synthetic grading outcomes are real-world accuracy.
- Track 2 grading output must always be labeled generalization test.
- Never use Ethereum mainnet. Sepolia only.
- Store metadata only on-chain. Keep full records in MongoDB.
- Keep blockchain directory as a sibling to backend.
- Use ethers.js v6 syntax.

Working style:

- Do not give only plans. Implement changes directly.
- After every file edit, run validation commands and fix errors.
- Keep changes production-quality, not TODO scaffolds.
- Do not remove existing features unless required for correctness.

Start by doing this discovery pass:

1. Inspect repository and list what exists in frontend, backend, ai-services, and blockchain.
2. Compare current state to required modules and identify exact gaps.
3. Create a short actionable checklist grouped by P0, P1, P2.

Then execute in this order:

Phase A: Restore and stabilize frontend runtime

Required outcomes:

- Frontend can run with npm run dev
- Frontend can build with npm run build
- Routing shell and all pages render

Tasks:

1. Ensure frontend runtime files exist and are correct:
   - package.json
   - index.html
   - src/main.tsx
   - src/App.tsx
   - src/styles.css
   - vite config
   - tsconfig files
2. Keep existing pages in src/pages and mount all in router:
   - dashboard
   - suppliers
   - batches
   - grading
   - forecasting
   - traceability
   - verify
3. Ensure local host binding works for development.
4. Report exact start URL and run commands.

Phase B: Bootstrap backend runtime

Required outcomes:

- Backend starts locally
- /api/v1/health works
- Route mounting works under /api/v1

Tasks:

1. Create backend package setup and TypeScript configuration.
2. Create Express app/server entry points.
3. Add middleware stack:
   - JSON parsing
   - centralized error handler
   - rate limiter stub
4. Mount current traceability routes under /api/v1.
5. Add health route.

Phase C: Core data model and CRUD

Required outcomes:

- Supplier CRUD works
- Batch CRUD works with required batch ID format
- Inventory and export-doc routes are scaffolded with real validation and service layers

Tasks:

1. Implement MongoDB connection module.
2. Implement Mongoose schemas for suppliers, batches, inventory, export docs.
3. Enforce batch format CC-BATCH-YYYY-MM-XXXXX.
4. Add DTO/request validation and response envelope consistency.

Phase D: AI grading hardening

Required outcomes:

- Model trains from local CSV files
- Predict endpoint works
- Report keeps strict Track 1 and Track 2 separation

Tasks:

1. Validate grading data paths and schema.
2. Keep Track 1 real-data metrics independent.
3. Keep Track 2 synthetic outputs labeled generalization test everywhere.
4. Add pytest tests for:
   - training run
   - predict endpoint
   - report structure

Phase E: Forecasting implementation

Required outcomes:

- Naive baseline, ARIMA, Prophet, and LSTM all run on same train/test split
- Evaluation table produced with:
  - Model
  - MAPE
  - Training Time
  - Inference Latency
  - Interpretability
  - Deployment Decision

Tasks:

1. Implement deterministic synthetic single-market daily dataset generation.
2. Implement identical split: first 10 months train, final 2 months test.
3. Implement each forecasting model and evaluation utilities.
4. Produce comparison report and choose deployment candidate by evidence.

Phase F: Blockchain completion

Required outcomes:

- Hardhat project runs
- Contracts compile and test
- Sepolia deployment succeeds
- Backend can register and verify batch metadata through proxy address

Tasks:

1. Create blockchain package and Hardhat config.
2. Add deployment environment handling.
3. Deploy implementation + proxy to Sepolia.
4. Save deployment outputs in a tracked deployment file.
5. Wire backend env variables:
   - SEPOLIA_RPC_URL
   - SEPOLIA_SIGNER_PRIVATE_KEY
   - BATCH_REGISTRY_PROXY_ADDRESS

Phase G: Frontend API integration

Required outcomes:

- Frontend screens call backend APIs
- Traceability page can register and verify
- Verify page can display buyer-facing result

Tasks:

1. Add API client layer and shared request helpers.
2. Connect forms to supplier, batch, grading, forecasting, and traceability endpoints.
3. Add loading, success, and error states for every network action.

Phase H: Testing and performance

Required outcomes:

- Jest tests for backend
- pytest for AI services
- k6 scripts for load tests
- one end-to-end flow test

Tasks:

1. Add unit and integration tests for critical paths.
2. Add k6 scenarios for:
   - supplier creation
   - batch registration
   - forecast execution
   - dashboard retrieval
   - traceability verification
3. Report baseline latencies and failures.

Definition of Done:

1. All six modules are functional.
2. Grading Track 1 and Track 2 are clearly separated in reporting.
3. Forecasting comparison table is generated with measured metrics.
4. Batch metadata is verifiable on Sepolia through QR-linked workflow.
5. API and frontend run from clean setup commands.
6. OpenAPI and implemented routes are aligned.

Output format required from Copilot for each session:

1. What was implemented.
2. Files changed.
3. Commands run.
4. Validation results.
5. Remaining tasks in priority order.

If runtime fails, Copilot must:

1. Show exact error.
2. Explain root cause.
3. Apply fix.
4. Re-run validation.
