import { createApp } from "./app";
import { initMongo } from "./lib/mongo";
import { startAiServices } from "./lib/ai-services-launcher";
import { TraceabilityService } from "./modules/traceability/traceability.service";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";

const app = createApp();

async function bootstrap() {
  startAiServices();

  await initMongo();
  console.log("MongoDB connected successfully.");

  const traceabilityService = new TraceabilityService();
  const blockchain = await traceabilityService.getStartupReadiness();
  console.log(
    `Blockchain connected: network=${blockchain.network} chainId=${blockchain.chainId} contract=${blockchain.contractAddress} signer=${blockchain.signerAddress} latestBlock=${blockchain.latestBlock}`,
  );

  app.listen(port, host, () => {
    console.log(`Backend listening on http://${host}:${port}`);
  });
}

bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown startup error";
  console.error("Failed to start backend during startup checks.");
  console.error(`Reason: ${message}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
