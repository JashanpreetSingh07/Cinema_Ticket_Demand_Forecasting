"""Pydantic schemas for cinema demand forecasting API."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ShowPredictionRequest(BaseModel):
    """Input payload for single screening demand forecast."""

    film_code: int = Field(..., description="Unique movie ID (e.g. 1492, 1553)", json_schema_extra={"example": 1492})
    cinema_code: int = Field(..., description="Unique cinema multiplex ID (e.g. 304)", json_schema_extra={"example": 304})
    capacity: int = Field(..., description="Screen auditorium seating capacity", ge=10, le=2500, json_schema_extra={"example": 250})
    show_time: int = Field(..., description="Daily show slot (e.g. 1=morning, 2=afternoon, 3=evening, 4=night)", ge=1, le=15, json_schema_extra={"example": 3})
    date: str = Field(..., description="Screening date in YYYY-MM-DD format", json_schema_extra={"example": "2026-11-20"})
    ticket_price: float = Field(..., description="Ticket price for the screening ($ USD or local currency)", ge=0.5, le=1000000.0, json_schema_extra={"example": 15.0})
    model_choice: str = Field(
        default="ensemble",
        description="Model to use: 'ensemble', 'lightgbm', 'torch', or 'baseline'",
        json_schema_extra={"example": "ensemble"},
    )
    screen_type: Optional[str] = Field(
        default="Standard 2D",
        description="Format: 'Standard 2D', 'IMAX Laser 3D', 'Dolby Cinema Atmos', 'VIP Recliner Suite'",
        json_schema_extra={"example": "Standard 2D"},
    )
    marketing_tier: Optional[str] = Field(
        default="Standard Run",
        description="Release stage: 'Standard Run', 'Opening Weekend Blitz', 'Special Fan Event', 'Matinee Promo'",
        json_schema_extra={"example": "Standard Run"},
    )
    weather_condition: Optional[str] = Field(
        default="Clear / Normal",
        description="Weather factor: 'Clear / Normal', 'Rainy / Bad Weather', 'Heatwave', 'Major Sports Rivalry'",
        json_schema_extra={"example": "Clear / Normal"},
    )


class MultiShowPlan(BaseModel):
    """Operational details for splitting high-demand screenings into multiple shows."""

    recommended_shows: int
    show_1_admitted: int
    show_2_admitted: int
    total_admitted: int
    turnaways_prevented: int
    incremental_revenue: float
    recommended_time_stagger: str


class ShowPredictionResponse(BaseModel):
    """Output prediction and decision-support recommendation."""

    unconstrained_demand: int = Field(..., description="True latent customer ticket demand (can exceed auditorium capacity)")
    admitted_tickets: int = Field(..., description="Physical tickets sold within screen seating capacity")
    predicted_tickets: int = Field(..., description="Alias for admitted tickets for backward compatibility")
    screen_capacity: int = Field(..., description="Auditorium seating capacity")
    spillover_demand: int = Field(..., description="Turned-away unsatisfied patron demand")
    occupancy_percentage: float = Field(..., description="Occupancy percentage of the primary screening")
    model_used: str
    is_cold_start: bool
    confidence_level: str
    prediction_interval: Dict[str, int]
    multi_show_recommended: bool
    multi_show_plan: Optional[MultiShowPlan] = None
    operational_action: str
    staffing_recommendation: str
    influential_factors: List[Dict[str, Any]]
    limitations_disclaimer: str

    # Advanced operational and business conclusions
    revenue_summary: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Gross box office, concession spend, and spillover opportunity cost",
    )
    concessions_plan: Optional[Dict[str, Any]] = Field(
        default=None,
        description="F&B batching directives (popcorn tubs, beverages, combo meals)",
    )
    labor_roster: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optimized floor staffing (ushers, concession registers, cleaning turnaround)",
    )
    strategic_conclusions: Optional[List[str]] = Field(
        default=None,
        description="High-value executive decision directives and actionable takeaways",
    )


class ScreenSwapRequest(BaseModel):
    """Payload to evaluate swapping screens between two concurrently scheduled films."""

    show_a: ShowPredictionRequest
    show_b: ShowPredictionRequest


class ScreenSwapResponse(BaseModel):
    """Screen reallocation analysis and net ticket recovery."""

    current_total_tickets: int
    swapped_total_tickets: int
    net_tickets_gained: int
    recommendation: str
    reasoning: str
    details: Dict[str, Any]


class BatchForecastRequest(BaseModel):
    """Batch prediction request for an entire multiplex schedule."""

    shows: List[ShowPredictionRequest]


class BatchForecastResponse(BaseModel):
    """Aggregated batch prediction response for entire daily screening roster."""

    total_shows: int
    total_unconstrained_demand: int
    total_admitted_tickets: int
    total_screen_capacity: int
    total_spillover_demand: int
    overall_occupancy_percentage: float
    total_projected_box_office: float
    total_projected_concessions: float
    total_gross_revenue: float
    multi_show_recommendations_count: int
    forecasts: List[ShowPredictionResponse]

