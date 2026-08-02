from datetime import date, timedelta
from typing import Dict, List


def generate_daily_orders(start: date, days: int) -> List[Dict[str, object]]:
    rows: List[Dict[str, object]] = []
    grades = ["Alba", "C5", "C4", "Mexico", "Hamburg"]

    for i in range(days):
        current = start + timedelta(days=i)
        month_weight = 1.2 if current.month in {11, 12, 1} else 1.0
        quantity = round((120 + (i % 14) * 2) * month_weight, 2)
        rows.append(
            {
                "order_date": current.isoformat(),
                "product_grade": grades[i % len(grades)],
                "quantity_kg": quantity,
                "unit_price": round(16 + (i % 5) * 0.4, 2),
            }
        )

    return rows
