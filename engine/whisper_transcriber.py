"""
ViralClip AI - Built-in FFmpeg Whisper Speech Transcriber
Uses FFmpeg's native libwhisper filter and ggml-tiny.en.bin to transcribe audio directly to JSON.
"""

import os
import re
import json
import subprocess
import traceback
from typing import List, Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE_DIR = os.path.join(BASE_DIR, "engine")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
WHISPER_MODEL = os.path.join(ENGINE_DIR, "ggml-tiny.en.bin")


def clean_transcript_text(text: str) -> str:
    """Removes music symbols, brackets, and extra whitespace."""
    if not text:
        return ""
    # Remove parenthetical background sounds like (upbeat music), [Applause]
    text = re.sub(r'\([^\)]*\)', '', text)
    text = re.sub(r'\[[^\]]*\]', '', text)
    # Remove musical notes
    text = text.replace('♪', '').replace('♫', '').replace('♬', '')
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def split_text_into_timed_chunks(
    text: str,
    start_sec: float,
    end_sec: float,
    words_per_chunk: int = 3
) -> List[Dict[str, Any]]:
    """Splits a transcribed sentence into punchy, evenly-spaced 2-3 word chunks."""
    words = [w.strip() for w in text.split() if w.strip()]
    if not words:
        return []

    duration = max(0.6, end_sec - start_sec)
    chunks = []
    num_groups = (len(words) + words_per_chunk - 1) // words_per_chunk
    time_per_group = duration / max(1, num_groups)

    for i in range(0, len(words), words_per_chunk):
        group = words[i:i + words_per_chunk]
        group_idx = i // words_per_chunk
        grp_start = round(start_sec + (group_idx * time_per_group), 2)
        grp_end = round(min(end_sec, grp_start + time_per_group), 2)
        if grp_end <= grp_start:
            grp_end = round(grp_start + 0.8, 2)

        chunk_text = " ".join(group).upper()
        chunks.append({
            "id": len(chunks) + 1,
            "start": grp_start,
            "end": grp_end,
            "text": chunk_text,
            "highlight": (len(chunks) % 2 == 0),
            "emoji": ""
        })

    return chunks


def transcribe_media_whisper(media_path: str, max_duration_sec: float = 60.0) -> List[Dict[str, Any]]:
    """
    Transcribes audio from a video/audio file using FFmpeg's built-in whisper filter.
    Returns list of timed subtitle chunks.
    """
    if not os.path.exists(WHISPER_MODEL):
        print(f"[WHISPER] Model file not found at: {WHISPER_MODEL}")
        return []

    if not os.path.exists(media_path) or os.path.getsize(media_path) < 1000:
        print(f"[WHISPER] Media file not found or empty: {media_path}")
        return []

    # Temporary json output file
    base_name = os.path.splitext(os.path.basename(media_path))[0]
    out_json = os.path.join(UPLOADS_DIR, f"whisper_{base_name}.json")

    # Format model path and destination for FFmpeg filter syntax
    model_escaped = WHISPER_MODEL.replace("\\", "/").replace(":", "\\:")
    dest_escaped = out_json.replace("\\", "/").replace(":", "\\:")

    cmd = [
        "ffmpeg", "-y",
        "-t", str(round(max_duration_sec, 2)),
        "-i", media_path,
        "-af", f"whisper=model='{model_escaped}':format=json:destination='{dest_escaped}'",
        "-f", "null", "-"
    ]

    print(f"[WHISPER] Starting transcription on: {os.path.basename(media_path)}")
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=40
        )
        if not os.path.exists(out_json) or os.path.getsize(out_json) == 0:
            print(f"[WHISPER] No output generated. Exit code: {proc.returncode}")
            return []

        # Parse output JSON lines
        all_chunks = []
        with open(out_json, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    raw_text = entry.get("text", "")
                    clean_t = clean_transcript_text(raw_text)
                    if not clean_t:
                        continue

                    start_sec = max(0.0, entry.get("start", 0) / 1000.0)
                    end_sec = max(start_sec + 0.5, entry.get("end", 0) / 1000.0)

                    # Split line into 2-3 word chunks
                    line_chunks = split_text_into_timed_chunks(clean_t, start_sec, end_sec, words_per_chunk=3)
                    all_chunks.extend(line_chunks)
                except Exception as ex:
                    print(f"[WHISPER] Line parse error: {ex}")

        # Re-index chunks
        for idx, c in enumerate(all_chunks):
            c["id"] = idx + 1

        print(f"[WHISPER] Transcription successful: generated {len(all_chunks)} subtitle chunks")
        return all_chunks

    except Exception as e:
        print(f"[WHISPER] Transcription exception: {e}")
        traceback.print_exc()
        return []


def generate_subtitles_from_script(
    script_text: str,
    duration_sec: float,
    words_per_chunk: int = 3
) -> List[Dict[str, Any]]:
    """Generates evenly spaced timed subtitle chunks across duration from any script text."""
    clean = clean_transcript_text(script_text)
    if not clean:
        return []

    words = [w.strip() for w in clean.split() if w.strip()]
    if not words:
        return []

    chunks = []
    num_groups = (len(words) + words_per_chunk - 1) // words_per_chunk
    time_per_group = max(0.6, duration_sec / max(1, num_groups))

    for i in range(0, len(words), words_per_chunk):
        group = words[i:i + words_per_chunk]
        group_idx = i // words_per_chunk
        grp_start = round(group_idx * time_per_group, 2)
        grp_end = round(min(duration_sec, grp_start + time_per_group), 2)
        if grp_end <= grp_start:
            grp_end = round(grp_start + 0.8, 2)

        chunks.append({
            "id": len(chunks) + 1,
            "start": grp_start,
            "end": grp_end,
            "text": " ".join(group).upper(),
            "highlight": (len(chunks) % 2 == 0),
            "emoji": ""
        })

    return chunks
