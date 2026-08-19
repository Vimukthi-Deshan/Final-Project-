from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import pandas as pd


@dataclass(frozen=True)
class ForecastSeries:
    dates: list[pd.Timestamp]
    values: list[float]
    source_path: str
    date_column: str
    target_column: str


DATE_HINTS = ("date", "day", "time", "period", "month", "week")
TARGET_HINTS = (
    "quantity",
    "qty",
    "demand",
    "sales",
    "volume",
    "orders",
    "revenue",
    "amount",
    "units",
)


def _read_spreadsheet(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix in {".xlsx", ".xls"}:
        try:
            return pd.read_excel(path)
        except ImportError as exc:
            raise RuntimeError(
                "Reading Excel files requires openpyxl/xlrd. Install the package or convert the file to CSV."
            ) from exc
    return pd.read_csv(path)


def _infer_column(columns: Iterable[str], hints: tuple[str, ...]) -> str | None:
    for column in columns:
        lower = column.lower()
        if any(hint in lower for hint in hints):
            return column
    return None


def _find_first_numeric_column(frame: pd.DataFrame, exclude: set[str]) -> str | None:
    for column in frame.columns:
        if column in exclude:
            continue
        if pd.api.types.is_numeric_dtype(frame[column]):
            return column

    for column in frame.columns:
        if column in exclude:
            continue
        numeric = pd.to_numeric(frame[column], errors="coerce")
        if numeric.notna().sum() > 0:
            return column
    return None


def _normalize_frame(frame: pd.DataFrame) -> pd.DataFrame:
    cleaned = frame.copy()
    cleaned.columns = [str(column).strip() for column in cleaned.columns]
    cleaned = cleaned.dropna(how="all")
    return cleaned


def load_forecast_series() -> ForecastSeries:
    """Load and clean a forecasting series from CSV/XLS/XLSX or a synthetic fallback."""
    raw_path = os.environ.get("FORECASTING_DATA_PATH")
    if raw_path:
        source_path = Path(raw_path).expanduser()
        if not source_path.exists():
            raise FileNotFoundError(f"FORECASTING_DATA_PATH does not exist: {source_path}")
        frame = _read_spreadsheet(source_path)
    else:
        source_path = Path("synthetic")
        frame = pd.DataFrame(
            {
                "date": pd.date_range("2024-01-01", periods=180, freq="D"),
                "quantity_kg": [
                    round(120 + (i % 14) * 2 + (15 if i % 30 in {0, 1, 2} else 0), 2)
                    for i in range(180)
                ],
            }
        )

    frame = _normalize_frame(frame)

    date_column = os.environ.get("FORECASTING_DATE_COLUMN")
    target_column = os.environ.get("FORECASTING_TARGET_COLUMN")

    if not date_column:
        date_column = _infer_column(frame.columns, DATE_HINTS)
    if not target_column:
        target_column = _infer_column(frame.columns, TARGET_HINTS)

    if not date_column:
        raise ValueError(
            "Could not infer a date column. Set FORECASTING_DATE_COLUMN or rename a column with 'date'/'day'/'time'."
        )
    if not target_column:
        target_column = _find_first_numeric_column(frame, {date_column})

    if not target_column:
        raise ValueError(
            "Could not infer a numeric target column. Set FORECASTING_TARGET_COLUMN or include a numeric demand/quantity column."
        )

    working = frame[[date_column, target_column]].copy()
    working[date_column] = pd.to_datetime(working[date_column], errors="coerce")
    working[target_column] = pd.to_numeric(working[target_column], errors="coerce")

    working = working.dropna(subset=[date_column, target_column])
    working = working[working[target_column] >= 0]
    working = working.sort_values(date_column)
    working = working.groupby(date_column, as_index=False)[target_column].sum()

    if working.empty:
        raise ValueError("No usable rows remained after cleaning the forecasting dataset.")

    return ForecastSeries(
        dates=working[date_column].tolist(),
        values=[float(value) for value in working[target_column].tolist()],
        source_path=str(source_path),
        date_column=date_column,
        target_column=target_column,
    )
