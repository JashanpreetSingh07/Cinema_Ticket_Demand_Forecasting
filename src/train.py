"""Master training pipeline orchestrating Baseline, LightGBM, and PyTorch TabularNet models."""

from __future__ import annotations

import argparse
import json
import logging
import pickle
from pathlib import Path
from typing import Any, Dict

import pandas as pd

from src.evaluation import evaluate_model_on_subgroups, format_comparison_table
from src.models.baseline import CapacityAdjustedBaseline
from src.models.lgbm_forecaster import LGBMForecaster
from src.models.torch_forecaster import TorchTabularForecaster

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = str(BASE_DIR / "data" / "processed")
DEFAULT_ART_DIR = str(BASE_DIR / "artifacts")


def main(
    data_dir: str = DEFAULT_DATA_DIR,
    artifacts_dir: str = DEFAULT_ART_DIR,
) -> None:
    data_path = Path(data_dir)
    art_path = Path(artifacts_dir)
    art_path.mkdir(parents=True, exist_ok=True)

    logger.info("Loading processed dataset splits from %s...", data_path)
    train_df = pd.read_csv(data_path / "train.csv")
    val_df = pd.read_csv(data_path / "val.csv")
    test_df = pd.read_csv(data_path / "test.csv")

    with open(art_path / "preprocessor_metadata.pkl", "rb") as f:
        meta = pickle.load(f)

    feature_cols = meta["feature_columns"]
    cat_cols = meta["categorical_columns"]
    num_cols = meta["numerical_columns"]

    logger.info(
        "Dataset loaded. Train: %d | Val: %d | Test: %d | Features: %d",
        len(train_df),
        len(val_df),
        len(test_df),
        len(feature_cols),
    )

    results: Dict[str, Dict[str, Any]] = {}

    # 1. Baseline Model
    logger.info("=" * 60)
    logger.info("1/3 Training Baseline: Capacity-Aware Moving Average...")
    baseline = CapacityAdjustedBaseline()
    baseline.fit(train_df)
    baseline.save(art_path / "baseline_model.pkl")

    base_preds = baseline.predict(test_df)
    results["1. Baseline (Moving Avg)"] = evaluate_model_on_subgroups(test_df, base_preds)
    logger.info("Baseline Test MAE: %.2f | WAPE: %.2f%%", results["1. Baseline (Moving Avg)"]["overall"]["mae"], results["1. Baseline (Moving Avg)"]["overall"]["wape_pct"])

    # 2. LightGBM Forecaster
    logger.info("=" * 60)
    logger.info("2/3 Training Candidate 1: LightGBM Regressor (L1 Objective)...")
    lgbm = LGBMForecaster(n_estimators=450, learning_rate=0.04, num_leaves=35, random_state=42)
    lgbm.fit(train_df, val_df, feature_cols=feature_cols, cat_cols=cat_cols)
    lgbm.save(art_path / "lightgbm_model.pkl")

    # Save feature importances
    feat_imp = lgbm.get_feature_importances()
    feat_imp.to_csv(art_path / "feature_importance.csv", index=False)
    logger.info("Top 5 Influential Features:\n%s", feat_imp.head(5).to_string(index=False))

    lgbm_preds = lgbm.predict(test_df)
    results["2. LightGBM Regressor"] = evaluate_model_on_subgroups(test_df, lgbm_preds)
    logger.info("LightGBM Test MAE: %.2f | WAPE: %.2f%%", results["2. LightGBM Regressor"]["overall"]["mae"], results["2. LightGBM Regressor"]["overall"]["wape_pct"])

    # 3. PyTorch Deep Tabular Network
    logger.info("=" * 60)
    logger.info("3/3 Training Candidate 2: PyTorch Deep TabularNet (Entity Embeddings + Sigmoid Scaling)...")
    torch_model = TorchTabularForecaster(batch_size=512, lr=1.5e-3, epochs=20, patience=4)
    torch_model.fit(train_df, val_df, cat_cols=cat_cols, cont_cols=num_cols)
    torch_model.save(art_path / "torch_model.pkl")

    torch_preds = torch_model.predict(test_df)
    results["3. PyTorch TabularNet"] = evaluate_model_on_subgroups(test_df, torch_preds)
    logger.info("PyTorch Test MAE: %.2f | WAPE: %.2f%%", results["3. PyTorch TabularNet"]["overall"]["mae"], results["3. PyTorch TabularNet"]["overall"]["wape_pct"])

    # Summary & Comparison
    logger.info("=" * 60)
    logger.info("HELD-OUT TEST SET EVALUATION BENCHMARK:")
    table_str = format_comparison_table(results)
    print("\n" + table_str + "\n")

    # Persist metrics summary
    with open(art_path / "metrics_summary.json", "w") as f:
        json.dump(results, f, indent=2)

    logger.info("All models trained and evaluated. Artifacts successfully written to %s", art_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train and Evaluate Cinema Demand Forecasters")
    parser.add_argument("--data-dir", default=r"C:\Users\Jagro\.gemini\antigravity\scratch\cinema_demand_forecasting\data\processed")
    parser.add_argument("--artifacts-dir", default=r"C:\Users\Jagro\.gemini\antigravity\scratch\cinema_demand_forecasting\artifacts")
    args = parser.parse_args()

    main(args.data_dir, args.artifacts_dir)
