## 2.1 Introduction
- This codebase implements an AI-integrated supply chain management system for the Canela Ceylon case study, with six named modules in project requirements: Supplier Management, Batch and Inventory Management, Export Documentation, AI Quality Grading, AI Demand Forecasting, and Ethereum Blockchain Traceability; implemented stack is Node.js + TypeScript + Express + MongoDB backend, React frontend, Python FastAPI AI services, and Solidity + Hardhat + ethers.js v6 on Sepolia (sources: README.md, docs/requirements.md, backend/src/routes/route-groups.md, frontend/src/App.tsx, blockchain/package.json).

## 2.2 Background of the Problem Domain
- Project framing explicitly targets Ceylon cinnamon export operations with blockchain traceability (sources: README.md, docs/requirements.md).
- Repo guardrails define operational data policy: metadata on-chain, full operational records in MongoDB (sources: README.md, docs/architecture-diagrams/system-architecture.md, backend/src/modules/traceability/README.md).
- Business pain point to module mapping from repo docs and route structure:
- Supplier data management and updates -> Supplier Management module (backend/src/modules/suppliers/suppliers.routes.ts, frontend/src/pages/suppliers.tsx).
- Batch composition, grade-linked inventory view, and QR verification links -> Batch and Inventory modules (backend/src/modules/batches/batches.routes.ts, backend/src/modules/inventory/inventory.routes.ts, frontend/src/pages/batches.tsx).
- Export document generation endpoint -> Export Documentation module (backend/src/modules/export-docs/export-docs.routes.ts).
- Manual grading support through model inference API -> AI Quality Grading module (backend/src/modules/grading/grading.routes.ts, ai-services/grading/api.py, frontend/src/pages/grading.tsx).
- Demand planning support via model selection and CSV ingestion -> AI Forecasting module (backend/src/modules/forecasting/forecasting.routes.ts, ai-services/forecasting/api.py, frontend/src/pages/forecasting.tsx).
- Supplier/batch trust checks and buyer verification flow -> Blockchain Traceability module (backend/src/modules/traceability/traceability.routes.ts, frontend/src/pages/traceability.tsx, frontend/src/pages/verify.tsx).

## 2.3 Review of Existing Systems and Similar Applications
- No named external competitor systems/platforms were found in current repo docs/comments/planning files.
- NOT FOUND IN REPO - needs manual input: any benchmarked commercial or academic systems by name.
- [CITE: existing systems research needed]

## 2.4 Requirement Engineering and User Needs
- Functional requirements visible from implemented backend routes (all under /api/v1):
- Suppliers: GET /suppliers, POST /suppliers (backend/src/modules/suppliers/suppliers.routes.ts).
- Batches: GET /batches, POST /batches (backend/src/modules/batches/batches.routes.ts).
- Inventory: GET /inventory (backend/src/modules/inventory/inventory.routes.ts).
- Export docs: POST /export-docs/generate (backend/src/modules/export-docs/export-docs.routes.ts).
- Grading AI proxy: POST /grading/predict (backend/src/modules/grading/grading.routes.ts).
- Forecasting AI proxy: POST /forecasting/predict and POST /forecasting/ingest-and-predict (backend/src/modules/forecasting/forecasting.routes.ts).
- Traceability: POST /blockchain-registration/:mongoDbId, POST /blockchain-registration/:mongoDbId/auto-record, POST /blockchain-registration/:mongoDbId/verify, PATCH /blockchain-registration/:mongoDbId/products, GET /verify/:mongoDbId, GET /verify/:mongoDbId/hash/:dataHash, GET /traceability/suppliers/:mongoDbId/insights, GET /traceability/batches/:batchId/verify (backend/src/modules/traceability/traceability.routes.ts).
- Input validation is implemented with zod schemas for suppliers, batches, grading payloads, export-doc payloads, and forecasting payloads (sources: suppliers.routes.ts, batches.routes.ts, grading.routes.ts, export-docs.routes.ts, forecasting.routes.ts).
- User types evidenced in repo:
- Operations staff UI user across dashboard/suppliers/batches/grading/forecasting/traceability pages (frontend/src/App.tsx, docs/architecture-diagrams/system-architecture.md).
- Public verifier/buyer via /verify page and QR flow (frontend/src/pages/verify.tsx, backend/src/modules/batches/batches.routes.ts, docs/architecture-diagrams/system-architecture.md).
- Role-based authorization checks are not implemented in backend routes.
- NOT FOUND IN REPO - needs manual input: explicit admin/exporter/supplier permission matrix and route guards.

