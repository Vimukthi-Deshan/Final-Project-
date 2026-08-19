// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBatchRegistry {
    struct SupplierRecord {
        bytes32 dataHash;
        address recordedBy;
        uint256 recordedAt;
        bool isVerified;
        address verifiedBy;
        uint256 verificationTimestamp;
        uint256 productCount;
        string mongoDbId;
    }

    event SupplierRecorded(
        string indexed mongoDbId,
        bytes32 indexed dataHash,
        address indexed recorder,
        uint256 timestamp
    );

    event SupplierVerified(
        string indexed mongoDbId,
        address indexed verifier,
        bool isVerified,
        uint256 timestamp
    );

    event SupplierProductsUpdated(
        string indexed mongoDbId,
        uint256 productCount,
        uint256 timestamp
    );

    function recordSupplier(
        string calldata mongoDbId,
        bytes32 dataHash,
        uint256 productCount
    ) external returns (bool);

    function verifySupplier(string calldata mongoDbId)
        external
        returns (bool);

    function updateProductCount(
        string calldata mongoDbId,
        uint256 newProductCount
    ) external returns (bool);

    function getSupplier(string calldata mongoDbId)
        external
        view
        returns (SupplierRecord memory);

    function verifySupplierHash(string calldata mongoDbId, bytes32 dataHash)
        external
        view
        returns (bool);

    function isSupplierVerified(string calldata mongoDbId)
        external
        view
        returns (bool);

    function registeredSuppliers(string calldata mongoDbId)
        external
        view
        returns (bool);

    function totalSuppliers() external view returns (uint256);
}
