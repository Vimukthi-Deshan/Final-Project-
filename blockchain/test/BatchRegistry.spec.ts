import { expect } from "chai";
import { ethers } from "hardhat";

describe("BatchRegistry", function () {
  it("registers and retrieves metadata", async function () {
    const factory = await ethers.getContractFactory("BatchRegistry");
    const registry = await factory.deploy();
    await registry.waitForDeployment();

    await registry.registerBatch(
      "CC-BATCH-2026-07-00001",
      ["SUP-001", "SUP-002"],
      1782864000,
      "C5",
      "USA",
      1782950400,
    );

    const record = await registry.getBatch("CC-BATCH-2026-07-00001");
    expect(record.batchId).to.equal("CC-BATCH-2026-07-00001");
    expect(record.aiAssignedGrade).to.equal("C5");
  });
});
