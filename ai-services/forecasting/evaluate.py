from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter
from typing import Callable, Dict, List

from data_utils import load_forecast_series
from models.common import ar_like_forecast, lightweight_lstm_forecast, naive_forecast, prophet_style_forecast


@dataclass
class ModelResult:
    model: str
    mape_percent: float
    training_time_ms: float
    inference_latency_ms: float
    interpretability: str
    deployment_decision: str


def mape(y_true: List[float], y_pred: List[float]) -> float:
    errors: List[float] = []
    for actual, predicted in zip(y_true, y_pred):
        if actual == 0:
            continue
        errors.append(abs((actual - predicted) / actual))
    if not errors:
        return 0.0
    return sum(errors) / len(errors) * 100


def evaluate_model(
    name: str,
    forecast_fn: Callable[[List[float], int], List[float]],
    train_series: List[float],
    test_series: List[float],
    interpretability: str,
) -> ModelResult:
    start_train = perf_counter()
    _ = list(train_series)
    train_time = (perf_counter() - start_train) * 1000

    start_infer = perf_counter()
    prediction = forecast_fn(train_series, len(test_series))
    infer_time = (perf_counter() - start_infer) * 1000

    return ModelResult(
        model=name,
        mape_percent=round(mape(test_series, prediction), 4),
        training_time_ms=round(train_time, 3),
        inference_latency_ms=round(infer_time, 3),
        interpretability=interpretability,
        deployment_decision="Pending empirical selection",
    )


def as_table_row(result: ModelResult) -> Dict[str, object]:
    return {
        "Model": result.model,
        "MAPE (%)": result.mape_percent,
        "Training Time": result.training_time_ms,
        "Inference Latency": result.inference_latency_ms,
        "Interpretability": result.interpretability,
        "Deployment Decision": result.deployment_decision,
    }


def run_forecasting_benchmark() -> List[ModelResult]:
    series = load_forecast_series().values
    split_index = max(30, int(len(series) * 0.8))
    train_series = series[:split_index]
    test_series = series[split_index:]

    return [
        evaluate_model("naive", naive_forecast, train_series, test_series, "Very high"),
        evaluate_model("arima", ar_like_forecast, train_series, test_series, "High"),
        evaluate_model("prophet", prophet_style_forecast, train_series, test_series, "Medium"),
        evaluate_model("lstm", lightweight_lstm_forecast, train_series, test_series, "Low"),
    ]


if __name__ == "__main__":
    results = run_forecasting_benchmark()
    for result in results:
        print(as_table_row(result))