from __future__ import annotations

from typing import Iterable, List

from .common import prophet_style_forecast


def forecast_prophet(series: Iterable[float], horizon: int) -> List[float]:
    return prophet_style_forecast(series, horizon)
