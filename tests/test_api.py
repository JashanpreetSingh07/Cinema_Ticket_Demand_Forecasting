"""Integration tests for FastAPI inference endpoints."""

import pytest
from fastapi.testclient import TestClient

from src.api.app import app, load_artifacts


@pytest.fixture(scope="module")
def client():
    load_artifacts()
    with TestClient(app) as c:
        yield c


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "interactive_docs" in data


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ensemble" in data["loaded_models"]
    assert "lightgbm" in data["loaded_models"]
    assert "torch" in data["loaded_models"]
    assert "baseline" in data["loaded_models"]


def test_predict_endpoint_ensemble(client):
    payload = {
        "film_code": 1492,
        "cinema_code": 304,
        "capacity": 250,
        "show_time": 3,
        "date": "2026-11-20",
        "ticket_price": 18.0,
        "model_choice": "ensemble",
        "screen_type": "IMAX Laser 3D",
        "marketing_tier": "Opening Weekend Blitz",
        "weather_condition": "Rainy / Bad Weather",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["admitted_tickets"] <= 250
    assert data["unconstrained_demand"] >= 0
    assert data["model_used"] == "ensemble"
    assert "revenue_summary" in data and data["revenue_summary"] is not None
    assert "concessions_plan" in data and data["concessions_plan"] is not None
    assert "labor_roster" in data and data["labor_roster"] is not None
    assert "strategic_conclusions" in data and len(data["strategic_conclusions"]) > 0


def test_predict_endpoint_lightgbm(client):
    payload = {
        "film_code": 1492,
        "cinema_code": 304,
        "capacity": 250,
        "show_time": 3,
        "date": "2018-10-15",
        "ticket_price": 140000.0,
        "model_choice": "lightgbm",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["admitted_tickets"] <= 250
    assert data["unconstrained_demand"] >= 0
    assert data["spillover_demand"] >= 0
    assert 0.0 <= data["occupancy_percentage"] <= 100.0
    assert data["model_used"] == "lightgbm"
    assert "operational_action" in data
    assert "staffing_recommendation" in data
    assert "limitations_disclaimer" in data


def test_unconstrained_demand_and_multi_show(client):
    # Small capacity auditorium with high demand should trigger multi-show recommendation
    payload = {
        "film_code": 1492,
        "cinema_code": 304,
        "capacity": 30,  # Tiny capacity
        "show_time": 3,
        "date": "2018-10-15",
        "ticket_price": 140000.0,
        "model_choice": "lightgbm",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["unconstrained_demand"] >= data["admitted_tickets"]
    assert data["admitted_tickets"] <= 30
    # Multi-show recommended when customer demand exceeds small hall
    if data["unconstrained_demand"] > 30:
        assert data["spillover_demand"] > 0
        if data["multi_show_recommended"]:
            assert data["multi_show_plan"] is not None
            assert data["multi_show_plan"]["recommended_shows"] >= 2
            assert data["multi_show_plan"]["incremental_revenue"] > 0


def test_predict_endpoint_torch(client):
    payload = {
        "film_code": 1492,
        "cinema_code": 304,
        "capacity": 180,
        "show_time": 2,
        "date": "2018-10-15",
        "ticket_price": 140000.0,
        "model_choice": "torch",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["admitted_tickets"] <= 180
    assert data["model_used"] == "torch"


def test_predict_invalid_model(client):
    payload = {
        "film_code": 1492,
        "cinema_code": 304,
        "capacity": 200,
        "show_time": 2,
        "date": "2018-10-15",
        "ticket_price": 140000.0,
        "model_choice": "non_existent_model",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 400


def test_reallocate_screens_endpoint(client):
    payload = {
        "show_a": {
            "film_code": 1492,
            "cinema_code": 304,
            "capacity": 80,
            "show_time": 3,
            "date": "2018-10-15",
            "ticket_price": 140000.0,
            "model_choice": "lightgbm",
        },
        "show_b": {
            "film_code": 1553,
            "cinema_code": 304,
            "capacity": 400,
            "show_time": 3,
            "date": "2018-10-15",
            "ticket_price": 140000.0,
            "model_choice": "lightgbm",
        },
    }
    response = client.post("/reallocate-screens", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "net_tickets_gained" in data
    assert "recommendation" in data
    assert "reasoning" in data


def test_batch_forecast_endpoint(client):
    payload = {
        "shows": [
            {
                "film_code": 1492,
                "cinema_code": 304,
                "capacity": 200,
                "show_time": 3,
                "date": "2024-11-22",
                "ticket_price": 18.0,
                "model_choice": "ensemble",
            },
            {
                "film_code": 1580,
                "cinema_code": 304,
                "capacity": 250,
                "show_time": 3,
                "date": "2024-11-22",
                "ticket_price": 17.0,
                "model_choice": "ensemble",
            },
        ]
    }
    response = client.post("/batch-forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_shows"] == 2
    assert data["total_screen_capacity"] == 450
    assert data["total_unconstrained_demand"] > 0
    assert data["total_gross_revenue"] > 0
    assert len(data["forecasts"]) == 2

