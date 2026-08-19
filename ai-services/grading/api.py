from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from grading_validation import validate_and_encode

BASE_DIR = Path(__file__).parent
REPORT_PATH = BASE_DIR / "artifacts" / "grading_evaluation_report.json"


def rule_based_classifier(diameter_mm: float, color_category: str, texture_category: str) -> str:
    """Fallback used only when no serialized model can be loaded."""
    if diameter_mm < 6 and color_category == "pale_golden_tan":
        return "alba"
    if diameter_mm < 7:
        return "c5"
    if diameter_mm < 9:
        return "c4"
    if diameter_mm < 11:
        return "c5_sp"
    return "c5_ex_sp"


def _candidate_model_paths() -> list[Path]:
    env_model = os.environ.get("GRADING_MODEL_PATH")
    candidates: list[Path] = []
    if env_model:
        candidates.append(Path(env_model))

    # Prefer the model trained from your latest notebook run.
    candidates.extend(
        [
            BASE_DIR / "RandomCinnamon.pkl",
            BASE_DIR / "artifacts" / "grading_rf_track1.joblib",
        ]
    )
    return candidates


class GradingRequest(BaseModel):
    diameter_mm: float
    color_category: str
    texture_category: str


class GradingResponse(BaseModel):
    predicted_grade: str
    model: str
    track_label: str


class ReportResponse(BaseModel):
    status: str
    report_path: str
    report: dict[str, Any] | None


class ModelStatusResponse(BaseModel):
    loaded: bool
    model_path: str
    mode: str


pipeline_model: Any | None = None
loaded_model_path: Path | None = None


def load_pipeline_model() -> bool:
    global pipeline_model, loaded_model_path

    for model_path in _candidate_model_paths():
        if model_path.exists():
            pipeline_model = joblib.load(model_path)
            loaded_model_path = model_path
            return True

    pipeline_model = None
    loaded_model_path = None
    return False


app = FastAPI(title="Canela Grading Service", version="1.0.0")


@app.on_event("startup")
def startup_load_model() -> None:
    load_pipeline_model()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/model/status", response_model=ModelStatusResponse)
def model_status() -> ModelStatusResponse:
    loaded = pipeline_model is not None
    return ModelStatusResponse(
        loaded=loaded,
        model_path=str(loaded_model_path) if loaded_model_path else "not_loaded",
        mode="random_forest_track_1" if loaded else "rule_based_baseline",
    )


@app.post("/model/reload", response_model=ModelStatusResponse)
def reload_model() -> ModelStatusResponse:
    loaded = load_pipeline_model()
    return ModelStatusResponse(
        loaded=loaded,
        model_path=str(loaded_model_path) if loaded_model_path else "not_loaded",
        mode="random_forest_track_1" if loaded else "rule_based_baseline",
    )


@app.post("/predict", response_model=GradingResponse)
def predict(payload: GradingRequest) -> GradingResponse:
    validation = validate_and_encode(
        payload.diameter_mm,
        payload.color_category,
        payload.texture_category,
    )
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail=validation["error"])

    if pipeline_model is not None:
        input_frame = pd.DataFrame(
            [
                {
                    "diameter_mm": payload.diameter_mm,
                    "color_category": payload.color_category,
                    "texture_category": payload.texture_category,
                }
            ]
        )
        predicted = pipeline_model.predict(
            input_frame
        )[0]
        model_name = "random_forest_track_1"
    else:
        predicted = rule_based_classifier(
            payload.diameter_mm, payload.color_category, payload.texture_category
        )
        model_name = "rule_based_baseline"

    return GradingResponse(
        predicted_grade=predicted,
        model=model_name,
        track_label="not_applicable_runtime_prediction",
    )


@app.get("/evaluation", response_model=ReportResponse)
def get_evaluation() -> ReportResponse:
    if not REPORT_PATH.exists():
        return ReportResponse(
            status="report_missing",
            report_path=str(REPORT_PATH),
            report=None,
        )

    with REPORT_PATH.open("r", encoding="utf-8") as handle:
        report_data = json.load(handle)

    return ReportResponse(
        status="completed",
        report_path=str(REPORT_PATH),
        report=report_data,
    )


@app.post("/train", response_model=ReportResponse)
def train_and_evaluate() -> ReportResponse:
    return ReportResponse(
        status="manual_training_required",
        report_path=str(REPORT_PATH),
        report={
            "message": (
                "Training is intentionally separated from inference. "
                "Run train_model.ipynb (or train_model.py) to produce artifacts, "
                "then call /model/reload."
            )
        },
    )
