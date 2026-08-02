from typing import Iterable, List


def forecast_lstm(series: Iterable[float], horizon: int) -> List[float]:
    values = list(series)
    if not values:
        return [0.0] * horizon
    return [values[-1]] * horizon
