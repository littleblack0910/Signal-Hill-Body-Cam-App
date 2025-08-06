import os
import glob
import argparse
from typing import Dict, List, Optional, Union
from faster_whisper import WhisperModel
from pathlib import Path
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

class FasterWhisperTranscriber:
	def __init__(
		self, 
		model_name="large-v3", 
		device="auto", 
		compute_type="default",
		min_speech_probability=0.2,
		no_speech_threshold=0.2,
		beam_size=5
	):
		"""
		Enhanced transcriber using Faster Whisper implementation
		
		Args:
			model_name: Whisper model to use
			device: "cpu", "cuda" or "auto" for automatic detection
			compute_type: "default", "int8", "int8_float16", "int16", "float16"
			min_speech_probability: Threshold for speech detection
			no_speech_threshold: Higher values skip more potential non-speech
			beam_size: Beam size for decoding (higher = more accurate, slower)


		
		fast-whisper uses whisper AI so it just just as accurate (or near depending on settings),
		but is faster

		To run transcripts, use the command:
		python src/fast_whisper_transcriber.py "data/raw/car_check_videos/*.mp4" --model large-v3 --device cpu --compute-type int16
		"""
		print(f"Loading Faster Whisper model: {model_name} on {device}")
		self.model = WhisperModel(
			model_name, 
			device=device, 
			compute_type=compute_type
		)
		self.min_speech_probability = min_speech_probability
		self.no_speech_threshold = no_speech_threshold
		self.beam_size = beam_size
		
	def post_process(self, text: str) -> str:
		if not text or len(text) < 10:
			return ""
		result = text
			
		return result.strip()
	
	def transcribe_file(self, video_path: str) -> Dict:
		"""Transcribe a single file with enhanced settings"""
		print(f"Transcribing: {video_path}")
		
		# Use Faster Whisper with optimized parameters
		segments, info = self.model.transcribe(
			video_path,
			beam_size=self.beam_size,
			# temperature=0,  # Reduces hallucinations
			no_speech_threshold=self.no_speech_threshold,
			compression_ratio_threshold=2.2,   # Avoid highly compressed (repetitive) output
			vad_filter=True,  # Voice Activity Detection filtering
			vad_parameters=dict(
				min_silence_duration_ms=500,  # Minimum silence duration
				speech_pad_ms=400,            # Padding around speech
				threshold=0.5                 # VAD threshold
			)
		)
		
		# Filter out segments with low speech probability
		filtered_segments = []
		full_text = []
		
		for segment in segments:
			# For faster-whisper, we need to calculate no_speech_prob differently
			speech_prob = segment.avg_logprob  # Use log probability as a confidence measure
			
			# Only keep segments with sufficient confidence
			if speech_prob > -1.0:  # Adjust this threshold as needed
				cleaned_text = self.post_process(segment.text)
				if cleaned_text:  # Only keep non-empty segments
					filtered_segments.append({
						"start": segment.start,
						"end": segment.end,
						"text": cleaned_text,
						"speech_prob": speech_prob
					})
					full_text.append(cleaned_text)
		
		# Combine all text
		filtered_text = " ".join(full_text)
		
		# One final cleanup pass
		final_text = self.post_process(filtered_text)
		
		return {
			"text": final_text,
			"segments": filtered_segments,
			"language": info.language,
			"language_probability": info.language_probability
		}
	
	def transcribe_files(self, pattern: str) -> Dict[str, str]:
		"""
		Transcribe all files matching the pattern
		
		Args:
			pattern: Glob pattern to match video files
		
		Returns:
			Dictionary mapping filenames to transcription text
		"""
		# Find all matching files
		video_files = glob.glob(pattern, recursive=True)
		
		if not video_files:
			print(f"No files found matching pattern: {pattern}")
			return {}
		
		results = {}
		
		# Process each video
		for video_path in video_files:
			result = self.transcribe_file(video_path)
			
			# Store the transcript
			results[video_path] = result["text"]
			
			# Save to file
			base_name = os.path.basename(video_path)
			out_dir = os.path.join("transcripts")
			os.makedirs(out_dir, exist_ok=True)
			transcript_filename = os.path.join(out_dir, f"{base_name}-transcript.txt")
			
			with open(transcript_filename, "w", encoding="utf-8") as f:
				f.write(result["text"])
			
			# Also save detailed segment information for debugging
			# segments_filename = os.path.join(out_dir, f"{base_name}-segments.txt")
			# with open(segments_filename, "w", encoding="utf-8") as f:
			# 	f.write(f"Detected language: {result['language']} "
			# 		f"(probability: {result['language_probability']:.2f})\n\n")
				
			# 	for segment in result["segments"]:
			# 		f.write(f"[{segment['start']:.2f}s - {segment['end']:.2f}s] "
			# 				f"Confidence: {segment['speech_prob']:.2f} "
			# 				f"Text: {segment['text']}\n")
			# print(f"Saved detailed segments to: {segments_filename}")
			print(f"Saved transcript to: {transcript_filename}")
		
		return results


# Example usage
if __name__ == "__main__":
	parser = argparse.ArgumentParser(description='Faster Whisper Enhanced Video Transcriber')
	parser.add_argument('pattern', help='File pattern to match videos (e.g., "videos/*.mp4")')
	parser.add_argument('--model', default='large-v3', help='Whisper model to use')
	parser.add_argument('--device', default='auto', choices=['auto', 'cpu', 'cuda'], 
						help='Device to run inference on')
	parser.add_argument('--compute-type', default='default', 
						choices=['default', 'int8', 'int8_float16', 'int16', 'float16'],
						help='Compute type for inference')
	parser.add_argument('--beam-size', type=int, default=5, 
						help='Beam size for decoding (higher = better quality, slower)')
	parser.add_argument('--no-speech-threshold', type=float, default=0.6, 
						help='Threshold for filtering non-speech')
	
	args = parser.parse_args()
	
	transcriber = FasterWhisperTranscriber(
		model_name=args.model,
		device=args.device,
		compute_type=args.compute_type,
		beam_size=args.beam_size,
		no_speech_threshold=args.no_speech_threshold
	)
	
	transcriptions = transcriber.transcribe_files(args.pattern)
	
	print("\nTranscription complete!")
	print(f"Processed {len(transcriptions)} files")
