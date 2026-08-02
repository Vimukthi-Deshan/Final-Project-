# Traceability Module (Sepolia)

This module connects backend routes to the on-chain `BatchRegistry` proxy contract via ethers.js v6.

## Required Environment Variables

- `SEPOLIA_RPC_URL`
- `SEPOLIA_SIGNER_PRIVATE_KEY`
- `BATCH_REGISTRY_PROXY_ADDRESS`

## Route Mounting

Mount this router under `/api/v1`:

- `POST /api/v1/blockchain-registration/:batchId`
- `GET /api/v1/verify/:batchId`

## On-Chain Data Policy

Only metadata is registered on-chain:

- batch ID
- source supplier IDs
- processing date
- AI-assigned grade
- export destination
- logistics handover timestamp

Full operational records remain in MongoDB.
