import time
import sys, glob, os
import warnings
import torch

# Suppress all user warnings (deprecation, audio backend, etc.)
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

src_dir = os.path.dirname(__file__)
sys.path.insert(0, src_dir)

import argparse
import subprocess
import tempfile
import re

import h5py
import numpy as np

from test_image_similarity_model import extract_video_feature, cosine_similarity
from fast_whisper_transcriber import FasterWhisperTranscriber

# ————————————————————————————————————————————————————————————
# THRESHOLDS
#————————————————————————————————————————————————————————————
CAR_HIGH_THRESH = 0.73   # >= this → HIGH-confidence Car Check
CAR_MED_THRESH  = 0.72   # >= this → MEDIUM-confidence Car Check
CAR_LOW_THRESH  = 0.71   # >= this → LOW-confidence Car Check

TR_HIGH_THRESH = 0.95    # >= this → HIGH-confidence Traffic Stop
TR_LOW_THRESH  = 0.90    # >= this → MEDIUM-confidence Traffic Stop
#————————————————————————————————————————————————————————————

def load_image_similarity_prototype(h5_path):
    with h5py.File(h5_path, 'r') as f:
        return f['model_vector'][:]


def predict_traffic_from_transformer(model_path, transcript_text):
    tf = tempfile.NamedTemporaryFile(suffix='.txt', delete=False, mode='w', encoding='utf-8')
    tf.write(transcript_text)
    tf.close()

    cmd = ['python', 'src/text_transformer/evaluate.py', model_path, tf.name]
    print("Running:", cmd)
    print("Temp file exists? ", os.path.exists(tf.name), tf.name)
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT)
        print(out.decode())
    except subprocess.CalledProcessError as e:
        print("=== Transformer script failed, skipping transformer branch ===")
        print(e.output.decode())
        return 'other', 0.0
    os.unlink(tf.name)

    m = re.search(r'confidence = ([0-9.]+).+predicted as (\w+)', out.decode())

    if not m:
        return 'other', 0.0
    return m.group(2), float(m.group(1))


def classify_video(
    vid_path, img_proto,
    whisper_model_name, whisper_device, whisper_compute,
    transformer_ckpt
):
    basename = os.path.basename(vid_path)

    # 1) image-similarity score
    start_img = time.perf_counter()
    feat_img = extract_video_feature(vid_path)
    s_img    = cosine_similarity(feat_img, img_proto)
    time_img = time.perf_counter() - start_img
    print(f"[{basename}] Image-Similarity time: {time_img:.2f}s, score: {s_img:.3f}")

    # 2) transcript → traffic-stop prob
    start_whisper = time.perf_counter()
    transcriber = FasterWhisperTranscriber(
        model_name=whisper_model_name,
        device=whisper_device,
        compute_type=whisper_compute
    )
    result     = transcriber.transcribe_file(vid_path)
    text       = result['text']
    label_tr, conf_tr = predict_traffic_from_transformer(transformer_ckpt, text)
    time_whisper = time.perf_counter() - start_whisper
    print(f"[{basename}] Whisper time: {time_whisper:.2f}s, traffic label: {label_tr} ({conf_tr:.3f})")

    # 3) fusion logic
    s_car = s_img  # image similarity only
    is_traffic = (label_tr == 'traffic_pedestrian')

    if s_car < CAR_LOW_THRESH:
        if is_traffic:
            if conf_tr >= TR_HIGH_THRESH:
                return "Traffic Stop|Semi-Confident", conf_tr
            else:
                return "Traffic Stop|Unconfident", conf_tr
        else:
            return "Other/Unsure", None

    if is_traffic:
        if conf_tr >= TR_HIGH_THRESH:
            return "Traffic Stop|Semi-Confident", conf_tr
        else:
            return "Traffic Stop|Unconfident", conf_tr

    if s_car >= CAR_HIGH_THRESH:
        return "Car Check|Confident", s_car
    elif s_car >= CAR_MED_THRESH:
        return "Car Check|Semi-confident", s_car
    elif s_car >= CAR_LOW_THRESH:
        return "Car Check|Unconfident", s_car
    else:
        return "Other/Unsure", s_car


def main():
    parser = argparse.ArgumentParser()
    base_dir = os.path.dirname(__file__)
    parser.add_argument('videos', nargs='+', help='Paths to .mp4 files or directories containing them')
    parser.add_argument('--imgsim-h5', default=os.path.join(base_dir, 'image_similarity_model_efficientnet_b4.h5'))
    parser.add_argument('--transformer-ckpt', default=os.path.join(base_dir, 'text_model_v1.pth'))
    parser.add_argument('--whisper-model', default='large-v3')
    parser.add_argument('--whisper-device', default='cpu')
    parser.add_argument('--whisper-compute', default='int8')

    args = parser.parse_args()

    all_vids = []
    for pth in args.videos:
        if os.path.isdir(pth):
            all_vids += glob.glob(os.path.join(pth, '*.mp4'))
        else:
            all_vids.append(pth)
    args.videos = sorted(all_vids)

    img_proto = load_image_similarity_prototype(args.imgsim_h5)

    for vid in args.videos:
        try:
            label, score = classify_video(
                vid, img_proto,
                args.whisper_model, args.whisper_device, args.whisper_compute,
                args.transformer_ckpt
            )
            if score is None:
                print(f"{os.path.basename(vid)} → {label}, score=N/A")
            else:
                print(f"{os.path.basename(vid)} → {label}, score={score:.3f}")

        except Exception as e:
            print(f"[{os.path.basename(vid)}] ERROR, skipping: {e}")
            continue


if __name__ == '__main__':
    main()
