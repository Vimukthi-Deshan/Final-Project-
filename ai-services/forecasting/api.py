from fastapi import FastAPI
from pydantic import BaseModel


class ForecastRequest(BaseModel):
    model: str
    horizon_days: int


class ForecastResponse(BaseModel):
    model: str
    values: list[float]


app = FastAPI(title="Canela Forecasting Service", version="1.0.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/predict", response_model=ForecastResponse)
def predict(payload: ForecastRequest) -> ForecastResponse:
    horizon = max(1, min(payload.horizon_days, 90))
    return ForecastResponse(model=payload.model, values=[0.0] * horizon)