## 2.5 Software Development Methodologies and SDLC Justification
- Phase-based SDLC evidence exists in docs: Phase 1 to Phase 6 delivery plan (README.md).
- Task tracking evidence exists with prioritized backlog and near-term deliverables (docs/task-list.md).
- Scrum-specific artifacts (sprint IDs, standups, retrospectives, Notion/Jira links) are not present.
- NOT FOUND IN REPO - needs manual input: sprint ceremony records and sprint-by-sprint velocity.
- Current branch commit history is short and iterative: first commit, then forecasting testing commit, then suppliers/blockchain testing commit (git log --oneline -n 40 showed 3 commits on current branch).

## 2.6 System Architecture, Design Patterns, and Database Design
- Runtime architecture wiring:
- Express app applies CORS, JSON parser, morgan logging, in-memory rate limiter, and centralized error handler (backend/src/app.ts, backend/src/middleware/rate-limiter.ts, backend/src/middleware/error-handler.ts).
- API aggregation uses grouped routers: core (suppliers/batches/inventory), AI (grading/forecasting), blockchain (traceability), docs (export-docs) (backend/src/routes/api-v1.routes.ts, backend/src/routes/core.routes.ts, backend/src/routes/ai.routes.ts, backend/src/routes/blockchain.routes.ts, backend/src/routes/docs.routes.ts).
- Frontend routes map to seven pages: dashboard, suppliers, batches, grading, forecasting, traceability, verify (frontend/src/App.tsx).
- FastAPI services are called from backend via HTTP fetch to GRADING_SERVICE_URL and FORECASTING_SERVICE_URL (backend/src/modules/grading/grading.routes.ts, backend/src/modules/forecasting/forecasting.routes.ts).
- Blockchain calls are encapsulated in TraceabilityService using ethers Contract + JsonRpcProvider + Wallet (backend/src/modules/traceability/traceability.service.ts).
- OpenAPI contract-first intent is documented in README/docs; backend local copy explicitly says source-of-truth is docs/openapi.yaml (backend/src/openapi/openapi.yaml, docs/openapi.yaml, README.md).
- MongoDB collections actually used by code:
- suppliers collection stores { key, payload, createdAt, updatedAt } with payload Supplier object (backend/src/modules/suppliers/suppliers.store.ts).
- batches collection stores { key, payload, createdAt, updatedAt } with payload Batch object (backend/src/modules/batches/batches.store.ts).
- traceability_records collection stores mongoDbId, dataHash, productCount, verifiedOnChain, lastAction, txHash, network, chainId, contractAddress, blockNumber, recordedAt, verificationTimestamp, updatedAt (backend/src/modules/traceability/traceability.store.ts).
- forecasting_daily_rows collection stores date-keyed payload { date, paidOrderCount, paidRevenue, sources } (backend/src/modules/forecasting/forecasting.store.ts).
- forecasting_ingestions collection stores ingestion metadata including sourceFiles, inputRows, dailyRows, mergedTarget, createdAt (backend/src/modules/forecasting/forecasting.store.ts).
- initMongo creates unique indexes on suppliers.key, batches.key, traceability_records.mongoDbId, forecasting_daily_rows.key, forecasting_ingestions.key (backend/src/lib/mongo.ts).
- Planned schema in docs/database-design.md includes additional collections (inventory_levels, export_documents, grading_runs, forecast_runs, blockchain_registrations) that are not fully persisted by current runtime code.
- NOT FOUND IN REPO - needs manual input: finalized physical schema for grading_runs/forecast_runs collections in production.
- Hardhat module isolation rationale is explicitly documented: keep blockchain/ sibling to backend/ to avoid Hardhat 3 ESM conflict with backend module system (docs/architecture-diagrams/system-architecture.md).
- Patterns visible in code:
- Router-module composition pattern (routes/* + modules/*/*.routes.ts).
- Store/repository-style data access separation (modules/*/*.store.ts).
- Service layer for external chain integration (traceability.service.ts).
- Middleware chain for cross-cutting concerns and response envelope standardization (app.ts, middleware/*).

## 2.7 AI Integration Approaches and Intelligent System Features
- Random Forest grading implementation:
- Grading FastAPI loads serialized model candidates in order: env GRADING_MODEL_PATH, then ai-services/grading/RandomCinnamon.pkl, then artifacts/grading_rf_track1.joblib fallback path (ai-services/grading/api.py).
- Prediction endpoint uses three input fields: diameter_mm, color_category, texture_category (ai-services/grading/api.py).
- Backend grading route expects diameterMm, colorCategory, textureCategory and maps to grading service payload fields (backend/src/modules/grading/grading.routes.ts).
- Validation module encodes color and texture categories numerically and defines grade scope comments as Alba to C4 with diameter 6.0mm to 18.0mm; >18mm/Hamburg is explicitly out of scope in validator messages (ai-services/grading/grading_validation.py).
- Standards references are present in grading_validation.py comments/docstring: ISO 6539:2014, SLS 81:2021, Cinnamon Quality Control Act 1969.
- [CITE: Random Forest for tabular classification — find 1-2 sources]
- [CITE: ISO 6539:2014 and SLS 81:2021 grading boundary usage in cinnamon quality assessment]
- Forecasting integration and model comparison:
- Forecasting API supports model values naive, arima, prophet, lstm (ai-services/forecasting/api.py, backend/src/modules/forecasting/forecasting.routes.ts, frontend/src/pages/forecasting.tsx).
- Benchmark code compares four models and outputs mape_percent, training_time_ms, inference_latency_ms, interpretability, deployment_decision (ai-services/forecasting/evaluate.py).
- Metric explicitly implemented in evaluation code is MAPE; MAE/RMSE are not implemented in evaluate.py.
- Code split strategy in evaluate.py is dynamic 80/20 (split_index = max(30, int(len(series)*0.8))).
- Requirements doc states a fixed 10 months / 2 months split and synthetic daily dataset target; this is a documented target that differs from current evaluate.py implementation (docs/requirements.md vs ai-services/forecasting/evaluate.py).
- Forecasting data ingestion endpoint merges website and daraz CSV paid-order rows to target paid_order_count and persists merged rows and ingestion record before calling forecasting service with custom_series (backend/src/modules/forecasting/forecasting.routes.ts, backend/src/modules/forecasting/forecasting.store.ts).
- [CITE: ARIMA vs Prophet vs LSTM demand forecasting comparison studies]
- Grading/forecasting dataset composition facts from files currently present:
- ai-services/grading/cinnamon_grading_dataset.csv has 53 lines total including header (52 data rows).
- ai-services/forecasting/merged_daily_paid_orders.csv has 25 lines total including header (24 data rows).
- No file named real_alba_c5.csv or synthetic_c4_mexico_hamburg.csv exists in current workspace.
- NOT FOUND IN REPO - needs manual input: 210-record synthetic grading dataset evidence and class-balancing procedure details.
- Blockchain traceability integration:
- On-chain contract stores supplier record fields: dataHash, recordedBy, recordedAt, isVerified, verifiedBy, verificationTimestamp, productCount, mongoDbId; mapping registeredSuppliers tracks existence (blockchain/contracts/BatchRegistry.sol, blockchain/contracts/IBatchRegistry.sol).
- Backend registers hash + product count to chain and stores transaction/network metadata in MongoDB traceability_records and supplier.blockchainRef (backend/src/modules/traceability/traceability.routes.ts, backend/src/modules/suppliers/suppliers.routes.ts).
- Runtime enforces Sepolia chain ID 11155111 and validates required ABI functions at startup (backend/src/modules/traceability/traceability.service.ts).
- Deployed Sepolia addresses are recorded in blockchain/deployments.sepolia.json.
- [CITE: blockchain traceability in agri-export supply chains]
- [CITE: off-chain storage with on-chain hash anchoring design trade-offs]

## 2.8 UI/UX, Accessibility, and Human-Computer Interaction
- Implemented frontend UI features in code:
- Dashboard metric cards (service health, suppliers, batches, inventory total) using aggregated API calls (frontend/src/pages/dashboard.tsx).
- Supplier create form with optional auto-record-on-chain and blockchain metadata display card (frontend/src/pages/suppliers.tsx).
- Batch create form with multi-supplier contributions, auto-generated QR image display, and verification link (frontend/src/pages/batches.tsx).
- Grading form with controlled dropdowns and prediction result card (frontend/src/pages/grading.tsx).
- Forecasting page with model selector, CSV upload for website/daraz merge flow, SVG trend chart, summary stats, and result table (frontend/src/pages/forecasting.tsx).
- Traceability console with supplier insights table, on-chain action buttons, and formatted blockchain transaction summary panel (frontend/src/pages/traceability.tsx).
- Public verify page with camera QR scan (html5-qrcode), trust-status banner, and supplier verification breakdown (frontend/src/pages/verify.tsx).
- Accessibility details present in code:
- Main navigation has aria-label.
- Forecast SVG has role="img" and aria-label.
- QR images include alt text.
- Forms include labeled controls in multiple pages.
- Accessibility items not found in current code:
- NOT FOUND IN REPO - needs manual input: WCAG audit evidence, keyboard-only test results, screen-reader test results, aria-live announcements, focus management strategy.
- UI features requested in prompt but not found as implemented features in current frontend pages: product filtering controls, hover video interactions, and dedicated proforma invoice UI workflow.

## 2.9 Security, Privacy, Scalability, and Deployment Considerations
- Authentication/authorization:
- No JWT/session/auth middleware or role guards were found in backend route handling.
- NOT FOUND IN REPO - needs manual input: auth model, role-policy matrix, and token/session design.
- Input validation and error handling:
- zod validation is used for suppliers, batches, grading, forecasting, and export-doc payloads.
- Centralized envelope format success/error is enforced via ok/fail helpers.
- Centralized error middleware maps HttpError to consistent error envelopes and returns 500 for unhandled errors.
- Rate limiting:
- In-memory IP-based limiter allows 120 requests per 60 seconds, returns 429 RATE_LIMIT_EXCEEDED (backend/src/middleware/rate-limiter.ts).
- Privacy and blockchain boundary:
- Repo policy states metadata only on-chain and full records in MongoDB; chain payload in current contract is supplier ID + data hash + product count and verification flags.
- Deployment/runtime safeguards:
- Backend startup requires Mongo init and chain readiness check (network, contract bytecode, ABI function presence) before listening (backend/src/server.ts, backend/src/modules/traceability/traceability.service.ts).
- Blockchain config reads RPC URL/private key from environment and targets Sepolia in config/deploy script outputs (blockchain/hardhat.config.ts, blockchain/scripts/deploy.ts, blockchain/deployments.sepolia.json).
- k6 load testing setup:
- NOT FOUND IN REPO - no k6 script files or thresholds currently implemented; only planning mentions exist (README.md, docs/task-list.md, docs/copilot-master-prompt-v2.md).

## 2.10 Software Testing and Quality Assurance Approaches
- Backend test framework dependency exists (Jest + ts-jest), and npm test script is jest --passWithNoTests (backend/package.json).
- backend/tests currently contains only .gitkeep (no test cases).
- Blockchain package has hardhat test script configured, but blockchain/test directory is empty.
- AI services:
- No project-owned pytest test files found under ai-services/grading or ai-services/forecasting.
- Training/evaluation scripts exist for grading and forecasting logic (ai-services/grading/train_model.ipynb, ai-services/forecasting/evaluate.py).
- k6 benchmarking results:
- NOT FOUND IN REPO - no k6 scripts/results artifacts found.
- Two-track grading evaluation in repository materials:
- Requirements and UI text state Track 1 real Alba/C5 and Track 2 synthetic generalization test labeling.
- Runtime grading API currently returns track_label as not_applicable_runtime_prediction for live predictions.
- NOT FOUND IN REPO - evaluation artifact file ai-services/grading/artifacts/grading_evaluation_report.json is absent in current workspace.

## 2.11 System Gap and Justification for the Proposed Solution
- Explicit gap/insufficiency signals in repo docs:
- docs/task-list.md states forecasting was previously placeholder/unfinished and required real model pipeline completion and comparison reporting.
- docs/task-list.md highlights need for end-to-end runtime smoke tests with real Mongo Atlas + Sepolia integration, implying prior incompleteness in integrated validation.
- docs/task-list.md lists missing automated test coverage (Jest/pytest/k6/e2e) as a priority gap.
- Architecture/docs repeatedly justify hybrid storage (on-chain metadata + off-chain full records) as a design response to traceability vs data-volume constraints.
- NOT FOUND IN REPO - needs manual input: positionality/ethics-form narrative (for example CEO/researcher dual-role reflections) and any formal problem statement excerpts from proposal documents not present here.

## 2.12 Summary
- The implemented system is organized around six requirements-defined modules, with route-grouped Node.js backend and React UI pages aligned to supplier, batch, grading, forecasting, and traceability workflows (README.md, docs/requirements.md, backend/src/routes/route-groups.md, frontend/src/App.tsx).
- AI integration is operational through FastAPI grading and forecasting services called from backend routes, with grading model-loading logic and forecasting ingestion-to-prediction pipeline implemented in code (backend/src/modules/grading/grading.routes.ts, backend/src/modules/forecasting/forecasting.routes.ts, ai-services/grading/api.py, ai-services/forecasting/api.py).
- Blockchain traceability is implemented as Sepolia-only supplier-record registration/verification with ethers.js v6 and a proxy-deployed Solidity registry contract, while MongoDB stores richer operational details (backend/src/modules/traceability/*, blockchain/contracts/*, blockchain/deployments.sepolia.json).
- QA/performance automation remains a current gap in this snapshot (empty backend tests, empty blockchain tests, no k6 scripts present), which should be documented as a limitation and future work item (backend/tests, blockchain/test, docs/task-list.md).

## Citations Needed
- [ ] [CITE: existing systems research needed]
- [ ] [CITE: Random Forest for tabular classification — find 1-2 sources]
- [ ] [CITE: ISO 6539:2014 and SLS 81:2021 grading boundary usage in cinnamon quality assessment]
- [ ] [CITE: ARIMA vs Prophet vs LSTM demand forecasting comparison studies]
- [ ] [CITE: blockchain traceability in agri-export supply chains]
- [ ] [CITE: off-chain storage with on-chain hash anchoring design trade-offs]
