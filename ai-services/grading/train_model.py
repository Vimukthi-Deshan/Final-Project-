from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


@dataclass
class GradingMetrics:
    track: str
    accuracy: float
    confusion_matrix: List[List[int]]
    feature_importance: Dict[str, float]
    model: str
    labels: List[str]


@dataclass
class GradingEvaluationReport:
    track_1_real_data: GradingMetrics
    track_1_rule_baseline: GradingMetrics
    track_2_generalization_test: GradingMetrics
    track_2_rule_baseline_generalization_test: GradingMetrics


DATA_DIR = Path(__file__).parent / "data"
MODEL_DIR = Path(__file__).parent / "artifacts"
MODEL_PATH = MODEL_DIR / "grading_rf_track1.joblib"
REPORT_PATH = MODEL_DIR / "grading_evaluation_report.json"

FEATURE_COLUMNS = ["diameter_mm", "color_category", "texture_category"]


def rule_based_classifier(diameter_mm: float, color_category: str, texture_category: str) -> str:
    if diameter_mm < 6 and color_category == "pale_golden_tan":
        return "Alba"
    if diameter_mm < 7:
        return "C5"
    if diameter_mm < 9:
        return "C4"
    if diameter_mm < 11:
        return "Mexico"
    return "Hamburg"


def _build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", ["diameter_mm"]),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                ["color_category", "texture_category"],
            ),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
        min_samples_leaf=1,
    )
    return Pipeline(steps=[("preprocess", preprocessor), ("model", model)])


def _aggregate_feature_importance(fitted_pipeline: Pipeline) -> Dict[str, float]:
    model: RandomForestClassifier = fitted_pipeline.named_steps["model"]
    preprocessor: ColumnTransformer = fitted_pipeline.named_steps["preprocess"]
    raw_importances = model.feature_importances_

    numeric_feature_count = 1
    categorical_names = preprocessor.named_transformers_["cat"].get_feature_names_out(
        ["color_category", "texture_category"]
    )

    diameter_importance = float(raw_importances[0]) if numeric_feature_count == 1 else 0.0
    color_importance = 0.0
    texture_importance = 0.0

    for idx, name in enumerate(categorical_names, start=numeric_feature_count):
        if name.startswith("color_category"):
            color_importance += float(raw_importances[idx])
        elif name.startswith("texture_category"):
            texture_importance += float(raw_importances[idx])

    total = diameter_importance + color_importance + texture_importance
    if total == 0:
        return {"diameter": 0.0, "color": 0.0, "texture": 0.0}

    return {
        "diameter": round(diameter_importance / total, 6),
        "color": round(color_importance / total, 6),
        "texture": round(texture_importance / total, 6),
    }


def run_track_1_real_data_training() -> GradingMetrics:
    df = pd.read_csv(DATA_DIR / "real_alba_c5.csv")
    x = df[FEATURE_COLUMNS]
    y = df["grade"]

    labels = sorted(y.unique().tolist())
    skf = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)

    all_true: List[str] = []
    all_pred: List[str] = []
    fold_feature_importances: List[Dict[str, float]] = []

    for train_idx, test_idx in skf.split(x, y):
        x_train, x_test = x.iloc[train_idx], x.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        pipeline = _build_pipeline()
        pipeline.fit(x_train, y_train)

        y_pred = pipeline.predict(x_test)
        all_true.extend(y_test.tolist())
        all_pred.extend(y_pred.tolist())
        fold_feature_importances.append(_aggregate_feature_importance(pipeline))

    accuracy = float(accuracy_score(all_true, all_pred))
    cm = confusion_matrix(all_true, all_pred, labels=labels).tolist()

    feature_importance = {
        key: round(sum(item[key] for item in fold_feature_importances) / len(fold_feature_importances), 6)
        for key in ["diameter", "color", "texture"]
    }

    final_pipeline = _build_pipeline()
    final_pipeline.fit(x, y)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(final_pipeline, MODEL_PATH)

    return GradingMetrics(
        track="real_track_1",
        accuracy=round(accuracy, 6),
        confusion_matrix=cm,
        feature_importance=feature_importance,
        model="random_forest",
        labels=labels,
    )


