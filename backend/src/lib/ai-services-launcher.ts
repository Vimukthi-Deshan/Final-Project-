import { ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

interface AiServiceConfig {
  name: string;
  cwd: string;
  port: number;
  venvCandidates: string[];
}

const AI_SERVICES_ROOT = path.resolve(process.cwd(), "..", "ai-services");

const SERVICES: AiServiceConfig[] = [
  {
    name: "grading",
    cwd: path.join(AI_SERVICES_ROOT, "grading"),
    port: Number(process.env.GRADING_SERVICE_PORT ?? 8001),
    venvCandidates: [".venv", "venv"],
  },
  {
    name: "forecasting",
    cwd: path.join(AI_SERVICES_ROOT, "forecasting"),
    port: Number(process.env.FORECASTING_SERVICE_PORT ?? 8002),
    venvCandidates: [".venv", "venv"],
  },
];

function resolvePythonBin(service: AiServiceConfig): string | null {
  for (const venvDir of service.venvCandidates) {
    const bin = path.join(service.cwd, venvDir, "bin", "python");
    if (existsSync(bin)) {
      return bin;
    }
  }
  return null;
}

const children: ChildProcess[] = [];

export function startAiServices(): void {
  if (process.env.SKIP_AI_SERVICE_AUTOSTART === "true") {
    console.log(
      "[ai-services] Autostart disabled via SKIP_AI_SERVICE_AUTOSTART=true",
    );
    return;
  }

  for (const service of SERVICES) {
    const pythonBin = resolvePythonBin(service);
    if (!pythonBin) {
      console.warn(
        `[ai-services] Skipping '${service.name}': no virtualenv found at ${service.venvCandidates.join(" or ")} inside ${service.cwd}`,
      );
      continue;
    }

    const child = spawn(
      pythonBin,
      [
        "-m",
        "uvicorn",
        "api:app",
        "--host",
        "127.0.0.1",
        "--port",
        String(service.port),
      ],
      { cwd: service.cwd, stdio: "pipe" },
    );

    child.stdout?.on("data", (chunk: Buffer) => {
      process.stdout.write(`[${service.name}] ${chunk}`);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(`[${service.name}] ${chunk}`);
    });
    child.on("exit", (code, signal) => {
      console.warn(
        `[ai-services] '${service.name}' exited (code=${code}, signal=${signal})`,
      );
    });

    children.push(child);
    console.log(
      `[ai-services] Launched '${service.name}' on http://127.0.0.1:${service.port} (pid=${child.pid})`,
    );
  }
}

export function stopAiServices(): void {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.once("exit", stopAiServices);
process.once("SIGINT", () => {
  stopAiServices();
  process.exit(0);
});
process.once("SIGTERM", () => {
  stopAiServices();
  process.exit(0);
});
