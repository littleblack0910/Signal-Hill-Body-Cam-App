#!/usr/bin/env python3
import os
import argparse
import cv2
import numpy as np
import torch
import torchvision.transforms as transforms
import h5py

from imagebind.models.imagebind_model import imagebind_huge, ModalityType

# Default checkpoint path
CHECKPOINT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.checkpoints')
CHECKPOINT_PATH = os.path.join(CHECKPOINT_DIR, 'imagebind_huge.pth')

# Device configuration
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Transformation for frames (match model's expected input)
FRAME_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

# Lazy-loaded model
_model = None

def _build_model():
    """Load and return the ImageBind model with checkpoint."""
    model = imagebind_huge(pretrained=False)
    state = torch.load(CHECKPOINT_PATH, map_location=DEVICE)
    model.load_state_dict(state)
    model.to(DEVICE)
    model.eval()
    return model


def extract_frames(video_path: str, num_frames: int = 400):
    """Extract evenly spaced frames from a video file."""
    frames = []
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video: {video_path}")
        return frames
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or num_frames
    indices = np.linspace(0, total - 1, num_frames, dtype=int)
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame)
    cap.release()
    return frames


def extract_video_embedding(frames: list[np.ndarray]):
    """Generate a video-level embedding by passing frames through ImageBind."""
    global _model
    if _model is None:
        _model = _build_model()

    # Prepare frame tensors
    tensors = []
    for f in frames:
        # PIL conversion for transform
        pil = transforms.ToPILImage()(f)
        t = FRAME_TRANSFORM(pil).unsqueeze(0)
        tensors.append(t)
    batch = torch.cat(tensors, dim=0).to(DEVICE)

    with torch.no_grad():
        # forward takes a dict mapping ModalityType to tensor
        out = _model({ModalityType.VISION: batch})[ModalityType.VISION]
    # Average across frames and return numpy
    return out.mean(dim=0).cpu().numpy()


def cosine_sim(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    v1 = vec1.flatten()
    v2 = vec2.flatten()
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))


def main():
    parser = argparse.ArgumentParser(description="Test ImageBind Similarity Model")
    parser.add_argument('--video', type=str, required=True,
                        help='Path to a .mp4 file to test')
    parser.add_argument('--prototype', type=str, required=True,
                        help='Path to .h5 prototype file')
    args = parser.parse_args()

    # Load prototype vector
    with h5py.File(args.prototype, 'r') as f:
        proto = np.array(f['precise_model_vector'])

    # Extract embedding for input video
    frames = extract_frames(args.video)
    emb = extract_video_embedding(frames)

    # Compute similarity
    sim = cosine_sim(emb, proto)
    print(f"Cosine similarity to prototype: {sim:.4f}")

if __name__ == '__main__':
    main()
