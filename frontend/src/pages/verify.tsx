import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  BatchHybridVerificationResponse,
  verifyBatchHybrid,
} from "../components/api-client";

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const didAutoVerifyRef = useRef(false);
  const [batchId, setBatchId] = useState(searchParams.get("batchId") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchHybridVerificationResponse | null>(
    null,
  );
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void | Promise<void>;
  } | null>(null);
  const scannerRegionId = "verify-qr-reader";

  function extractBatchIdFromScan(decodedText: string): string | null {
    const raw = decodedText.trim();
    const batchIdRegex = /CC-BATCH-[0-9]{4}-[0-9]{2}-[0-9]{5}/;

    if (batchIdRegex.test(raw)) {
      const match = raw.match(batchIdRegex);
      return match ? match[0] : null;
    }

    try {
      const url = new URL(raw);
      const fromQuery = url.searchParams.get("batchId");
      if (fromQuery && batchIdRegex.test(fromQuery)) {
        const match = fromQuery.match(batchIdRegex);
        return match ? match[0] : null;
      }
    } catch {
      return null;
    }

    return null;
  }

  async function runVerify(targetBatchId: string) {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const data = await verifyBatchHybrid(targetBatchId);
      setResult(data);
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "Verification failed",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (didAutoVerifyRef.current) {
      return;
    }
    didAutoVerifyRef.current = true;

    if (batchId) {
      void runVerify(batchId);
    }
  }, []);

  const trustStatus = !result
    ? null
    : result.summary.totalSuppliers === 0
      ? {
          label: "No suppliers linked",
          toneClass: "metric",
          message:
            "This batch has no supplier links yet, so trust cannot be calculated.",
        }
      : result.summary.allSuppliersVerified
        ? {
            label: "Trusted",
            toneClass: "status-ok",
            message:
              "All linked suppliers are registered and verified on-chain.",
          }
        : result.summary.verifiedSuppliers > 0 ||
            result.summary.registeredSuppliers > 0
          ? {
              label: "Partially trusted",
              toneClass: "metric",
              message:
                "Some supplier records are verified, but not all linked suppliers are fully verified.",
            }
          : {
              label: "Untrusted",
              toneClass: "status-error",
              message:
                "No linked supplier is currently verified on-chain for this batch.",
            };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!batchId) {
      return;
    }
    await runVerify(batchId);
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) {
      setIsScanning(false);
      return;
    }

    try {
      await scanner.stop();
      await scanner.clear();
    } catch {
      // Scanner might already be stopped or unavailable.
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  }

  async function startScanner() {
    if (isScanning) {
      return;
    }

    setScanError(null);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(scannerRegionId);
    scannerRef.current = scanner;

    try {
      setIsScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          const scannedBatchId = extractBatchIdFromScan(decodedText);
          if (!scannedBatchId) {
            setScanError(
              "QR scan succeeded, but no valid batch ID was found in the code.",
            );
            return;
          }

          setBatchId(scannedBatchId);
          void runVerify(scannedBatchId);
          void stopScanner();
        },
        () => {
          // Ignore scan misses to keep the UI quiet while camera is active.
        },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not start camera QR scanner";
      setScanError(message);
      await stopScanner();
    }
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  return (
    <section className="page">
      <h2>Public Batch Verification</h2>
      <p>Use camera scan or manual entry to verify a batch in one step.</p>
      {error ? <p className="status-error">{error}</p> : null}
      {scanError ? <p className="status-error">{scanError}</p> : null}

      <div className="metric">
        <h3>Scan QR Code</h3>
        <p>
          Scan a batch QR code to auto-fill the batch ID and run verification.
        </p>
        <div className="button-row">
          <button
            type="button"
            onClick={() => void startScanner()}
            disabled={isScanning}
          >
            {isScanning ? "Scanner Running" : "Start Camera Scan"}
          </button>
          <button
            type="button"
            className="button-soft"
            onClick={() => void stopScanner()}
            disabled={!isScanning}
          >
            Stop Scanner
          </button>
        </div>
        <div id={scannerRegionId} className="scanner-region" />
      </div>

      <form className="form" onSubmit={onSubmit}>
        <div className="row">
          <label className="form-field">
            <span>Batch ID</span>
            <input
              placeholder="CC-BATCH-2026-08-00001"
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify Batch"}
        </button>
      </form>
      {result ? (
        <>
          <div className={trustStatus?.toneClass ?? "metric"}>
            <strong>{trustStatus?.label}</strong>
            <p>{trustStatus?.message}</p>
          </div>

          <div className="metric">
            <h3>Batch Summary</h3>
            <div className="kv">
              <span>Batch ID</span>
              <span>{result.batch.batchId}</span>
              <span>Processing Date</span>
              <span>{result.batch.processingDate}</span>
              <span>Quality Grade</span>
              <span>{result.batch.qualityGrade ?? "Not assigned"}</span>
              <span>Export Destination</span>
              <span>{result.batch.exportDestination}</span>
              <span>Logistics Handover</span>
              <span>{result.batch.logisticsHandoverAt ?? "Not recorded"}</span>
            </div>
          </div>

          <div className="card-grid">
            <article className="metric">
              <h3>Total Suppliers</h3>
              <strong>{result.summary.totalSuppliers}</strong>
            </article>
            <article className="metric">
              <h3>Registered On-Chain</h3>
              <strong>{result.summary.registeredSuppliers}</strong>
            </article>
            <article className="metric">
              <h3>Verified On-Chain</h3>
              <strong>{result.summary.verifiedSuppliers}</strong>
            </article>
          </div>

          <div className="metric">
            <h3>Supplier Verification Breakdown</h3>
            {result.supplierChecks.length === 0 ? (
              <p>No supplier checks available for this batch.</p>
            ) : (
              result.supplierChecks.map((check) => (
                <article key={check.supplierId} className="metric">
                  <div className="kv">
                    <span>Supplier</span>
                    <span>{check.supplierId}</span>
                    <span>Contribution (kg)</span>
                    <span>{check.contributionKg}</span>
                    <span>Registered</span>
                    <span>{check.onChainRegistered ? "Yes" : "No"}</span>
                    <span>Verified</span>
                    <span>{check.onChainVerified ? "Yes" : "No"}</span>
                    <span>Data Hash</span>
                    <span>{check.dataHash ?? "Not found"}</span>
                    <span>Recorded At</span>
                    <span>
                      {check.recordedAt
                        ? new Date(check.recordedAt * 1000).toISOString()
                        : "Not recorded"}
                    </span>
                    <span>Verification Time</span>
                    <span>
                      {check.verificationTimestamp
                        ? new Date(
                            check.verificationTimestamp * 1000,
                          ).toISOString()
                        : "Not verified"}
                    </span>
                  </div>
                  {check.error ? (
                    <p className="status-error">{check.error}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="metric">
          <div className="kv">
            <span>Batch ID</span>
            <span>{batchId || "Not provided"}</span>
            <span>Status</span>
            <span>Enter a batch ID to run hybrid verification.</span>
            <span>Network</span>
            <span>Ethereum Sepolia</span>
          </div>
        </div>
      )}
    </section>
  );
}