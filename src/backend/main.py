# backend/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import os
import sys

# Ensure src/backend is in path
sys.path.append(os.path.dirname(__file__))

# Import both implementations
import ensemble_model
try:
    import ensemble_model_full
    IMAGEBIND_AVAILABLE = True
except ImportError:
    print("ImageBind not available, using basic ensemble only")
    IMAGEBIND_AVAILABLE = False

app = FastAPI()

class PredictRequest(BaseModel):
    filepath: str
    use_imagebind: bool = False  # default off

# Load shared prototypes once
base_dir = os.path.dirname(__file__)
img_proto = ensemble_model.load_image_similarity_prototype(
    os.path.join(base_dir, 'image_similarity_model_efficientnet_b4.h5')
)
if IMAGEBIND_AVAILABLE:
    ib_proto = ensemble_model_full.load_imagebind_prototype(
        os.path.join(base_dir, 'imagebind_similarity_model.h5')
    )
else:
    ib_proto = None

# Endpoint with toggle support
@app.post("/predict")
def predict(req: PredictRequest):
    if req.use_imagebind and IMAGEBIND_AVAILABLE:
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
        if req.use_imagebind and not IMAGEBIND_AVAILABLE:
            print("ImageBind requested but not available, using basic ensemble")
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
