"""Train a Random Forest classifier for Bangalore traffic congestion prediction.

The script is intentionally self-contained so it can:
- inspect the dataset schema,
- clean the data,
- create date-based features,
- encode categorical columns,
- derive a classification target from the congestion score,
- train and evaluate a Random Forest classifier,
- and persist the trained pipeline with joblib.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET = BASE_DIR / "data" / "traffic" / "Banglore_traffic_Dataset.csv"
ALT_DATASET = BASE_DIR / "data" / "traffic" / "Bangalore_traffic_Dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "traffic_model.pkl"
PREPROCESSOR_PATH = MODEL_DIR / "traffic_preprocessor.pkl"
METADATA_PATH = MODEL_DIR / "traffic_training_metadata.json"

TARGET_COLUMN = "Congestion Level"
DATE_COLUMN = "Date"
RANDOM_STATE = 42


def resolve_dataset_path() -> Path:
    """Return the dataset path without assuming the exact spelling."""

    if DEFAULT_DATASET.exists():
        return DEFAULT_DATASET
    if ALT_DATASET.exists():
        return ALT_DATASET
    raise FileNotFoundError(
        "Could not find the traffic dataset. Expected one of: "
        f"{DEFAULT_DATASET} or {ALT_DATASET}"
    )


def normalize_column_name(column_name: str) -> str:
    """Convert raw column names into safe snake_case names for modeling."""

    cleaned = re.sub(r"[^0-9a-zA-Z]+", "_", column_name.strip().lower())
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned


def inspect_dataset(df: pd.DataFrame) -> None:
    """Print the dataset inspection required by the task."""

    print("\n=== DATASET INSPECTION ===")
    print(f"Shape: {df.shape}")
    print("Columns:")
    for column in df.columns:
        print(f"- {column}")

    print("\nFirst 10 rows:")
    print(df.head(10).to_string(index=False))

    print("\nDataset summary:")
    print(df.describe(include="all").transpose().to_string())

    print("\nMissing values:")
    print(df.isna().sum().to_string())


def clean_and_engineer_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, dict[str, object]]:
    """Clean missing values and create useful date features.

    The target column is the raw congestion score. Because this target is
    continuous, we derive a 3-class label for the requested classifier:
    low, medium, and high congestion.
    """

    working_df = df.copy()
    working_df.columns = [normalize_column_name(column) for column in working_df.columns]

    target_column = normalize_column_name(TARGET_COLUMN)
    date_column = normalize_column_name(DATE_COLUMN)

    if target_column not in working_df.columns:
        available_columns = working_df.columns.tolist()
        raise ValueError(
            f"Target column '{TARGET_COLUMN}' was not found after normalization. "
            f"Available columns: {available_columns}"
        )

    if date_column in working_df.columns:
        # Parse the date column and add calendar-based features.
        parsed_dates = pd.to_datetime(working_df[date_column], errors="coerce")
        working_df["year"] = parsed_dates.dt.year
        working_df["month"] = parsed_dates.dt.month
        working_df["day"] = parsed_dates.dt.day
        working_df["weekday"] = parsed_dates.dt.dayofweek
        working_df["dayofyear"] = parsed_dates.dt.dayofyear
        working_df["is_weekend"] = parsed_dates.dt.dayofweek.isin([5, 6]).astype(int)

        # Hour is only useful when the source has a time component.
        has_time_component = parsed_dates.dt.hour.ne(0).any() or parsed_dates.dt.minute.ne(0).any()
        if has_time_component:
            working_df["hour"] = parsed_dates.dt.hour

        working_df = working_df.drop(columns=[date_column])

    # Remove duplicate rows to keep the training signal clean.
    working_df = working_df.drop_duplicates().reset_index(drop=True)

    # Separate the raw numeric congestion score from the modeling features.
    y_raw = working_df[target_column].copy()
    feature_frame = working_df.drop(columns=[target_column])

    # Fill missing values in a generic, data-type-aware way.
    numeric_columns = feature_frame.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical_columns = feature_frame.select_dtypes(include=["object", "category"]).columns.tolist()

    for column in numeric_columns:
        feature_frame[column] = pd.to_numeric(feature_frame[column], errors="coerce")
    for column in categorical_columns:
        feature_frame[column] = feature_frame[column].astype(str).replace({"nan": pd.NA, "None": pd.NA})

    # Build a 3-class target from the continuous congestion score.
    # This keeps the task aligned with the requested classifier and evaluation metrics.
    try:
        y_class, bin_edges = pd.qcut(
            y_raw,
            q=3,
            labels=["low", "medium", "high"],
            retbins=True,
            duplicates="drop",
        )
        if len(bin_edges) - 1 != 3:
            raise ValueError("qcut did not produce 3 classes")
        target_strategy = "quantile_bins"
    except Exception:
        y_class, bin_edges = pd.cut(
            y_raw,
            bins=3,
            labels=["low", "medium", "high"],
            retbins=True,
            include_lowest=True,
        )
        target_strategy = "equal_width_bins"

    y_class = y_class.astype(str)

    metadata = {
        "raw_target_column": TARGET_COLUMN,
        "normalized_target_column": target_column,
        "date_column": DATE_COLUMN,
        "normalized_date_column": date_column,
        "target_strategy": target_strategy,
        "target_bin_edges": [float(edge) for edge in bin_edges],
        "feature_columns": feature_frame.columns.tolist(),
        "numeric_features": numeric_columns,
        "categorical_features": categorical_columns,
        "row_count_after_cleaning": int(feature_frame.shape[0]),
    }

    return feature_frame, y_class, metadata


def build_preprocessor(feature_frame: pd.DataFrame) -> ColumnTransformer:
    """Create a reusable preprocessing pipeline for numeric and categorical data."""

    numeric_features = feature_frame.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical_features = feature_frame.select_dtypes(include=["object", "category"]).columns.tolist()

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("numeric", numeric_transformer, numeric_features),
            ("categorical", categorical_transformer, categorical_features),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def train_and_evaluate(feature_frame: pd.DataFrame, y_class: pd.Series, metadata: dict[str, object]) -> None:
    """Split the data, train the classifier, evaluate it, and save artifacts."""

    X_train, X_test, y_train, y_test = train_test_split(
        feature_frame,
        y_class,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=y_class,
    )

    preprocessor = build_preprocessor(feature_frame)

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=300,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                    class_weight="balanced",
                ),
            ),
        ]
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    matrix = confusion_matrix(y_test, y_pred, labels=["low", "medium", "high"])
    report = classification_report(y_test, y_pred, zero_division=0)

    print("\n=== MODEL EVALUATION ===")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("\nConfusion Matrix:")
    print(matrix)
    print("\nClassification Report:")
    print(report)

    # Save the entire trained pipeline so preprocessing and the classifier travel together.
    joblib.dump(model, MODEL_PATH)

    # Save the fitted preprocessor separately because the task explicitly requests preprocessing artifacts.
    joblib.dump(preprocessor.fit(feature_frame), PREPROCESSOR_PATH)

    metadata.update(
        {
            "metrics": {
                "accuracy": float(accuracy),
                "precision_weighted": float(precision),
                "recall_weighted": float(recall),
                "f1_weighted": float(f1),
            },
            "classification_report": report,
            "confusion_matrix": matrix.tolist(),
            "train_rows": int(X_train.shape[0]),
            "test_rows": int(X_test.shape[0]),
        }
    )

    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"\nSaved model to: {MODEL_PATH}")
    print(f"Saved preprocessor to: {PREPROCESSOR_PATH}")
    print(f"Saved metadata to: {METADATA_PATH}")


def main() -> None:
    """Entry point for the training pipeline."""

    dataset_path = resolve_dataset_path()
    df = pd.read_csv(dataset_path)

    # Step 1 and 2: inspect the dataset before doing any transformation.
    inspect_dataset(df)

    # Step 3, 4, 5, and 6: clean the data, encode categorical fields, and create date features.
    feature_frame, y_class, metadata = clean_and_engineer_features(df)

    print("\n=== FEATURE PREVIEW AFTER CLEANING ===")
    print(feature_frame.head(10).to_string(index=False))
    print("\nTarget class distribution:")
    print(y_class.value_counts().to_string())

    # Step 8 through 12: train, evaluate, and save the model and preprocessing artifacts.
    train_and_evaluate(feature_frame, y_class, metadata)


if __name__ == "__main__":
    main()
