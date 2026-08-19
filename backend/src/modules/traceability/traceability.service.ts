import { Contract, JsonRpcProvider, Wallet } from "ethers";

import { BATCH_REGISTRY_ABI } from "./batch-registry.abi";
import {
  OnChainSupplierRecord,
  RegistrationResult,
  RecordSupplierInput,
} from "./traceability.types";

const SEPOLIA_CHAIN_ID = 11155111;

export class TraceabilityService {
  private readonly provider: JsonRpcProvider;
  private readonly signer: Wallet;
  private readonly contract: Contract;
  private readonly contractAddress: string;

  constructor(
    rpcUrl = process.env.SEPOLIA_RPC_URL ?? process.env.BLOCKCHAIN_RPC_URL,
    privateKey = process.env.SEPOLIA_SIGNER_PRIVATE_KEY ??
      process.env.BLOCKCHAIN_PRIVATE_KEY,
    contractAddress = process.env.SUPPLIER_REGISTRY_PROXY_ADDRESS ??
      process.env.BATCH_REGISTRY_PROXY_ADDRESS,
  ) {
    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error(
        "Missing blockchain configuration. Set SUPPLIER_REGISTRY_PROXY_ADDRESS (or BATCH_REGISTRY_PROXY_ADDRESS) and either (SEPOLIA_RPC_URL + SEPOLIA_SIGNER_PRIVATE_KEY) or (BLOCKCHAIN_RPC_URL + BLOCKCHAIN_PRIVATE_KEY).",
      );
    }

    this.contractAddress = contractAddress;
    this.provider = new JsonRpcProvider(rpcUrl);
    this.signer = new Wallet(privateKey, this.provider);
    this.contract = new Contract(
      contractAddress,
      BATCH_REGISTRY_ABI,
      this.signer,
    );
  }

  async assertSepoliaNetwork(): Promise<void> {
    const network = await this.provider.getNetwork();
    if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
      throw new Error(
        `Unsupported network chainId ${network.chainId.toString()}. Sepolia (${SEPOLIA_CHAIN_ID}) is required.`,
      );
    }
  }

  async getStartupReadiness(): Promise<{
    network: string;
    chainId: number;
    contractAddress: string;
    signerAddress: string;
    latestBlock: number;
  }> {
    await this.assertSepoliaNetwork();

    const [network, latestBlock, signerAddress, contractCode] =
      await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber(),
        this.signer.getAddress(),
        this.provider.getCode(this.contractAddress),
      ]);

    if (!contractCode || contractCode === "0x") {
      throw new Error(
        `No smart contract bytecode found at ${this.contractAddress} on Sepolia. Check SUPPLIER_REGISTRY_PROXY_ADDRESS / BATCH_REGISTRY_PROXY_ADDRESS.`,
      );
    }

    const requiredFunctions = [
      "recordSupplier",
      "verifySupplier",
      "updateProductCount",
      "getSupplier",
      "verifySupplierHash",
      "registeredSuppliers",
    ] as const;

    for (const fnName of requiredFunctions) {
      try {
        this.contract.interface.getFunction(fnName);
      } catch {
        throw new Error(
          `Loaded ABI is missing required function '${fnName}'. Verify batch-registry.abi.ts matches deployed contract.`,
        );
      }
    }

    return {
      network: network.name,
      chainId: Number(network.chainId),
      contractAddress: this.contractAddress,
      signerAddress,
      latestBlock,
    };
  }

  private normalizeBytes32(hex: string): string {
    if (typeof hex !== "string" || hex.length === 0) {
      throw new Error("dataHash is required and must be a non-empty string.");
    }

    const withPrefix = hex.startsWith("0x") ? hex : `0x${hex}`;
    const bytes32Regex = /^0x[0-9a-fA-F]{64}$/;
    if (!bytes32Regex.test(withPrefix)) {
      throw new Error("dataHash must be a valid bytes32 hex string.");
    }

    return withPrefix;
  }

  async recordSupplier(
    input: RecordSupplierInput,
  ): Promise<RegistrationResult> {
    await this.assertSepoliaNetwork();

    const tx = await this.contract.recordSupplier(
      input.mongoDbId,
      this.normalizeBytes32(input.dataHash),
      input.productCount,
    );
    const receipt = await tx.wait();

    return {
      txHash: tx.hash,
      contractAddress: this.contract.target as string,
      network: "sepolia",
      chainId: SEPOLIA_CHAIN_ID,
      blockNumber: Number(receipt.blockNumber),
    };
  }

  async verifySupplier(mongoDbId: string): Promise<OnChainSupplierRecord> {
    await this.assertSepoliaNetwork();

    const exists = (await this.contract.registeredSuppliers(
      mongoDbId,
    )) as boolean;
    if (!exists) {
      throw new Error(`Supplier ${mongoDbId} not found on-chain.`);
    }

    const result = await this.contract.getSupplier(mongoDbId);

    return {
      mongoDbId: result.mongoDbId,
      dataHash: result.dataHash,
      recordedBy: result.recordedBy,
      recordedAt: Number(result.recordedAt),
      isVerified: Boolean(result.isVerified),
      verifiedBy: result.verifiedBy,
      verificationTimestamp: Number(result.verificationTimestamp),
      productCount: Number(result.productCount),
      isRegistered: exists,
    };
  }

  async markSupplierVerified(mongoDbId: string): Promise<RegistrationResult> {
    await this.assertSepoliaNetwork();

    const tx = await this.contract.verifySupplier(mongoDbId);
    const receipt = await tx.wait();

    return {
      txHash: tx.hash,
      contractAddress: this.contract.target as string,
      network: "sepolia",
      chainId: SEPOLIA_CHAIN_ID,
      blockNumber: Number(receipt.blockNumber),
    };
  }

  async updateSupplierProducts(
    mongoDbId: string,
    productCount: number,
  ): Promise<RegistrationResult> {
    await this.assertSepoliaNetwork();

    const tx = await this.contract.updateProductCount(mongoDbId, productCount);
    const receipt = await tx.wait();

    return {
      txHash: tx.hash,
      contractAddress: this.contract.target as string,
      network: "sepolia",
      chainId: SEPOLIA_CHAIN_ID,
      blockNumber: Number(receipt.blockNumber),
    };
  }

  async verifySupplierHash(
    mongoDbId: string,
    dataHash: string,
  ): Promise<boolean> {
    await this.assertSepoliaNetwork();

    return (await this.contract.verifySupplierHash(
      mongoDbId,
      this.normalizeBytes32(dataHash),
    )) as boolean;
  }
}
