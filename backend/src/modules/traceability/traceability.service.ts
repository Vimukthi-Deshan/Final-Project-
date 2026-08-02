import { Contract, JsonRpcProvider, Wallet } from "ethers";

import { BATCH_REGISTRY_ABI } from "./batch-registry.abi";
import {
  OnChainBatchMetadata,
  RegisterBatchMetadataInput,
  RegistrationResult,
} from "./traceability.types";

const SEPOLIA_CHAIN_ID = 11155111;

export class TraceabilityService {
  private readonly provider: JsonRpcProvider;
  private readonly signer: Wallet;
  private readonly contract: Contract;

  constructor(
    rpcUrl = process.env.SEPOLIA_RPC_URL,
    privateKey = process.env.SEPOLIA_SIGNER_PRIVATE_KEY,
    contractAddress = process.env.BATCH_REGISTRY_PROXY_ADDRESS,
  ) {
    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error(
        "Missing blockchain configuration. Set SEPOLIA_RPC_URL, SEPOLIA_SIGNER_PRIVATE_KEY, and BATCH_REGISTRY_PROXY_ADDRESS.",
      );
    }

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

  async registerBatchMetadata(
    input: RegisterBatchMetadataInput,
  ): Promise<RegistrationResult> {
    await this.assertSepoliaNetwork();

    const tx = await this.contract.registerBatch(
      input.batchId,
      input.sourceSupplierIds,
      input.processingDate,
      input.aiAssignedGrade,
      input.exportDestination,
      input.logisticsHandoverTimestamp,
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

  async verifyBatch(batchId: string): Promise<OnChainBatchMetadata> {
    await this.assertSepoliaNetwork();

    const exists = (await this.contract.batchExists(batchId)) as boolean;
    if (!exists) {
      throw new Error(`Batch ${batchId} not found on-chain.`);
    }

    const result = await this.contract.getBatch(batchId);

    return {
      batchId: result.batchId,
      sourceSupplierIds: result.sourceSupplierIds,
      processingDate: Number(result.processingDate),
      aiAssignedGrade: result.aiAssignedGrade,
      exportDestination: result.exportDestination,
      logisticsHandoverTimestamp: Number(result.logisticsHandoverTimestamp),
      registeredAt: Number(result.registeredAt),
    };
  }
}
