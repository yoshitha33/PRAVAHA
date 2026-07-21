"""Train Machine Learning model for Bangalore Cricket Match Traffic Peak Hours.

Dataset: Bangalore_Cricket_Match_Traffic_Dataset.csv
Target: Congestion Level (Medium / High / Severe) & Road DNA Score
"""

import json
from pathlib import Path
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "data" / "traffic" / "Bangalore_Cricket_Match_Traffic_Dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "cricket_match_model.pkl"
PREPROCESSOR_PATH = MODEL_DIR / "cricket_match_preprocessor.pkl"
METADATA_PATH = MODEL_DIR / "cricket_match_metadata.json"


def train_cricket_match_model() -> None:
    print(f"=== Loading Cricket Match Traffic Dataset from {DATASET_PATH} ===")
    df = pd.read_csv(DATASET_PATH)

    print(f"Dataset shape: {df.shape}")
    print("Class distribution:")
    print(df["Congestion Level"].value_counts())

    # Features selection
    feature_cols = [
        "Time_Hour",
        "Month",
        "Road/Intersection Name",
        "Spectator_Count",
        "Traffic Volume",
        "Average Speed",
        "Travel Time Index",
        "Road Capacity Utilization",
        "Weather Conditions",
    ]

    X = df[feature_cols]
    y = df["Congestion Level"]

    categorical_cols = ["Road/Intersection Name", "Weather Conditions"]
    numeric_cols = [c for c in feature_cols if c not in categorical_cols]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", numeric_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
        ]
    )

    clf = RandomForestClassifier(n_estimators=100, random_state=42)

    model_pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\nTraining Random Forest Classifier for Cricket Match Peak Hours...")
    model_pipeline.fit(X_train, y_train)

    y_pred = model_pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Persist artifacts
    joblib.dump(model_pipeline, MODEL_PATH)
    
    metadata = {
        "feature_columns": feature_cols,
        "categorical_columns": categorical_cols,
        "accuracy": float(accuracy),
        "target_classes": list(clf.classes_),
    }

    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"\nSaved model artifacts to {MODEL_PATH} and {METADATA_PATH}")


if __name__ == "__main__":
    train_cricket_match_model()
