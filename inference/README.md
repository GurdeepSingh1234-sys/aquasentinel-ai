# AquaSentinel YOLO Inference Service

This small FastAPI service is the bridge between the Next.js AquaSentinel console and the actual YOLO model.

Ultralytics supports Python inference with a custom checkpoint using `YOLO("path/to/model.pt")` and `model.predict(...)`. citeturn776563search0turn776563search4

## 1. Put the model outside Git

Do not commit large model weights to GitHub.

Place the current model here locally:

```
inference/models/aquasentinel.pt
```

or set:

```
AQUASENTINEL_MODEL_PATH=C:\\path\\to\\your\\best.pt
```

## 2. Create the Python environment

From the repository root:

```powershell
cd inference
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Ultralytics documents installation with `pip install -U ultralytics`; PyTorch/CUDA requirements depend on the machine's CUDA setup. citeturn776563search1

## 3. Start the service

```powershell
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Check:

```
http://127.0.0.1:8000/health
```

A missing weight file produces a clear 503 error rather than silently using the old front-end simulator.

## 4. How the app uses it

The Next.js UI posts the selected sonar image to:

```
POST /api/inference
```

Next.js forwards the image to:

```
http://127.0.0.1:8000/predict
```

The Python service returns real YOLO bounding boxes and confidences.

The frontend then converts those boxes into AquaSentinel detections and persists them to Firestore for Detections, Map and AquaFusion.

## Important

The YOLO model itself does not inherently provide survey GPS coordinates or sonar depth. The current frontend therefore treats georeferencing/depth conversion as a prototype estimate derived from the selected survey tile metadata. Replace that step with your real navigation/sonar metadata when available.
