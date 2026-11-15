"""Data processing and feature engineering pipeline for Cinema Ticket Demand Forecasting.

Strictly enforces:
1. Physical seating capacity constraints.
2. Zero contemporaneous or future target leakage (features computed strictly at t <= T - 3 days).
3. Chronological train/validation/test splitting.
"""

from __future__ import annotations

import argparse
import logging
import pickle
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def clean_raw_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean anomalies, handle missing values, and enforce boundary constraints.

    - Drops missing/negative capacities and occupancy records.
    - Rounds fractional capacities to integer auditorium seats.
    - Ensures tickets_sold is non-negative and bounded by capacity.
    """
    logger.info("Raw input shape: %s", df.shape)
    initial_len = len(df)

    # Convert date to datetime
    df["date"] = pd.to_datetime(df["date"])

    # Filter out corrupted records with capacity <= 0 or null
    valid_mask = (df["capacity"].notna()) & (df["capacity"] > 0) & (df["tickets_sold"].notna())
    df = df[valid_mask].copy()
    logger.info("Filtered %d corrupt/null records. Remaining: %d", initial_len - len(df), len(df))

    # Round capacity to integer seats
    df["capacity"] = df["capacity"].round().astype(int)

    # Ensure tickets_sold is integer and bounded between 0 and capacity
    df["tickets_sold"] = df["tickets_sold"].clip(lower=0).round().astype(int)
    # Clip any anomalous over-capacity reporting to physical screen capacity
    df["tickets_sold"] = np.minimum(df["tickets_sold"], df["capacity"])

    # Calculate clean occupancy rate [0.0, 1.0]
    df["occupancy_rate"] = (df["tickets_sold"] / df["capacity"]).clip(0.0, 1.0)

    # Sort strictly chronologically by date
    df = df.sort_values(by=["date", "cinema_code", "show_time"]).reset_index(drop=True)
    return df


def build_temporal_lookups(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series]:
    """Precompute historical daily aggregates by film and by cinema.

    Enables fast, leakage-free lookups for any query date D with cutoff D - 3 days.
    """
    # Daily aggregate by film
    film_daily = (
        df.groupby(["film_code", "date"])
        .agg(
            total_tickets=("tickets_sold", "sum"),
            total_shows=("tickets_sold", "count"),
            avg_occupancy=("occupancy_rate", "mean"),
        )
        .reset_index()
    )

    # Daily aggregate by cinema
    cinema_daily = (
        df.groupby(["cinema_code", "date"])
        .agg(
            total_tickets=("tickets_sold", "sum"),
            total_shows=("tickets_sold", "count"),
            avg_occupancy=("occupancy_rate", "mean"),
        )
        .reset_index()
    )

    # Historical cinema median ticket price
    cinema_median_price = df.groupby("cinema_code")["ticket_price"].median()

    return film_daily, cinema_daily, cinema_median_price


def extract_features(
    df: pd.DataFrame,
    film_daily: pd.DataFrame,
    cinema_daily: pd.DataFrame,
    cinema_median_price: pd.Series,
    forecast_horizon_days: int = 3,
) -> pd.DataFrame:
    """Generate calendar, lag, momentum, and elasticity features strictly at t <= D - horizon.

    Forecast horizon default is 3 days (T - 3).
    """
    logger.info("Extracting features with forecast horizon T-%d days...", forecast_horizon_days)

    df = df.copy()

    # 1. Calendar & Cyclical Features
    df["day_of_week"] = df["date"].dt.dayofweek
    # Note: in this dataset, Tuesday (1), Thursday (3), and Friday (4) are peak days
    df["is_peak_day"] = df["day_of_week"].isin([1, 3, 4]).astype(int)
    df["is_weekend"] = df["day_of_week"].isin([4, 5, 6]).astype(int)
    df["day"] = df["date"].dt.day
    df["month"] = df["date"].dt.month
    df["quarter"] = df["date"].dt.quarter

    df["sin_dayofweek"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["cos_dayofweek"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    df["sin_month"] = np.sin(2 * np.pi * df["month"] / 12)
    df["cos_month"] = np.cos(2 * np.pi * df["month"] / 12)

    # Capacity tier (0: small <150, 1: medium 150-350, 2: large >350)
    df["capacity_tier"] = np.select(
        [df["capacity"] < 150, df["capacity"] <= 350],
        [0, 1],
        default=2,
    )

    # Price relative to cinema median
    df["cinema_median_price"] = df["cinema_code"].map(cinema_median_price).fillna(df["ticket_price"])
    df["relative_price"] = (df["ticket_price"] / df["cinema_median_price"].replace(0, 1)).clip(0.2, 5.0)

    # 2. Release & Cold-Start Features
    film_first_date = df.groupby("film_code")["date"].min().to_dict()
    df["film_first_date"] = df["film_code"].map(film_first_date)
    df["film_age_days"] = (df["date"] - df["film_first_date"]).dt.days.clip(lower=0)
    df["is_cold_start"] = (df["film_age_days"] <= forecast_horizon_days).astype(int)

    # 3. Vectorized / Indexed Rolling Lag Computations (strictly t <= D - forecast_horizon_days)
    # Pivot daily aggregates to date-indexed matrices for O(1) rolling range queries
    all_dates = pd.date_range(df["date"].min(), df["date"].max(), freq="D")

    # Film tickets pivot (index=date, columns=film_code)
    film_piv = film_daily.pivot(index="date", columns="film_code", values="total_tickets").reindex(all_dates).fillna(0)
    film_occ_piv = film_daily.pivot(index="date", columns="film_code", values="avg_occupancy").reindex(all_dates).fillna(0)

    # Cinema tickets pivot (index=date, columns=cinema_code)
    cin_piv = cinema_daily.pivot(index="date", columns="cinema_code", values="total_tickets").reindex(all_dates).fillna(0)
    cin_occ_piv = cinema_daily.pivot(index="date", columns="cinema_code", values="avg_occupancy").reindex(all_dates).fillna(0)

    # Rolling windows shifted by forecast_horizon_days to guarantee ZERO future leakage!
    # A shift of 3 days means date D sees window [D-9, D-3]
    film_7d_tickets = film_piv.shift(forecast_horizon_days).rolling(window=7, min_periods=1).sum()
    film_14d_tickets = film_piv.shift(forecast_horizon_days).rolling(window=14, min_periods=1).sum()
    film_7d_occ = film_piv.shift(forecast_horizon_days).rolling(window=7, min_periods=1).mean()

    cin_7d_tickets = cin_piv.shift(forecast_horizon_days).rolling(window=7, min_periods=1).sum()
    cin_7d_occ = cin_occ_piv.shift(forecast_horizon_days).rolling(window=7, min_periods=1).mean()

    # Map back to rows using MultiIndex lookup
    logger.info("Mapping rolling lag signals to show rows...")
    date_series = df["date"]
    film_series = df["film_code"]
    cin_series = df["cinema_code"]

    # Fast numpy lookup via stack
    f_7d_s = film_7d_tickets.stack().rename("film_lag_7d_tickets")
    f_14d_s = film_14d_tickets.stack().rename("film_lag_14d_tickets")
    f_occ_s = film_7d_occ.stack().rename("film_lag_7d_occupancy")

    c_7d_s = cin_7d_tickets.stack().rename("cinema_lag_7d_tickets")
    c_occ_s = cin_7d_occ.stack().rename("cinema_lag_7d_occupancy")

    idx_film = pd.MultiIndex.from_arrays([date_series, film_series], names=["date", "film_code"])
    idx_cin = pd.MultiIndex.from_arrays([date_series, cin_series], names=["date", "cinema_code"])

    df["film_lag_7d_tickets"] = f_7d_s.reindex(idx_film).values
    df["film_lag_14d_tickets"] = f_14d_s.reindex(idx_film).values
    df["film_lag_7d_occupancy"] = f_occ_s.reindex(idx_film).values

    df["cinema_lag_7d_tickets"] = c_7d_s.reindex(idx_cin).values
    df["cinema_lag_7d_occupancy"] = c_occ_s.reindex(idx_cin).values

    # Impute zeros for cold-start / early-window shows
    lag_cols = [
        "film_lag_7d_tickets",
        "film_lag_14d_tickets",
        "film_lag_7d_occupancy",
        "cinema_lag_7d_tickets",
        "cinema_lag_7d_occupancy",
    ]
    df[lag_cols] = df[lag_cols].fillna(0.0)

    # Drop leak-prone contemporaneous raw targets
    leakage_cols = ["total_sales", "tickets_out", "ticket_use", "occu_perc", "film_first_date", "cinema_median_price"]
    df = df.drop(columns=[col for col in leakage_cols if col in df.columns])

    logger.info("Feature extraction complete. Matrix shape: %s", df.shape)
    return df


def split_chronological(
    df: pd.DataFrame,
    train_end: str = "2018-08-31",
    val_end: str = "2018-09-30",
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split dataset chronologically into train, validation, and held-out test sets."""
    train_mask = df["date"] <= pd.to_datetime(train_end)
    val_mask = (df["date"] > pd.to_datetime(train_end)) & (df["date"] <= pd.to_datetime(val_end))
    test_mask = df["date"] > pd.to_datetime(val_end)

    train_df = df[train_mask].copy().reset_index(drop=True)
    val_df = df[val_mask].copy().reset_index(drop=True)
    test_df = df[test_mask].copy().reset_index(drop=True)

    logger.info("Chronological Split Summary:")
    logger.info("  Train set: %d rows (%s to %s)", len(train_df), train_df["date"].min().date(), train_df["date"].max().date())
    logger.info("  Val set:   %d rows (%s to %s)", len(val_df), val_df["date"].min().date(), val_df["date"].max().date())
    logger.info("  Test set:  %d rows (%s to %s)", len(test_df), test_df["date"].min().date(), test_df["date"].max().date())

    return train_df, val_df, test_df


