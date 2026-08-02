# MongoDB Schema Design (Phase 1)

## Design Rationale

MongoDB is selected for flexible schema evolution across batch composition, AI metadata, and blockchain registration state while keeping traceability queries simple through embedded lineage snapshots.

## Collections

- `suppliers`
- `batches`
- `inventory_levels`
- `export_documents`
- `grading_runs`
- `forecast_runs`
- `blockchain_registrations`

## suppliers

- `_id`: ObjectId
- `supplierId`: string (unique, indexed)
- `name`: string
- `contact`: object { email, phone, address }
- `region`: string
- `certifications`: string[]
- `performanceHistory`: array of { date, score, note }
- `createdAt`, `updatedAt`

## batches

- `_id`: ObjectId
- `batchId`: string (unique, indexed, format `CC-BATCH-YYYY-MM-XXXXX`)
- `sourceSuppliers`: array of { supplierId, contributionKg }
- `processingDate`: ISODate
- `qualityGrade`: enum [Alba, C5, C4, Mexico, Hamburg]
- `exportDestination`: string
- `logisticsHandoverAt`: ISODate
- `gradingSnapshot`: object { model, inputs, output, confidence, trackLabel }
- `traceability`: object { status, txHash, chainId, registeredAt }
- `createdAt`, `updatedAt`

## inventory_levels

- `_id`: ObjectId
- `grade`: enum [Alba, C5, C4, Mexico, Hamburg]
- `quantityKg`: number
- `lastUpdatedAt`: ISODate

## export_documents

- `_id`: ObjectId
- `documentId`: string (unique, indexed)
- `documentType`: enum [quotation, proforma_invoice, packing_list, certificate_of_origin]
- `batchId`: string
- `supplierRefs`: string[]
- `payload`: object
- `generatedAt`: ISODate

## grading_runs

- `_id`: ObjectId
- `runId`: string (unique)
- `track`: enum [real_track_1, generalization_test_track_2]
- `metrics`: object { accuracy, confusionMatrix, featureImportance }
- `modelVersion`: string
- `createdAt`: ISODate

## forecast_runs

- `_id`: ObjectId
- `runId`: string (unique)
- `datasetVersion`: string
- `split`: object { trainStart, trainEnd, testStart, testEnd }
- `modelResults`: array of { model, mape, trainingTimeMs, latencyMs, interpretability, decision }
- `selectedModel`: string
- `createdAt`: ISODate

## blockchain_registrations

- `_id`: ObjectId
- `batchId`: string (indexed)
- `contractAddress`: string
- `network`: string (default `sepolia`)
- `txHash`: string (indexed)
- `blockNumber`: number
- `registeredAt`: ISODate
- `status`: enum [pending, confirmed, failed]

## Indexes

- suppliers: `supplierId` unique
- batches: `batchId` unique, `exportDestination`, `qualityGrade`
- export_documents: `documentId` unique, `batchId`
- blockchain_registrations: `batchId`, `txHash` unique
