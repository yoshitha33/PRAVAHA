"""Traffic congestion prediction service.

This service loads the trained artifacts once during application startup and
reuses them for each prediction request.
"""

from __future__ import annotations

import json
import re
from datetime import date as DateType, datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from app.common.exceptions import PredictionInputError
from app.schemas.prediction import TrafficPredictionRequest, TrafficPredictionResponse


BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "traffic_model.pkl"
PREPROCESSOR_PATH = MODEL_DIR / "traffic_preprocessor.pkl"
METADATA_PATH = MODEL_DIR / "traffic_training_metadata.json"


def normalize_column_name(column_name: str) -> str:
    """Match incoming JSON keys to the normalized training column names."""

    cleaned = re.sub(r"[^0-9a-zA-Z]+", "_", column_name.strip().lower())
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned


class TrafficPredictionService:
    def __init__(self, model: Any, preprocessor: Any, metadata: dict[str, Any]) -> None:
        self.model = model
        self.preprocessor = preprocessor
        self.metadata = metadata
        self.feature_columns = metadata.get("feature_columns", [])
        self.classifier = self._resolve_classifier(model)

    @classmethod
    def load_from_disk(cls) -> "TrafficPredictionService":
        """Load all persisted artifacts once at startup."""

        model = joblib.load(MODEL_PATH)
        preprocessor = joblib.load(PREPROCESSOR_PATH)

        try:
            metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            raise RuntimeError(f"Missing training metadata file: {METADATA_PATH}") from exc

        return cls(model=model, preprocessor=preprocessor, metadata=metadata)

    @staticmethod
    def _resolve_classifier(model: Any) -> Any:
        """Extract the classifier from the saved pipeline or model object."""

        if hasattr(model, "named_steps") and "classifier" in model.named_steps:
            return model.named_steps["classifier"]
        return model

    def _build_feature_frame(self, payload: TrafficPredictionRequest) -> pd.DataFrame:
        """Convert validated JSON into the exact feature frame expected by training."""

        raw_values = payload.model_dump(by_alias=True)
        normalized_values: dict[str, Any] = {}

        # Normalize every incoming field name so both JSON aliases and internal names work.
        for key, value in raw_values.items():
            normalized_values[normalize_column_name(key)] = value

        # Derive calendar-based features from the supplied date.
        supplied_date = raw_values.get("Date")
        if not isinstance(supplied_date, DateType):
            raise PredictionInputError("The Date field must be a valid ISO date.")

        normalized_values["year"] = supplied_date.year
        normalized_values["month"] = supplied_date.month
        normalized_values["day"] = supplied_date.day
        normalized_values["weekday"] = supplied_date.weekday()
        normalized_values["dayofyear"] = supplied_date.timetuple().tm_yday
        normalized_values["is_weekend"] = int(supplied_date.weekday() in (5, 6))

        # Remove the raw date after feature engineering so the feature order matches training.
        normalized_values.pop("date", None)

        missing_features = [feature for feature in self.feature_columns if feature not in normalized_values]
        if missing_features:
            raise PredictionInputError(
                "Missing required prediction fields: " + ", ".join(missing_features)
            )

        feature_row = {feature: normalized_values[feature] for feature in self.feature_columns}
        return pd.DataFrame([feature_row])

    def predict(self, payload: TrafficPredictionRequest) -> TrafficPredictionResponse:
        """Validate the request, apply preprocessing, and return the predicted class."""

        try:
            feature_frame = self._build_feature_frame(payload)

            # Apply the saved preprocessing pipeline before inference.
            transformed_features = self.preprocessor.transform(feature_frame)

            # Use the trained classifier for the final prediction and confidence score.
            predicted_label = self.classifier.predict(transformed_features)[0]
            probabilities = self.classifier.predict_proba(transformed_features)[0]
            confidence = float(max(probabilities))

            label_map = {
                "low": "Low",
                "medium": "Medium",
                "high": "High",
            }
            predicted_class = label_map.get(str(predicted_label).lower(), str(predicted_label).title())

            return TrafficPredictionResponse(
                congestion_class=predicted_class,
                confidence=confidence,
                timestamp=datetime.now(timezone.utc),
                success=True,
            )
        except PredictionInputError:
            raise
        except Exception as exc:
            raise PredictionInputError(f"Unable to generate a prediction: {exc}") from exc
