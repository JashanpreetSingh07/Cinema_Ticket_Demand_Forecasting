"""PyTorch Deep Tabular Neural Network with Entity Embeddings and Sigmoid Capacity Scaling."""

from __future__ import annotations

import logging
import pickle
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class TabularShowDataset(Dataset):
    """PyTorch Dataset for cinema screenings."""

    def __init__(
        self,
        cats: np.ndarray,
        conts: np.ndarray,
        capacities: np.ndarray,
        targets: Optional[np.ndarray] = None,
    ) -> None:
        self.cats = torch.tensor(cats, dtype=torch.long)
        self.conts = torch.tensor(conts, dtype=torch.float32)
        self.capacities = torch.tensor(capacities, dtype=torch.float32).unsqueeze(1)
        self.targets = torch.tensor(targets, dtype=torch.float32).unsqueeze(1) if targets is not None else None

    def __len__(self) -> int:
        return len(self.cats)

    def __getitem__(self, idx: int):
        if self.targets is not None:
            return self.cats[idx], self.conts[idx], self.capacities[idx], self.targets[idx]
        return self.cats[idx], self.conts[idx], self.capacities[idx]


class CinemaTabularNet(nn.Module):
    """Deep Tabular Network with Entity Embeddings and Physical Capacity Scaling.

    Prediction formula:
        y_pred = capacity * Sigmoid(MLP(embeddings, continuous_features))
    Guarantees mathematically that outputs stay within [0, capacity].
    """

    def __init__(
        self,
        emb_dims: List[Tuple[int, int]],
        num_continuous: int,
        hidden_dims: List[int] = [128, 64],
        dropout: float = 0.2,
    ) -> None:
        super().__init__()
        # Entity embeddings for high-cardinality categoricals
        self.embeddings = nn.ModuleList([nn.Embedding(num_classes, emb_dim) for num_classes, emb_dim in emb_dims])
        total_emb_dim = sum(emb_dim for _, emb_dim in emb_dims)

        in_dim = total_emb_dim + num_continuous

        layers = []
        curr_dim = in_dim
        for h_dim in hidden_dims:
            layers.append(nn.Linear(curr_dim, h_dim))
            layers.append(nn.BatchNorm1d(h_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout))
            curr_dim = h_dim

        layers.append(nn.Linear(curr_dim, 1))
        layers.append(nn.Sigmoid())  # Maps to [0.0, 1.0] occupancy space

        self.network = nn.Sequential(*layers)

    def forward(self, cats: torch.Tensor, conts: torch.Tensor, capacities: torch.Tensor) -> torch.Tensor:
        emb_outs = [emb(cats[:, i]) for i, emb in enumerate(self.embeddings)]
        x_emb = torch.cat(emb_outs, dim=1)
        x = torch.cat([x_emb, conts], dim=1)
        occupancy = self.network(x)
        # Scale occupancy rate by auditorium capacity to get tickets sold
        tickets = occupancy * capacities
        return tickets


