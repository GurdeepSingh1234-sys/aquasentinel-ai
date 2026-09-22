import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO

APP_ROOT = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("AQUASENTINEL_MODEL_PATH", str(APP_ROOT / "models" / "aquasentinel.pt")))
DEVICE = os.getenv("AQUASENTINEL_DEVICE", "").strip()
MODEL_CONF = float(os.getenv("AQUASENTINEL_CONFIDENCE", "0.25"))
MODEL_IOU = float(os.getenv("AQUASENTINEL_IOU", "0.70"))
MODEL_IMGSZ = int(os.getenv("AQUASENTINEL_IMGSZ", "640"))

app = FastAPI(title="AquaSentinel YOLO Inference Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: Optional[YOLO] = None


def get_model() -> YOLO:
    global _model

    if _model is not None:
        return _model

    if not MODEL_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail=(
                f"YOLO weights not found at '{MODEL_PATH}'. "
                "Set AQUASENTINEL_MODEL_PATH or place the model at inference/models/aquasentinel.pt."
            ),
        )

    try:
        _model = YOLO(str(MODEL_PATH))
        return _model
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to load YOLO model: {exc}") from exc


@app.get("/health")
def health():
    return {
        "service": "aquasentinel-yolo",
        "model_path": str(MODEL_PATH),
        "model_exists": MODEL_PATH.exists(),
        "loaded": _model is not None,
        "device": DEVICE or "auto",
    }


@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    conf: float = Form(MODEL_CONF),
    iou: float = Form(MODEL_IOU),
    imgsz: int = Form(MODEL_IMGSZ),
):
    model = get_model()

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="The uploaded file must be an image.")

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    try:
        pil_image = Image.open(__import__("io").BytesIO(raw)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to decode image: {exc}") from exc

    predict_kwargs = {
        "source": pil_image,
        "conf": max(0.01, min(0.99, conf)),
        "iou": max(0.01, min(0.99, iou)),
        "imgsz": max(128, imgsz),
        "verbose": False,
    }

    if DEVICE:
        predict_kwargs["device"] = DEVICE

    try:
        results = model.predict(**predict_kwargs)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YOLO inference failed: {exc}") from exc

    if not results:
        return {
            "image": {"width": pil_image.width, "height": pil_image.height},
            "model": str(MODEL_PATH.name),
            "detections": [],
        }

    result = results[0]
    detections = []
    names = result.names or {}

    if result.boxes is not None:
        xyxy = result.boxes.xyxy.cpu().tolist()
        confidences = result.boxes.conf.cpu().tolist()
        class_ids = result.boxes.cls.cpu().tolist()

        for coords, confidence, class_id in zip(xyxy, confidences, class_ids):
            x1, y1, x2, y2 = [float(value) for value in coords]
            class_index = int(class_id)
            class_name = str(names.get(class_index, class_index))

            detections.append(
                {
                    "classId": class_index,
                    "className": class_name,
                    "confidence": float(confidence),
                    "bbox": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                    },
                }
            )

    return {
        "image": {"width": pil_image.width, "height": pil_image.height},
        "model": str(MODEL_PATH.name),
        "confidenceThreshold": conf,
        "iouThreshold": iou,
        "detections": detections,
    }