def run_pipeline(
    raw_path: str,
    output_dir: str,
    artifacts_dir: str,
) -> None:
    """Run end-to-end data preparation, cleaning, feature engineering, and splitting."""
    raw_csv = Path(raw_path)
    out_dir = Path(output_dir)
    art_dir = Path(artifacts_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    art_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Loading raw dataset from %s...", raw_csv)
    raw_df = pd.read_csv(raw_csv)

    clean_df = clean_raw_data(raw_df)
    film_daily, cinema_daily, cinema_median_price = build_temporal_lookups(clean_df)

    feat_df = extract_features(clean_df, film_daily, cinema_daily, cinema_median_price, forecast_horizon_days=3)
    train_df, val_df, test_df = split_chronological(feat_df)

    # Save processed splits as compressed CSV
    train_df.to_csv(out_dir / "train.csv", index=False)
    val_df.to_csv(out_dir / "val.csv", index=False)
    test_df.to_csv(out_dir / "test.csv", index=False)

    # Save preprocessing metadata
    metadata = {
        "feature_columns": [
            col
            for col in train_df.columns
            if col not in ["date", "tickets_sold", "occupancy_rate"]
        ],
        "categorical_columns": ["film_code", "cinema_code", "show_time", "day_of_week", "capacity_tier"],
        "numerical_columns": [
            "capacity",
            "ticket_price",
            "relative_price",
            "film_age_days",
            "is_cold_start",
            "film_lag_7d_tickets",
            "film_lag_14d_tickets",
            "film_lag_7d_occupancy",
            "cinema_lag_7d_tickets",
            "cinema_lag_7d_occupancy",
            "sin_dayofweek",
            "cos_dayofweek",
            "sin_month",
            "cos_month",
            "is_peak_day",
            "is_weekend",
        ],
        "target_column": "tickets_sold",
        "cinema_median_price": cinema_median_price.to_dict(),
        "film_first_date": {int(k): str(v.date()) for k, v in clean_df.groupby("film_code")["date"].min().items()},
    }

    with open(art_dir / "preprocessor_metadata.pkl", "wb") as f:
        pickle.dump(metadata, f)

    logger.info("Data pipeline finished successfully. Artifacts saved to %s and %s", out_dir, art_dir)


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    default_raw = str(base_dir / "data" / "raw" / "cinemaTicket_Ref.csv")
    default_out = str(base_dir / "data" / "processed")
    default_art = str(base_dir / "artifacts")

    parser = argparse.ArgumentParser(description="Run Cinema Ticket Data Pipeline")
    parser.add_argument("--raw-path", default=default_raw)
    parser.add_argument("--output-dir", default=default_out)
    parser.add_argument("--artifacts-dir", default=default_art)
    args = parser.parse_args()

    run_pipeline(args.raw_path, args.output_dir, args.artifacts_dir)