class TorchTabularForecaster:
    """End-to-end wrapper for training and inference with PyTorch CinemaTabularNet."""

    def __init__(
        self,
        batch_size: int = 512,
        lr: float = 1e-3,
        epochs: int = 25,
        patience: int = 5,
        device: Optional[str] = None,
    ) -> None:
        self.batch_size = batch_size
        self.lr = lr
        self.epochs = epochs
        self.patience = patience
        self.device = torch.device(device if device else ("cuda" if torch.cuda.is_available() else "cpu"))

        self.model: Optional[CinemaTabularNet] = None
        self.scaler = StandardScaler()
        self.cat_maps: Dict[str, Dict[int, int]] = {}
        self.cat_cols: List[str] = []
        self.cont_cols: List[str] = []
        self.emb_dims: List[Tuple[int, int]] = []

    def _prepare_data(
        self, df: pd.DataFrame, is_train: bool = False
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Optional[np.ndarray]]:
        """Encode categoricals, scale continuous variables, and extract capacities and targets."""
        df = df.copy()

        # Categoricals
        cat_arrays = []
        for c in self.cat_cols:
            if is_train:
                unique_vals = sorted(df[c].dropna().unique())
                # Reserve 0 for unseen/unknown categories
                val_to_idx = {val: idx + 1 for idx, val in enumerate(unique_vals)}
                self.cat_maps[c] = val_to_idx

            mapping = self.cat_maps[c]
            encoded = df[c].map(mapping).fillna(0).astype(int).values
            cat_arrays.append(encoded)

        cats = np.column_stack(cat_arrays)

        # Continuous
        if is_train:
            conts = self.scaler.fit_transform(df[self.cont_cols].fillna(0.0).values)
        else:
            conts = self.scaler.transform(df[self.cont_cols].fillna(0.0).values)

        capacities = df["capacity"].values.astype(float)
        targets = df["tickets_sold"].values.astype(float) if "tickets_sold" in df.columns else None

        return cats, conts, capacities, targets

    def fit(
        self,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        cat_cols: List[str],
        cont_cols: List[str],
    ) -> TorchTabularForecaster:
        """Fit entity embedding neural network with early stopping."""
        self.cat_cols = cat_cols
        self.cont_cols = cont_cols

        cats_train, conts_train, caps_train, targets_train = self._prepare_data(train_df, is_train=True)
        cats_val, conts_val, caps_val, targets_val = self._prepare_data(val_df, is_train=False)

        # Configure embedding dimensions (rule of thumb: min(50, (num_classes + 1) // 2))
        self.emb_dims = []
        for c in self.cat_cols:
            num_classes = len(self.cat_maps[c]) + 2  # +2 for unknown and 0 index
            emb_dim = max(4, min(32, (num_classes + 1) // 2))
            self.emb_dims.append((num_classes, emb_dim))

        self.model = CinemaTabularNet(
            emb_dims=self.emb_dims,
            num_continuous=len(self.cont_cols),
            hidden_dims=[128, 64],
            dropout=0.15,
        ).to(self.device)

        train_ds = TabularShowDataset(cats_train, conts_train, caps_train, targets_train)
        val_ds = TabularShowDataset(cats_val, conts_val, caps_val, targets_val)

        train_loader = DataLoader(train_ds, batch_size=self.batch_size, shuffle=True)
        val_loader = DataLoader(val_ds, batch_size=self.batch_size, shuffle=False)

        optimizer = torch.optim.AdamW(self.model.parameters(), lr=self.lr, weight_decay=1e-4)
        criterion = nn.L1Loss()  # Direct MAE optimization
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=2)

        best_val_loss = float("inf")
        best_state = None
        no_improve = 0

        logger.info(
            "Training PyTorch TabularNet on %s (%d train, %d val samples, %d epochs)...",
            self.device,
            len(train_df),
            len(val_df),
            self.epochs,
        )

        for epoch in range(1, self.epochs + 1):
            self.model.train()
            train_loss_total = 0.0

            for cats, conts, caps, tgts in train_loader:
                cats, conts, caps, tgts = (
                    cats.to(self.device),
                    conts.to(self.device),
                    caps.to(self.device),
                    tgts.to(self.device),
                )
                optimizer.zero_grad()
                preds = self.model(cats, conts, caps)
                loss = criterion(preds, tgts)
                loss.backward()
                optimizer.step()
                train_loss_total += loss.item() * len(cats)

            train_loss = train_loss_total / len(train_df)

            # Validation
            self.model.eval()
            val_loss_total = 0.0
            with torch.no_grad():
                for cats, conts, caps, tgts in val_loader:
                    cats, conts, caps, tgts = (
                        cats.to(self.device),
                        conts.to(self.device),
                        caps.to(self.device),
                        tgts.to(self.device),
                    )
                    preds = self.model(cats, conts, caps)
                    loss = criterion(preds, tgts)
                    val_loss_total += loss.item() * len(cats)

            val_loss = val_loss_total / len(val_df)
            scheduler.step(val_loss)

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                best_state = {k: v.cpu() for k, v in self.model.state_dict().items()}
                no_improve = 0
            else:
                no_improve += 1

            if epoch % 5 == 0 or epoch == self.epochs or no_improve == 0:
                logger.info("Epoch %02d/%02d | Train Loss: %.2f | Val Loss: %.2f | Best: %.2f", epoch, self.epochs, train_loss, val_loss, best_val_loss)

            if no_improve >= self.patience:
                logger.info("Early stopping triggered at epoch %d", epoch)
                break

        if best_state is not None:
            self.model.load_state_dict(best_state)
            self.model.to(self.device)

        return self

    def predict_unconstrained(self, df: pd.DataFrame) -> np.ndarray:
        """Predict latent customer demand without auditorium ceiling."""
        if self.model is None:
            raise RuntimeError("Model is not fitted yet!")

        self.model.eval()
        cats, conts, caps, _ = self._prepare_data(df, is_train=False)
        ds = TabularShowDataset(cats, conts, caps)
        loader = DataLoader(ds, batch_size=self.batch_size, shuffle=False)

        all_preds = []
        with torch.no_grad():
            for c_b, n_b, cap_b in loader:
                c_b, n_b, cap_b = c_b.to(self.device), n_b.to(self.device), cap_b.to(self.device)
                preds = self.model(c_b, n_b, cap_b)
                all_preds.extend(preds.cpu().squeeze(1).numpy())

        preds_arr = np.array(all_preds)
        return np.maximum(0, np.round(preds_arr)).astype(int)

    def predict(self, df: pd.DataFrame, return_unconstrained: bool = False) -> np.ndarray | Tuple[np.ndarray, np.ndarray]:
        """Predict ticket sales and clamp strictly to [0, capacity]."""
        unconstrained = self.predict_unconstrained(df)
        clamped = np.clip(unconstrained, 0, df["capacity"].values).astype(int)
        if return_unconstrained:
            return clamped, unconstrained
        return clamped

    def save(self, path: Path | str) -> None:
        with open(path, "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, path: Path | str) -> TorchTabularForecaster:
        with open(path, "rb") as f:
            return pickle.load(f)
