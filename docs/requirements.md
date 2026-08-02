# Requirements Baseline (Phase 1)

## Project Identity

This artefact implements:

AI-Integrated Supply Chain Management System with Blockchain Traceability for Ceylon Cinnamon Export Operations.

## Core Functional Modules

1. Supplier Management
2. Batch and Inventory Management
3. Export Documentation
4. AI Quality Grading (two-track validation)
5. AI Demand Forecasting (multi-model comparison)
6. Ethereum Blockchain Traceability

## Non-Functional Constraints

- Open-source and free tooling only
- API versioning at `/api/v1/`
- Contract-first API design using OpenAPI 3.0
- MongoDB selected for schema flexibility and embedded lineage records
- Sepolia testnet only

## Grading Validation Integrity

- Track 1: Real Alba/C5 data only, stratified k-fold (k=3)
- Track 2: Synthetic C4/Mexico/Hamburg data from SLSI grade boundaries
- Track 2 outputs must be labeled `generalization test`

## Forecasting Evaluation Integrity

- Synthetic single-market daily dataset (~365 rows)
- Train/test split fixed to 10 months / 2 months
- Naive baseline, ARIMA, Prophet, lightweight LSTM compared on identical test window
- MAPE <= 20% considered satisfactory proof-of-concept

## Acceptance Targets

- Grading Track 1 accuracy >= 75%
- Forecasting held-out MAPE <= 20%
- API mean latency < 500ms at 1x load
- QR-based traceability verification after blockchain registration
