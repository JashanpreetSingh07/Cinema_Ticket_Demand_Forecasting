"""Unit tests for models: capacity bounding, non-negativity, and cold-start robustness."""

import pickle
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from src.models.baseline import CapacityAdjustedBaseline
from src.models.lgbm_forecaster import LGBMForecaster
from src.models.torch_forecaster import TorchTabularForecaster
from src.api.app import EnsembleForecaster

BASE_DIR = Path(__file__).resolve().parent.parent
ART_DIR = BASE_DIR / "artifacts"
DATA_DIR = BASE_DIR / "data" / "processed"


@pytest.fixture(scope="module")
def models_and_sample():
    baseline = CapacityAdjustedBaseline.load(ART_DIR / "baseline_model.pkl")
    lgbm = LGBMForecaster.load(ART_DIR / "lightgbm_model.pkl")
    torch_model = TorchTabularForecaster.load(ART_DIR / "torch_model.pkl")
    ensemble = EnsembleForecaster(lgbm, torch_model, lgb_weight=0.65)

    test_df = pd.read_csv(DATA_DIR / "test.csv").head(100)
    return baseline, lgbm, torch_model, ensemble, test_df


def test_models_loaded_successfully(models_and_sample):
    baseline, lgbm, torch_model, ensemble, _ = models_and_sample
    assert baseline is not None
    assert lgbm is not None
    assert torch_model is not None
    assert ensemble is not None


def test_strict_capacity_bounding(models_and_sample):
    baseline, lgbm, torch_model, ensemble, sample_df = models_and_sample
    capacities = sample_df["capacity"].values

    for model, name in [(baseline, "Baseline"), (lgbm, "LightGBM"), (torch_model, "PyTorch"), (ensemble, "Ensemble")]:
        preds = model.predict(sample_df)
        assert len(preds) == len(sample_df), f"{name} output length mismatch"
        assert (preds >= 0).all(), f"{name} generated negative ticket predictions!"
        assert (preds <= capacities).all(), f"{name} exceeded physical auditorium capacity!"


def test_unconstrained_demand_relationship(models_and_sample):
    baseline, lgbm, torch_model, ensemble, sample_df = models_and_sample
    tiny_df = sample_df.head(10).copy()
    tiny_df["capacity"] = 10  # Constrained capacity

    for model, name in [(baseline, "Baseline"), (lgbm, "LightGBM"), (torch_model, "PyTorch"), (ensemble, "Ensemble")]:
        if hasattr(model, "predict_unconstrained"):
            uncon = model.predict_unconstrained(tiny_df)
            clamped = model.predict(tiny_df)
            assert (uncon >= 0).all()
            assert (clamped <= 10).all()
            # Unconstrained demand is always >= physical admitted tickets
            assert (uncon >= clamped).all(), f"{name}: unconstrained demand should be >= admitted tickets"


def test_extreme_capacity_edge_cases(models_and_sample):
    baseline, lgbm, torch_model, ensemble, sample_df = models_and_sample
    edge_df = sample_df.head(5).copy()

    # Test small 20-seat VIP lounge
    edge_df["capacity"] = 20
    for model, name in [(baseline, "Baseline"), (lgbm, "LightGBM"), (torch_model, "PyTorch"), (ensemble, "Ensemble")]:
        preds = model.predict(edge_df)
        assert (preds >= 0).all()
        assert (preds <= 20).all(), f"{name} failed on tiny capacity edge case"

    # Test large 1000-seat IMAX hall
    edge_df["capacity"] = 1000
    for model, name in [(baseline, "Baseline"), (lgbm, "LightGBM"), (torch_model, "PyTorch"), (ensemble, "Ensemble")]:
        preds = model.predict(edge_df)
        assert (preds >= 0).all()
        assert (preds <= 1000).all(), f"{name} failed on large capacity edge case"


def test_cold_start_robustness(models_and_sample):
    baseline, lgbm, torch_model, ensemble, sample_df = models_and_sample
    cold_df = sample_df.head(5).copy()
    cold_df["is_cold_start"] = 1
    cold_df["film_age_days"] = 0
    cold_df["film_lag_7d_tickets"] = 0.0
    cold_df["film_lag_14d_tickets"] = 0.0
    cold_df["film_lag_7d_occupancy"] = 0.0

    for model, name in [(baseline, "Baseline"), (lgbm, "LightGBM"), (torch_model, "PyTorch"), (ensemble, "Ensemble")]:
        preds = model.predict(cold_df)
        assert not np.isnan(preds).any(), f"{name} produced NaN on cold-start input"
        assert (preds >= 0).all(), f"{name} produced negative prediction on cold start"