def run_track_1_rule_baseline() -> GradingMetrics:
    df = pd.read_csv(DATA_DIR / "real_alba_c5.csv")
    labels = sorted(df["grade"].unique().tolist())
    y_true = df["grade"].tolist()
    y_pred = [
        rule_based_classifier(row.diameter_mm, row.color_category, row.texture_category)
        for row in df.itertuples(index=False)
    ]

    filtered = [(truth, pred) for truth, pred in zip(y_true, y_pred) if pred in labels]
    y_true_filtered = [truth for truth, _ in filtered]
    y_pred_filtered = [pred for _, pred in filtered]

    accuracy = float(accuracy_score(y_true_filtered, y_pred_filtered)) if filtered else 0.0
    cm = confusion_matrix(y_true_filtered, y_pred_filtered, labels=labels).tolist() if filtered else [[0, 0], [0, 0]]

    return GradingMetrics(
        track="real_track_1",
        accuracy=round(accuracy, 6),
        confusion_matrix=cm,
        feature_importance={"diameter": 0.6, "color": 0.3, "texture": 0.1},
        model="rule_based_baseline",
        labels=labels,
    )


def run_track_2_generalization_test() -> GradingMetrics:
    """Track 2 is synthetic and must always be labeled as generalization test."""
    synthetic_df = pd.read_csv(DATA_DIR / "synthetic_c4_mexico_hamburg.csv")
    x_test = synthetic_df[FEATURE_COLUMNS]
    y_true = synthetic_df["grade"]
    labels = sorted(y_true.unique().tolist())

    if not MODEL_PATH.exists():
        _ = run_track_1_real_data_training()

    pipeline: Pipeline = joblib.load(MODEL_PATH)
    y_pred = pipeline.predict(x_test)

    accuracy = float(accuracy_score(y_true, y_pred))
    cm = confusion_matrix(y_true, y_pred, labels=labels).tolist()

    return GradingMetrics(
        track="generalization_test_track_2",
        accuracy=round(accuracy, 6),
        confusion_matrix=cm,
        feature_importance=_aggregate_feature_importance(pipeline),
        model="random_forest",
        labels=labels,
    )


def run_track_2_rule_baseline_generalization_test() -> GradingMetrics:
    synthetic_df = pd.read_csv(DATA_DIR / "synthetic_c4_mexico_hamburg.csv")
    y_true = synthetic_df["grade"].tolist()
    labels = sorted(synthetic_df["grade"].unique().tolist())
    y_pred = [
        rule_based_classifier(row.diameter_mm, row.color_category, row.texture_category)
        for row in synthetic_df.itertuples(index=False)
    ]

    accuracy = float(accuracy_score(y_true, y_pred))
    cm = confusion_matrix(y_true, y_pred, labels=labels).tolist()

    return GradingMetrics(
        track="generalization_test_track_2",
        accuracy=round(accuracy, 6),
        confusion_matrix=cm,
        feature_importance={"diameter": 0.6, "color": 0.3, "texture": 0.1},
        model="rule_based_baseline",
        labels=labels,
    )


def run_full_evaluation() -> GradingEvaluationReport:
    report = GradingEvaluationReport(
        track_1_real_data=run_track_1_real_data_training(),
        track_1_rule_baseline=run_track_1_rule_baseline(),
        track_2_generalization_test=run_track_2_generalization_test(),
        track_2_rule_baseline_generalization_test=run_track_2_rule_baseline_generalization_test(),
    )

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with REPORT_PATH.open("w", encoding="utf-8") as handle:
        json.dump(asdict(report), handle, indent=2)

    return report


if __name__ == "__main__":
    result = run_full_evaluation()
    print(json.dumps(asdict(result), indent=2))
