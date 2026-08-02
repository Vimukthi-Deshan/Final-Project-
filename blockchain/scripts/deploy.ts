import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const registryFactory = await ethers.getContractFactory("BatchRegistry");
  const registry = await registryFactory.deploy();
  await registry.waitForDeployment();
  const implementationAddress = await registry.getAddress();

  const proxyFactory = await ethers.getContractFactory("BatchRegistryProxy");
  const proxy = await proxyFactory.deploy(
    implementationAddress,
    deployer.address,
    "0x",
  );
  await proxy.waitForDeployment();

  console.log(`BatchRegistry implementation: ${implementationAddress}`);
  console.log(`BatchRegistry proxy: ${await proxy.getAddress()}`);
  console.log("Target network: Sepolia testnet");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
