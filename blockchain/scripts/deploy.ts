import { network } from "hardhat";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const registryFactory = await ethers.getContractFactory("BatchRegistry");
  const registry = await registryFactory.deploy();
  await registry.waitForDeployment();
  const implementationAddress = await registry.getAddress();

  const initData = registryFactory.interface.encodeFunctionData("initialize", [
    deployer.address,
  ]);

  const proxyFactory = await ethers.getContractFactory("BatchRegistryProxy");
  const proxy = await proxyFactory.deploy(
    implementationAddress,
    deployer.address,
    initData,
  );
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();

  console.log(`SupplierRegistry implementation: ${implementationAddress}`);
  console.log(`SupplierRegistry proxy: ${proxyAddress}`);
  console.log("Target network: Sepolia testnet");

  const payload = {
    network: "sepolia",
    deployer: deployer.address,
    implementationAddress,
    proxyAddress,
    supplierRegistryImplementationAddress: implementationAddress,
    supplierRegistryProxyAddress: proxyAddress,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = resolve(process.cwd(), "deployments.sepolia.json");
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Deployment output saved: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
