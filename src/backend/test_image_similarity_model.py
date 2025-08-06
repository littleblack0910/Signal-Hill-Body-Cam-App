#!/usr/bin/env python3
import os
import cv2
import numpy as np
import h5py
import matplotlib.pyplot as plt
import torch
import torchvision.transforms as transforms
import torchvision.models as models

# Default model name for import usage
MODEL_NAME = 'efficientnet_b4'

# Parameters
CAR_VIDEO_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '../../data/raw/car_check_videos'
)
PEDESTRIAN_VIDEO_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '../../data/raw/traffic_pedestrian_videos'
)
INPUT_SIZE = 320  # Higher-resolution input
FRAMES_PER_VIDEO = 400
MODEL_PATH_TEMPLATE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    'image_similarity_model_{model}.h5'
)

# Create output folder for saving graphs.
RESULTS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    'image_similarity_results'
)
os.makedirs(RESULTS_DIR, exist_ok=True)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


def _build_model(model_name: str):
    """Constructs and returns a feature-extractor model."""
    if model_name.lower() == 'resnet50':
        model = models.resnet50(pretrained=True)
        model.fc = torch.nn.Identity()
    elif model_name.lower() == 'resnet101':
        model = models.resnet101(pretrained=True)
        model.fc = torch.nn.Identity()
    elif model_name.startswith('efficientnet_b'):
        print("HERE")
        variant = model_name.split('_', 1)[1].upper()
        weights_enum = getattr(models, f'EfficientNet_{variant}_Weights').DEFAULT
        eff_fn = getattr(models, model_name)
        model = eff_fn(weights=weights_enum)
        model.classifier = torch.nn.Identity()
    else:
        raise ValueError(f"Unsupported model: {model_name}")
    model = model.to(device).eval()
    return model

# Initialize global model and transform using default
model = _build_model(MODEL_NAME)
MODEL_PATH = MODEL_PATH_TEMPLATE.format(model=MODEL_NAME)

transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize(INPUT_SIZE),
    transforms.CenterCrop(INPUT_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def list_videos(video_dir: str):
    """List all .mp4 files in the given directory."""
    video_files = []
    for item in os.listdir(video_dir):
        item_path = os.path.join(video_dir, item)
        if os.path.isfile(item_path) and item.lower().endswith('.mp4'):
            video_files.append(item_path)
    return video_files


def extract_frames(video_path: str, num_frames: int = FRAMES_PER_VIDEO):
    """Extract evenly spaced frames from the given video."""
    frames = []
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video: {video_path}")
        return frames
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        total_frames = num_frames
    indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame)
    cap.release()
    return frames


def extract_frame_embedding(frame: np.ndarray):
    """Extract deep feature embedding for a single frame."""
    img_tensor = transform(frame).unsqueeze(0).to(device)
    with torch.no_grad():
        embedding = model(img_tensor)
    return embedding.cpu().numpy().flatten()


def extract_video_feature(video_path: str):
    """Extract video-level feature by averaging frame embeddings."""
    frames = extract_frames(video_path)
    if not frames:
        return None
    embeddings = [extract_frame_embedding(f) for f in frames]
    return np.mean(np.array(embeddings), axis=0)


def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / (norm1 * norm2))


def compute_similarity_scores(video_paths: list[str], model_vector: np.ndarray):
    """Compute similarity scores for each video relative to the model vector."""
    video_names = []
    similarity_scores = []
    for video_path in video_paths:
        print(f"Processing test video: {video_path} ...")
        feature = extract_video_feature(video_path)
        if feature is not None:
            similarity = cosine_similarity(feature, model_vector)
            video_names.append(os.path.basename(video_path))
            similarity_scores.append(similarity)
        else:
            print(f"Skipping {video_path}: feature extraction failed.")
    return video_names, similarity_scores


def truncate_title(title: str) -> str:
    """Truncate the video title at the second underscore."""
    parts = title.split('_')
    return '_'.join(parts[:2]) if len(parts) >= 2 else title


def print_analytics(label: str, scores: list[float]):
    """Print basic analytics for similarity scores."""
    arr = np.array(scores)
    print(f"\n{label} Analytics:")
    print(f"Mean: {arr.mean():.4f}")
    print(f"Median: {np.median(arr):.4f}")
    print(f"Lower Quartile: {np.percentile(arr,25):.4f}")
    print(f"Upper Quartile: {np.percentile(arr,75):.4f}")
    print(f"Min: {arr.min():.4f}")
    print(f"Max: {arr.max():.4f}")


def combined_plot_and_analytics(
    car_names: list[str], car_scores: list[float],
    ped_names: list[str], ped_scores: list[float],
    model_name: str
):
    """Plot similarity scores and save the figure."""
    print_analytics("Car Check Test Video Similarity Scores", car_scores)
    print_analytics("Traffic Pedestrian Video Similarity Scores", ped_scores)

    car_labels = [truncate_title(n) for n in car_names]
    ped_labels = [truncate_title(n) for n in ped_names]

    plt.figure(figsize=(12,6))
    x_car = range(len(car_scores))
    plt.plot(x_car, car_scores, marker='o', label='Car Check Test')
    for i, txt in enumerate(car_labels):
        plt.annotate(txt, (i, car_scores[i]), textcoords='offset points', xytext=(0,10), ha='center', rotation=45)

    x_ped = range(len(ped_scores))
    plt.plot(x_ped, ped_scores, marker='o', label='Traffic Pedestrian')
    for i, txt in enumerate(ped_labels):
        plt.annotate(txt, (i, ped_scores[i]), textcoords='offset points', xytext=(0,-15), ha='center', rotation=45)

    plt.title(f"Video Similarity Scores Comparison ({model_name})")
    plt.xlabel("Video Index")
    plt.ylabel("Cosine Similarity")
    plt.legend()
    plt.tight_layout()
    save_path = os.path.join(RESULTS_DIR, f"image_similarity_results_{model_name}.png")
    plt.savefig(save_path)
    print(f"Graph saved to {save_path}")


def main(model_name: str = MODEL_NAME):
    # Load prototype vector and training paths
    model_path = MODEL_PATH_TEMPLATE.format(model=model_name)
    with h5py.File(model_path, 'r') as f:
        model_vector = np.array(f['model_vector'])
        train_video_paths = np.array(f['train_video_paths'], dtype=str)

    car_videos = list_videos(CAR_VIDEO_DIR)
    train_set = set(os.path.abspath(p) for p in train_video_paths)
    car_test_videos = [v for v in car_videos if os.path.abspath(v) not in train_set]
    print(f"\nFound {len(car_test_videos)} car check test videos.")
    car_names, car_scores = compute_similarity_scores(car_test_videos, model_vector)

    ped_videos = list_videos(PEDESTRIAN_VIDEO_DIR)
    print(f"\nFound {len(ped_videos)} traffic pedestrian videos.")
    ped_names, ped_scores = compute_similarity_scores(ped_videos, model_vector)

    combined_plot_and_analytics(car_names, car_scores, ped_names, ped_scores, model_name)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Test Image Similarity Model")
    parser.add_argument(
        '--model', type=str, default=MODEL_NAME,
        help='Model architecture to use, e.g., resnet50, resnet101, efficientnet_b0, efficientnet_b1'
    )
    args = parser.parse_args()
    main(args.model)
