# backend/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import os
import sys

# Ensure src/backend is in path
sys.path.append(os.path.dirname(__file__))

# Import both implementations
import ensemble_model
import ensemble_model_full

app = FastAPI()

class PredictRequest(BaseModel):
    filepath: str
    use_imagebind: bool = False  # default off

# Load shared prototypes once
base_dir = os.path.dirname(__file__)
img_proto = ensemble_model.load_image_similarity_prototype(
    os.path.join(base_dir, 'image_similarity_model_efficientnet_b4.h5')
)
ib_proto = ensemble_model_full.load_imagebind_prototype(
    os.path.join(base_dir, 'imagebind_similarity_model.h5')
)

# Endpoint with toggle support
@app.post("/predict")
def predict(req: PredictRequest):
    if req.use_imagebind:
        result = ensemble_model_full.classify_video(
            req.filepath,
            img_proto,
            ib_proto,
            whisper_model_name='large-v3',
            whisper_device='cpu',
            whisper_compute='int8',
            transformer_ckpt=os.path.join(base_dir, 'text_model_v1.pth')
        )
    else:
        result = ensemble_model.classify_video(
            req.filepath,
            img_proto,
            whisper_model_name='large-v3',
            whisper_device='cpu',
            whisper_compute='int8',
            transformer_ckpt=os.path.join(base_dir, 'text_model_v1.pth')
        )
    label, score = result
    return {"prediction": label, "score": score}
