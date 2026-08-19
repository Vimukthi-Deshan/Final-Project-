// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IBatchRegistry.sol";

contract BatchRegistry is IBatchRegistry {
    mapping(string => SupplierRecord) public suppliers;
    mapping(string => bool) public registeredSuppliers;

    address public admin;
    uint256 public totalSuppliers;
    bool public initialized;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    function initialize(address initialAdmin) external {
        require(!initialized, "Already initialized");
        require(initialAdmin != address(0), "Invalid admin address");

        admin = initialAdmin;
        totalSuppliers = 0;
        initialized = true;
    }

    function recordSupplier(
        string calldata mongoDbId,
        bytes32 dataHash,
        uint256 productCount
    ) external override returns (bool) {
        require(!registeredSuppliers[mongoDbId], "Supplier already recorded");
        require(dataHash != bytes32(0), "Invalid hash");

        suppliers[mongoDbId] = SupplierRecord({
            dataHash: dataHash,
            recordedBy: msg.sender,
            recordedAt: block.timestamp,
            isVerified: false,
            verifiedBy: address(0),
            verificationTimestamp: 0,
            productCount: productCount,
            mongoDbId: mongoDbId
        });

        registeredSuppliers[mongoDbId] = true;
        totalSuppliers++;

        emit SupplierRecorded(mongoDbId, dataHash, msg.sender, block.timestamp);
        return true;
    }

    function verifySupplier(string calldata mongoDbId)
        external
        override
        onlyAdmin
        returns (bool)
    {
        require(registeredSuppliers[mongoDbId], "Supplier not found");
        require(!suppliers[mongoDbId].isVerified, "Already verified");

        suppliers[mongoDbId].isVerified = true;
        suppliers[mongoDbId].verifiedBy = msg.sender;
        suppliers[mongoDbId].verificationTimestamp = block.timestamp;

        emit SupplierVerified(mongoDbId, msg.sender, true, block.timestamp);
        return true;
    }

    function updateProductCount(string calldata mongoDbId, uint256 newProductCount)
        external
        override
        returns (bool)
    {
        require(registeredSuppliers[mongoDbId], "Supplier not found");

        suppliers[mongoDbId].productCount = newProductCount;

        emit SupplierProductsUpdated(mongoDbId, newProductCount, block.timestamp);
        return true;
    }

    function getSupplier(string calldata mongoDbId)
        external
        view
        override
        returns (SupplierRecord memory)
    {
        require(registeredSuppliers[mongoDbId], "Supplier not found");
        return suppliers[mongoDbId];
    }

    function verifySupplierHash(string calldata mongoDbId, bytes32 dataHash)
        external
        view
        override
        returns (bool)
    {
        if (!registeredSuppliers[mongoDbId]) {
            return false;
        }

        return suppliers[mongoDbId].dataHash == dataHash;
    }

    function isSupplierVerified(string calldata mongoDbId)
        external
        view
        override
        returns (bool)
    {
        if (!registeredSuppliers[mongoDbId]) {
            return false;
        }

        return suppliers[mongoDbId].isVerified;
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        admin = newAdmin;
    }

    function rejectSupplier(string calldata mongoDbId)
        external
        onlyAdmin
        returns (bool)
    {
        require(registeredSuppliers[mongoDbId], "Supplier not found");
        registeredSuppliers[mongoDbId] = false;
        return true;
    }
}
