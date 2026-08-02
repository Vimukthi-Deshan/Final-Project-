# Copilot Instructions for This Repository

## Fixed Scope
Implement only the approved architecture:
- Node.js + TypeScript backend, React frontend, MongoDB Community Edition
- Python FastAPI microservices for grading and forecasting
- Solidity + Hardhat + ethers.js v6 on Sepolia only

## Hard Rules
- Label synthetic C4/Mexico/Hamburg grading outcomes as `generalization test`.
- Never treat synthetic grading outcomes as real-world accuracy.
- Never use Ethereum mainnet.
- Never store full operational records on-chain.
- Keep `blockchain/` as sibling to `backend/`.
- Keep API versioning under `/api/v1/`.
- Preserve OpenAPI 3.0 contract-first workflow.
- Do not substitute MongoDB or Ethereum unless explicitly requested.

## Quality Expectations
- Prefer complete, production-quality implementations.
- Keep response envelopes and error handling consistent.
- Add/maintain tests with each implementation phase.
