from __future__ import annotations

from typing import Iterable, List

from .common import lightweight_lstm_forecast


def forecast_lstm(series: Iterable[float], horizon: int) -> List[float]:
    return lightweight_lstm_forecast(series, horizon)
