"""Unit tests for the data preparation pipeline and leakage safeguards."""

import pickle
from pathlib import Path
import pandas as pd
import numpy as np
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "processed"
ART_DIR = BASE_DIR / "artifacts"


@pytest.fixture(scope="module")
def dataset_splits():
    train_df = pd.read_csv(DATA_DIR / "train.csv")
    val_df = pd.read_csv(DATA_DIR / "val.csv")
    test_df = pd.read_csv(DATA_DIR / "test.csv")
    with open(ART_DIR / "preprocessor_metadata.pkl", "rb") as f:
        metadata = pickle.load(f)
    return train_df, val_df, test_df, metadata


def test_splits_exist_and_non_empty(dataset_splits):
    train_df, val_df, test_df, _ = dataset_splits
    assert len(train_df) > 50000, "Train set should have at least 50k records"
    assert len(val_df) > 5000, "Val set should have at least 5k records"
    assert len(test_df) > 5000, "Test set should have at least 5k records"


def test_chronological_ordering(dataset_splits):
    train_df, val_df, test_df, _ = dataset_splits
    train_df["date"] = pd.to_datetime(train_df["date"])
    val_df["date"] = pd.to_datetime(val_df["date"])
    test_df["date"] = pd.to_datetime(test_df["date"])

    assert train_df["date"].max() < val_df["date"].min(), "Val set contains dates on or before train max"
    assert val_df["date"].max() < test_df["date"].min(), "Test set contains dates on or before val max"


def test_capacity_and_target_bounds(dataset_splits):
    train_df, val_df, test_df, _ = dataset_splits
    for name, df in [("train", train_df), ("val", val_df), ("test", test_df)]:
        assert (df["tickets_sold"] >= 0).all(), f"Negative tickets sold in {name}"
        assert (df["capacity"] > 0).all(), f"Zero or negative capacity in {name}"
        assert (df["tickets_sold"] <= df["capacity"]).all(), f"Tickets sold exceeds screen capacity in {name}"


def test_no_target_leakage_columns(dataset_splits):
    _, _, _, metadata = dataset_splits
    prohibited_cols = ["total_sales", "tickets_out", "occu_perc", "ticket_use"]
    feature_cols = metadata["feature_columns"]
    for p in prohibited_cols:
        assert p not in feature_cols, f"Forbidden leakage column {p} detected in feature columns!"


def test_no_null_values_in_features(dataset_splits):
    train_df, val_df, test_df, metadata = dataset_splits
    feat_cols = metadata["feature_columns"]
    for name, df in [("train", train_df), ("val", val_df), ("test", test_df)]:
        null_counts = df[feat_cols].isnull().sum()
        assert null_counts.sum() == 0, f"Found null features in {name}:\n{null_counts[null_counts > 0]}"
