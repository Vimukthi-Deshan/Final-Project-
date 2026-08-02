// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBatchRegistry {
    struct BatchMetadata {
        string batchId;
        string[] sourceSupplierIds;
        uint64 processingDate;
        string aiAssignedGrade;
        string exportDestination;
        uint64 logisticsHandoverTimestamp;
        uint64 registeredAt;
    }

    event BatchRegistered(
        string indexed batchId,
        string[] sourceSupplierIds,
        string aiAssignedGrade,
        string exportDestination,
        uint64 logisticsHandoverTimestamp,
        address indexed registrar
    );

    function registerBatch(
        string calldata batchId,
        string[] calldata sourceSupplierIds,
        uint64 processingDate,
        string calldata aiAssignedGrade,
        string calldata exportDestination,
        uint64 logisticsHandoverTimestamp
    ) external;

    function getBatch(string calldata batchId) external view returns (BatchMetadata memory);

    function batchExists(string calldata batchId) external view returns (bool);
}
