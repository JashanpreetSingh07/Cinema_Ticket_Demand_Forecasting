"""Comprehensive evaluation module with capacity-aware metrics and cold-start subgroup analysis."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, capacities: np.ndarray) -> Dict[str, float]:
    """Calculate regression and capacity-aware business metrics."""
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    capacities = np.asarray(capacities, dtype=float)

    diff = y_true - y_pred
    abs_diff = np.abs(diff)

    mae = float(np.mean(abs_diff))
    rmse = float(np.sqrt(np.mean(diff**2)))

    # Weighted Absolute Percentage Error (WAPE)
    total_actual = np.sum(y_true)
    wape = float((np.sum(abs_diff) / total_actual) * 100.0) if total_actual > 0 else 0.0

    # Occupancy rate error
    occ_diff = abs_diff / np.maximum(capacities, 1.0)
    occ_mae = float(np.mean(occ_diff) * 100.0)  # percentage points

    # Capacity business loss
    under_allocation = float(np.sum(np.maximum(0, y_true - y_pred)))  # Turned away demand
    over_allocation = float(np.sum(np.maximum(0, y_pred - y_true)))  # Wasted seat expectation

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "wape_pct": round(wape, 2),
        "occupancy_mae_pct": round(occ_mae, 2),
        "under_allocation_tickets": int(under_allocation),
        "over_allocation_tickets": int(over_allocation),
    }


def evaluate_model_on_subgroups(
    df: pd.DataFrame,
    preds: np.ndarray,
    target_col: str = "tickets_sold",
) -> Dict[str, Any]:
    """Evaluate performance across overall test set and key operational subgroups:

    1. Cold-start vs Established films
    2. Peak vs Off-peak days
    3. Small vs Large screen sizes
    """
    y_true = df[target_col].values
    caps = df["capacity"].values

    overall = compute_metrics(y_true, preds, caps)

    # Subgroup 1: Cold start
    cold_mask = df["is_cold_start"] == 1
    if cold_mask.sum() > 0:
        cold_metrics = compute_metrics(y_true[cold_mask], preds[cold_mask], caps[cold_mask])
        cold_metrics["sample_count"] = int(cold_mask.sum())
    else:
        cold_metrics = {}

    mature_mask = ~cold_mask
    mature_metrics = compute_metrics(y_true[mature_mask], preds[mature_mask], caps[mature_mask])
    mature_metrics["sample_count"] = int(mature_mask.sum())

    # Subgroup 2: Peak vs Off-peak
    peak_mask = df["is_peak_day"] == 1
    peak_metrics = compute_metrics(y_true[peak_mask], preds[peak_mask], caps[peak_mask])
    offpeak_metrics = compute_metrics(y_true[~peak_mask], preds[~peak_mask], caps[~peak_mask])

    return {
        "overall": overall,
        "cold_start": cold_metrics,
        "mature": mature_metrics,
        "peak_days": peak_metrics,
        "offpeak_days": offpeak_metrics,
    }


def format_comparison_table(results: Dict[str, Dict[str, Any]]) -> str:
    """Format evaluation results into a clean markdown table."""
    headers = [
        "Model",
        "Test MAE (Seats)",
        "Test RMSE",
        "Test WAPE (%)",
        "Occupancy MAE (%)",
        "Cold-Start WAPE (%)",
        "Turnaway Loss (Tkts)",
    ]
    rows = []
    for model_name, res in results.items():
        ov = res["overall"]
        cs_wape = res.get("cold_start", {}).get("wape_pct", "N/A")
        rows.append(
            [
                model_name,
                f"{ov['mae']:.2f}",
                f"{ov['rmse']:.2f}",
                f"{ov['wape_pct']:.2f}%",
                f"{ov['occupancy_mae_pct']:.2f}%",
                f"{cs_wape}%" if isinstance(cs_wape, (int, float)) else str(cs_wape),
                f"{ov['under_allocation_tickets']:,}",
            ]
        )

    # Determine column widths
    col_widths = [max(len(h), max(len(r[i]) for r in rows)) for i, h in enumerate(headers)]
    header_str = " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers))
    sep_str = "-|-".join("-" * col_widths[i] for i in range(len(headers)))
    row_strs = [" | ".join(r[i].ljust(col_widths[i]) for i in range(len(headers))) for r in rows]

    return f"| {header_str} |\n| {sep_str} |\n" + "\n".join(f"| {r} |" for r in row_strs)
