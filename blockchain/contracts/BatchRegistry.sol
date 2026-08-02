// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IBatchRegistry.sol";

contract BatchRegistry is IBatchRegistry {
    mapping(string => BatchMetadata) private batches;
    mapping(string => bool) private exists;

    function registerBatch(
        string calldata batchId,
        string[] calldata sourceSupplierIds,
        uint64 processingDate,
        string calldata aiAssignedGrade,
        string calldata exportDestination,
        uint64 logisticsHandoverTimestamp
    ) external override {
        require(bytes(batchId).length > 0, "batchId required");
        require(!exists[batchId], "batch already exists");

        BatchMetadata memory record = BatchMetadata({
            batchId: batchId,
            sourceSupplierIds: sourceSupplierIds,
            processingDate: processingDate,
            aiAssignedGrade: aiAssignedGrade,
            exportDestination: exportDestination,
            logisticsHandoverTimestamp: logisticsHandoverTimestamp,
            registeredAt: uint64(block.timestamp)
        });

        batches[batchId] = record;
        exists[batchId] = true;

        emit BatchRegistered(
            batchId,
            sourceSupplierIds,
            aiAssignedGrade,
            exportDestination,
            logisticsHandoverTimestamp,
            msg.sender
        );
    }

    function getBatch(string calldata batchId) external view override returns (BatchMetadata memory) {
        require(exists[batchId], "batch not found");
        return batches[batchId];
    }

    function batchExists(string calldata batchId) external view override returns (bool) {
        return exists[batchId];
    }
}
