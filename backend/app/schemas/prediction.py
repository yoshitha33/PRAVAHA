from datetime import date as DateType, datetime

from pydantic import BaseModel, ConfigDict, Field


class TrafficPredictionRequest(BaseModel):
    # Date is kept as a proper date so invalid dates fail fast at the API boundary.
    date: DateType = Field(..., alias="Date")
    area_name: str = Field(..., alias="Area Name")
    road_intersection_name: str = Field(..., alias="Road/Intersection Name")
    traffic_volume: float = Field(..., alias="Traffic Volume")
    average_speed: float = Field(..., alias="Average Speed")
    travel_time_index: float = Field(..., alias="Travel Time Index")
    road_capacity_utilization: float = Field(..., alias="Road Capacity Utilization")
    incident_reports: float = Field(..., alias="Incident Reports")
    environmental_impact: float = Field(..., alias="Environmental Impact")
    public_transport_usage: float = Field(..., alias="Public Transport Usage")
    traffic_signal_compliance: float = Field(..., alias="Traffic Signal Compliance")
    parking_usage: float = Field(..., alias="Parking Usage")
    pedestrian_and_cyclist_count: float = Field(..., alias="Pedestrian and Cyclist Count")
    weather_conditions: str = Field(..., alias="Weather Conditions")
    roadwork_and_construction_activity: str = Field(..., alias="Roadwork and Construction Activity")

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class TrafficPredictionResponse(BaseModel):
    congestion_class: str = Field(..., serialization_alias="congestionClass")
    confidence: float
    timestamp: datetime
    success: bool = True
