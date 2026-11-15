"""LightGBM Regressor with temporal features, Poisson/L1 objective, and capacity constraints."""

from __future__ import annotations

import logging
import pickle
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import lightgbm as lgb
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class LGBMForecaster:
    """LightGBM demand forecaster with physical seating capacity clamping."""

    def __init__(
        self,
        n_estimators: int = 400,
        learning_rate: float = 0.05,
        num_leaves: int = 31,
        min_child_samples: int = 20,
        subsample: float = 0.8,
        colsample_bytree: float = 0.8,
        random_state: int = 42,
    ) -> None:
        self.params = {
            "objective": "regression_l1",  # Directly targets MAE and WAPE minimization
            "metric": "l1",
            "n_estimators": n_estimators,
            "learning_rate": learning_rate,
            "num_leaves": num_leaves,
            "min_child_samples": min_child_samples,
            "subsample": subsample,
            "colsample_bytree": colsample_bytree,
            "random_state": random_state,
            "n_jobs": -1,
            "verbose": -1,
        }
        self.model: Optional[lgb.LGBMRegressor] = None
        self.feature_columns: List[str] = []
        self.categorical_features: List[str] = []

    def fit(
        self,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        feature_cols: List[str],
        cat_cols: List[str],
        target_col: str = "tickets_sold",
    ) -> LGBMForecaster:
        """Fit the LightGBM model with early stopping on validation loss."""
        self.feature_columns = feature_cols
        self.categorical_features = [c for c in cat_cols if c in feature_cols]

        X_train = train_df[self.feature_columns].copy()
        y_train = train_df[target_col].values

        X_val = val_df[self.feature_columns].copy()
        y_val = val_df[target_col].values

        # Ensure categoricals are properly typed for LightGBM
        for c in self.categorical_features:
            X_train[c] = X_train[c].astype("category")
            X_val[c] = X_val[c].astype("category")

        logger.info(
            "Fitting LightGBM on %d train rows, validating on %d rows with %d features...",
            len(X_train),
            len(X_val),
            len(self.feature_columns),
        )

        self.model = lgb.LGBMRegressor(**self.params)
        self.model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(stopping_rounds=30, verbose=False)],
        )

        logger.info("Best iteration: %d", self.model.best_iteration_)
        return self

    def predict_unconstrained(self, df: pd.DataFrame) -> np.ndarray:
        """Predict true latent customer demand without auditorium seating ceiling."""
        if self.model is None:
            raise RuntimeError("Model is not fitted yet!")

        X = df[self.feature_columns].copy()
        for c in self.categorical_features:
            X[c] = X[c].astype("category")

        raw_preds = self.model.predict(X)
        return np.maximum(0, np.round(raw_preds)).astype(int)

    def predict(self, df: pd.DataFrame, return_unconstrained: bool = False) -> np.ndarray | Tuple[np.ndarray, np.ndarray]:
        """Predict ticket sales and clamp output strictly to [0, capacity]."""
        unconstrained = self.predict_unconstrained(df)
        capacities = df["capacity"].values
        clamped_preds = np.clip(unconstrained, 0, capacities).astype(int)
        if return_unconstrained:
            return clamped_preds, unconstrained
        return clamped_preds

    def get_feature_importances(self) -> pd.DataFrame:
        """Return feature importance ranking."""
        if self.model is None:
            raise RuntimeError("Model is not fitted yet!")

        return pd.DataFrame(
            {
                "feature": self.feature_columns,
                "importance": self.model.feature_importances_,
            }
        ).sort_values(by="importance", ascending=False)

    def save(self, path: Path | str) -> None:
        with open(path, "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, path: Path | str) -> LGBMForecaster:
        with open(path, "rb") as f:
            return pickle.load(f)
