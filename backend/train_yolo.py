"""Fine-tune YOLOv8 Nano model on custom traffic dataset.

Usage:
    python train_yolo.py --epochs 25 --imgsz 640
"""

import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATASET_CONFIG = BASE_DIR / "data" / "traffic_yolo.yaml"


def train_yolo_model(epochs: int = 25, imgsz: int = 640) -> None:
    try:
        from ultralytics import YOLO

        print("=== Starting YOLOv8 Traffic Model Fine-Tuning ===")
        model = YOLO("yolov8n.pt")

        if not DATASET_CONFIG.exists():
            print(f"Dataset config {DATASET_CONFIG} not found. Creating template...")
            DATASET_CONFIG.parent.mkdir(parents=True, exist_ok=True)
            DATASET_CONFIG.write_text(
                """path: ./data/traffic
train: images/train
val: images/val

names:
  0: car
  1: bike
  2: bus
  3: truck
  4: auto_rickshaw
"""
            )

        print(f"Training on dataset config: {DATASET_CONFIG}")
        # Train model
        model.train(
            data=str(DATASET_CONFIG),
            epochs=epochs,
            imgsz=imgsz,
            project=str(BASE_DIR / "models"),
            name="yolo_traffic",
        )
        print("Training complete. Trained weights saved under backend/models/yolo_traffic/")

    except ImportError:
        print("Ultralytics package not found. Install via: pip install ultralytics")
    except Exception as exc:
        print(f"YOLO training notice: {exc}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train custom YOLOv8 model for traffic detection.")
    parser.add_argument("--epochs", type=int, default=25, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Image input size")
    args = parser.parse_args()

    train_yolo_model(epochs=args.epochs, imgsz=args.imgsz)
