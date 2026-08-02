# Canela Ceylon AI-Integrated Supply Chain Management System

## Project

AI-Integrated Supply Chain Management System with Blockchain Traceability for Ceylon Cinnamon Export Operations: A Case Study of Canela Ceylon (Pvt) Ltd.

## Scope Lock

This repository follows the fixed-scope architecture and methods defined in the project proposal:

- Backend: Node.js + TypeScript + Express + MongoDB Community Edition
- Frontend: React
- AI Services: Python + scikit-learn, statsmodels, Prophet, PyTorch via FastAPI
- Blockchain: Solidity + Hardhat + ethers.js v6 on Sepolia testnet only
- Testing: Jest, pytest, k6
- API: OpenAPI 3.0 with `/api/v1/` versioning

## Repository Layout

- `backend/`: TypeScript Express API and MongoDB models
- `ai-services/`: Python grading and forecasting microservices
- `blockchain/`: Solidity contracts, tests, and deployment scripts
- `frontend/`: React dashboard and buyer verification UI
- `docs/`: OpenAPI spec, architecture diagrams, evaluation reports

## Guardrails

- Never represent synthetic grading outcomes (C4/Mexico/Hamburg) as real-world validation.
- Use Sepolia testnet only.
- Store metadata only on-chain; keep full operational records in MongoDB.
- Keep `blockchain/` as a sibling of `backend/`.
- Use ethers.js v6 syntax.

## Delivery Plan

- Phase 1: Requirements, architecture, OpenAPI skeleton, schema design, wireframes, smart contract interface
- Phase 2: Core backend + frontend modules
- Phase 3: Blockchain implementation + Sepolia integration + QR verification
- Phase 4a/4b: Forecasting model pipeline and evaluation
- Phase 5: Integration, benchmarking, and end-to-end testing
- Phase 6: Final artefacts and report documentation
