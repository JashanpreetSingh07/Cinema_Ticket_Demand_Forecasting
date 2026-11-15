"""Capacity-adjusted historical moving average baseline forecaster."""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd


class CapacityAdjustedBaseline:
    """A defensible heuristic baseline for cinema demand forecasting.

    Heuristic:
    1. Group historical screenings by (day_of_week, show_time) to determine historical occupancy distribution.
    2. Group by film_code to compute film-specific popularity multiplier.
    3. Prediction = round(min(1.0, max(0.0, base_occupancy * film_multiplier)) * screen_capacity).
    """

    def __init__(self) -> None:
        self.slot_occupancy: Dict[Tuple[int, int], float] = {}
        self.film_multiplier: Dict[int, float] = {}
        self.global_median_occupancy: float = 0.15

    def fit(self, df: pd.DataFrame) -> CapacityAdjustedBaseline:
        """Fit baseline heuristics using training split."""
        df = df.copy()
        if "occupancy_rate" not in df.columns:
            df["occupancy_rate"] = (df["tickets_sold"] / df["capacity"]).clip(0.0, 1.0)

        # Global median occupancy
        self.global_median_occupancy = float(df["occupancy_rate"].median())

        # Slot-level median occupancy (day_of_week, show_time)
        slot_grp = df.groupby(["day_of_week", "show_time"])["occupancy_rate"].median()
        self.slot_occupancy = slot_grp.to_dict()

        # Film-level relative popularity multiplier relative to global median
        film_grp = df.groupby("film_code")["occupancy_rate"].median()
        self.film_multiplier = (film_grp / max(self.global_median_occupancy, 0.01)).to_dict()

        return self

    def predict_unconstrained(self, df: pd.DataFrame) -> np.ndarray:
        """Predict unconstrained customer demand without screen capacity ceiling."""
        unconstrained = []
        for _, row in df.iterrows():
            dow = int(row.get("day_of_week", 0))
            show_time = int(row.get("show_time", 1))
            film = int(row.get("film_code", -1))
            capacity = float(row.get("capacity", 100))

            base_occ = self.slot_occupancy.get((dow, show_time), self.global_median_occupancy)
            multiplier = self.film_multiplier.get(film, 1.0)

            # Unconstrained demand (can exceed capacity if popularity multiplier is high)
            raw_demand = int(round(base_occ * multiplier * capacity))
            unconstrained.append(max(0, raw_demand))
        return np.array(unconstrained, dtype=int)

    def predict(self, df: pd.DataFrame, return_unconstrained: bool = False) -> np.ndarray | Tuple[np.ndarray, np.ndarray]:
        """Predict integer ticket sales bounded strictly by screen capacity."""
        unconstrained = self.predict_unconstrained(df)
        capacities = df["capacity"].values.astype(int)
        clamped = np.minimum(unconstrained, capacities).astype(int)
        if return_unconstrained:
            return clamped, unconstrained
        return clamped

    def save(self, path: Path | str) -> None:
        with open(path, "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, path: Path | str) -> CapacityAdjustedBaseline:
        with open(path, "rb") as f:
            return pickle.load(f)
