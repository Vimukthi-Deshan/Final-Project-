from __future__ import annotations

import math
from typing import Iterable, Sequence

import numpy as np
from sklearn.linear_model import Ridge
from sklearn.neural_network import MLPRegressor


def naive_forecast(series: Iterable[float], horizon: int) -> list[float]:
    values = list(series)
    if not values:
        return [0.0] * horizon
    return [float(values[-1])] * horizon


def _build_lagged_matrix(series: Sequence[float], lag: int):
    values = np.asarray(series, dtype=float)
    if values.size <= lag:
        return None, None

    x_rows = []
    y_rows = []
    for index in range(lag, values.size):
        x_rows.append(values[index - lag : index])
        y_rows.append(values[index])

    return np.asarray(x_rows), np.asarray(y_rows)


def ar_like_forecast(series: Iterable[float], horizon: int, lag: int = 7) -> list[float]:
    values = list(series)
    if len(values) <= lag:
        return naive_forecast(values, horizon)

    x_train, y_train = _build_lagged_matrix(values, lag)
    if x_train is None or y_train is None:
        return naive_forecast(values, horizon)

    model = Ridge(alpha=1.0)
    model.fit(x_train, y_train)

    history = values[:]
    predictions: list[float] = []
    for _ in range(horizon):
        window = np.asarray(history[-lag:], dtype=float).reshape(1, -1)
        prediction = float(model.predict(window)[0])
        prediction = max(0.0, prediction)
        predictions.append(round(prediction, 4))
        history.append(prediction)

    return predictions


def prophet_style_forecast(series: Iterable[float], horizon: int) -> list[float]:
    values = list(series)
    if not values:
        return [0.0] * horizon

    y = np.asarray(values, dtype=float)
    n = y.size
    t = np.arange(n, dtype=float)

    features = [np.ones_like(t), t, t**2]
    for period in (7.0, 30.0):
        angle = 2 * math.pi * t / period
        features.append(np.sin(angle))
        features.append(np.cos(angle))

    x_train = np.column_stack(features)
    model = Ridge(alpha=0.5)
    model.fit(x_train, y)

    future_t = np.arange(n, n + horizon, dtype=float)
    future_features = [np.ones_like(future_t), future_t, future_t**2]
    for period in (7.0, 30.0):
        angle = 2 * math.pi * future_t / period
        future_features.append(np.sin(angle))
        future_features.append(np.cos(angle))

    x_future = np.column_stack(future_features)
    predictions = model.predict(x_future)
    return [round(max(0.0, float(value)), 4) for value in predictions]


def lightweight_lstm_forecast(series: Iterable[float], horizon: int, lookback: int = 14) -> list[float]:
    values = list(series)
    if len(values) <= lookback:
        return naive_forecast(values, horizon)

    x_train, y_train = _build_lagged_matrix(values, lookback)
    if x_train is None or y_train is None:
        return naive_forecast(values, horizon)

    model = MLPRegressor(
        hidden_layer_sizes=(32, 16),
        activation="relu",
        solver="adam",
        max_iter=800,
        random_state=42,
    )
    model.fit(x_train, y_train)

    history = values[:]
    predictions: list[float] = []
    for _ in range(horizon):
        window = np.asarray(history[-lookback:], dtype=float).reshape(1, -1)
        prediction = float(model.predict(window)[0])
        prediction = max(0.0, prediction)
        predictions.append(round(prediction, 4))
        history.append(prediction)

    return predictions
