from __future__ import annotations

from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from data_utils import ForecastSeries, load_forecast_series
from models.common import (
    ar_like_forecast,
    lightweight_lstm_forecast,
    naive_forecast,
    prophet_style_forecast,
)


ForecastModel = Literal["naive", "arima", "prophet", "lstm"]


class ForecastRequest(BaseModel):
    model: ForecastModel
    horizon_days: int
    custom_series: list[float] | None = None


class ForecastResponse(BaseModel):
    model: ForecastModel
    horizon_days: int
    values: list[float]
    source_path: str
    date_column: str
    target_column: str
    observations: int


app = FastAPI(title="Canela Forecasting Service", version="1.0.0")

forecast_series: ForecastSeries | None = None


@app.on_event("startup")
def startup_load_data() -> None:
    global forecast_series
    forecast_series = load_forecast_series()


@app.get("/health")
def health() -> dict:
    loaded = forecast_series is not None
    return {"status": "ok", "data_loaded": loaded}


@app.get("/series-info")
def series_info() -> dict:
    if forecast_series is None:
        raise HTTPException(status_code=503, detail="Forecast series is not loaded yet")

    return {
        "source_path": forecast_series.source_path,
        "date_column": forecast_series.date_column,
        "target_column": forecast_series.target_column,
        "observations": len(forecast_series.values),
        "first_date": forecast_series.dates[0].isoformat() if forecast_series.dates else None,
        "last_date": forecast_series.dates[-1].isoformat() if forecast_series.dates else None,
    }


@app.post("/predict", response_model=ForecastResponse)
def predict(payload: ForecastRequest) -> ForecastResponse:
    if forecast_series is None:
        raise HTTPException(status_code=503, detail="Forecast series is not loaded yet")

    horizon = max(1, min(payload.horizon_days, 90))
    series = payload.custom_series or forecast_series.values
    if len(series) == 0:
        raise HTTPException(status_code=400, detail="Custom series is empty")

    if payload.model == "naive":
        values = naive_forecast(series, horizon)
    elif payload.model == "arima":
        values = ar_like_forecast(series, horizon)
    elif payload.model == "prophet":
        values = prophet_style_forecast(series, horizon)
    elif payload.model == "lstm":
        values = lightweight_lstm_forecast(series, horizon)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model '{payload.model}'")

    return ForecastResponse(
        model=payload.model,
        horizon_days=horizon,
        values=values,
        source_path=(
            "uploaded:custom_series"
            if payload.custom_series is not None
            else forecast_series.source_path
        ),
        date_column=(
            "uploaded:date"
            if payload.custom_series is not None
            else forecast_series.date_column
        ),
        target_column=(
            "uploaded:paid_order_count"
            if payload.custom_series is not None
            else forecast_series.target_column
        ),
        observations=len(series),
    )