from fastapi import FastAPI
from pydantic import BaseModel, Field
from dataclasses import asdict

from train_model import (
    MODEL_PATH,
    run_full_evaluation,
    rule_based_classifier,
)

import joblib


class GradingRequest(BaseModel):
    diameter_mm: float
    color_category: str
    texture_category: str


class GradingResponse(BaseModel):
    predicted_grade: str
    model: str
    track_label: str


class EvaluationResponse(BaseModel):
    status: str
    report_path: str
    report: dict


class TrainRequest(BaseModel):
    force_retrain: bool = Field(default=False)


app = FastAPI(title="Canela Grading Service", version="1.0.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/predict", response_model=GradingResponse)
def predict(payload: GradingRequest) -> GradingResponse:
    if MODEL_PATH.exists():
        pipeline = joblib.load(MODEL_PATH)
        predicted = pipeline.predict(
            [
                {
                    "diameter_mm": payload.diameter_mm,
                    "color_category": payload.color_category,
                    "texture_category": payload.texture_category,
                }
            ]
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


@app.post("/train", response_model=EvaluationResponse)
def train_and_evaluate(_: TrainRequest) -> EvaluationResponse:
    report = run_full_evaluation()
    return EvaluationResponse(
        status="completed",
        report_path=str(MODEL_PATH.parent / "grading_evaluation_report.json"),
        report=asdict(report),
    )


@app.get("/evaluation", response_model=EvaluationResponse)
def get_evaluation() -> EvaluationResponse:
    report = run_full_evaluation()
    return EvaluationResponse(
        status="completed",
        report_path=str(MODEL_PATH.parent / "grading_evaluation_report.json"),
        report=asdict(report),
    )
