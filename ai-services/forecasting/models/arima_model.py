from __future__ import annotations

from typing import Iterable, List

from .common import ar_like_forecast


def forecast_arima(series: Iterable[float], horizon: int) -> List[float]:
    return ar_like_forecast(series, horizon)
