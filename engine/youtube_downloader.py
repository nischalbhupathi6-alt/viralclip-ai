"""
ViralClip AI - Real YouTube Downloader & Stream Segment Extractor
Uses bundled yt-dlp binary with Node.js runtime and FFmpeg to download real clips.
"""

import os
import sys
import json
import subprocess
import traceback
import shutil
from typing import Dict, Any, Optional, List
from .whisper_transcriber import transcribe_media_whisper

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE_DIR = os.path.join(BASE_DIR, "engine")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")


def resolve_yt_dlp_binary() -> str:
    """Finds best yt-dlp binary across Windows and Linux cloud containers."""
    if sys.platform == "win32":
        local_win = os.path.join(ENGINE_DIR, "yt-dlp.exe")
        if os.path.exists(local_win) and os.path.getsize(local_win) > 1000:
            return local_win
    else:
        system_bin = shutil.which("yt-dlp")
        if system_bin:
            return system_bin
        local_linux = os.path.join(ENGINE_DIR, "yt-dlp")
        if os.path.exists(local_linux) and os.path.getsize(local_linux) > 1000:
            return local_linux
    return "yt-dlp"

YT_DLP_BIN = resolve_yt_dlp_binary()

os.makedirs(UPLOADS_DIR, exist_ok=True)


def download_youtube_subtitles(video_url: str, video_id: str) -> Optional[str]:
    """Downloads YouTube auto or manual subtitles in json3 format."""
    if not os.path.exists(YT_DLP_BIN):
        return None

    sub_filename = f"sub_{video_id[:11]}.en.json3"
    sub_path = os.path.join(UPLOADS_DIR, sub_filename)

    if os.path.exists(sub_path) and os.path.getsize(sub_path) > 1000:
        return sub_path

    out_tmpl = os.path.join(UPLOADS_DIR, f"sub_{video_id[:11]}.%(ext)s")
    cmd = [
        YT_DLP_BIN,
        "--write-auto-sub",
        "--sub-lang", "en",
        "--sub-format", "json3",
        "--skip-download",
        video_url,
        "-o", out_tmpl
    ]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if os.path.exists(sub_path) and os.path.getsize(sub_path) > 1000:
            return sub_path
    except Exception as e:
        print(f"[YT-DLP] Subtitle download warning: {e}")

    return None


def get_real_timed_subtitles(
    video_url: str,
    video_id: str,
    start_sec: float,
    duration_sec: float,
    chunk_size: int = 3,
    video_path: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Extracts word-by-word timed subtitles for a video segment.
    First tries official/auto YouTube subtitles in json3 format.
    If YouTube has no subtitles, uses FFmpeg Whisper AI to transcribe directly from audio.
    """
    sub_file = download_youtube_subtitles(video_url, video_id)
    words = []
    if sub_file and os.path.exists(sub_file):
        try:
            with open(sub_file, "r", encoding="utf-8") as f:
                d = json.load(f)

            events = d.get("events", [])
            raw_words = []
            end_sec = start_sec + duration_sec

            for ev in events:
                t_start = ev.get("tStartMs", 0)
                for seg in ev.get("segs", []):
                    w = seg.get("utf8", "").strip()
                    offset = seg.get("tOffsetMs", 0)
                    ws = (t_start + offset) / 1000.0
                    if w and w != "\n":
                        raw_words.append((ws, w))

            # Deduplicate and filter within segment range
            for ws, w in sorted(raw_words, key=lambda x: x[0]):
                if start_sec <= ws <= end_sec:
                    if not words or words[-1][1] != w:
                        # Normalize start timestamp relative to segment start (0.0s)
                        words.append((round(ws - start_sec, 2), w))

        except Exception as e:
            print(f"[YT-DLP] Failed to parse YouTube timed subtitles: {e}")

    # If YouTube had subtitles, group them into chunks
    if words:
        chunks = []
        for i in range(0, len(words), chunk_size):
            group = words[i:i + chunk_size]
            t_start = group[0][0]
            if i + chunk_size < len(words):
                t_end = words[i + chunk_size][0]
            else:
                t_end = min(duration_sec, round(t_start + 1.4, 2))

            text = " ".join(w[1] for w in group).upper()
            chunks.append({
                "id": len(chunks) + 1,
                "start": t_start,
                "end": round(t_end, 2),
                "text": text,
                "highlight": (len(chunks) % 2 == 0),
                "emoji": ""
            })
        print(f"[SUBTITLES] Extracted {len(chunks)} timed subtitle chunks from YouTube captions")
        return chunks

    # Fallback to AI Whisper transcription if YouTube captions are absent!
    print(f"[SUBTITLES] YouTube has no captions for {video_id}. Checking for local video to transcribe with Whisper...")
    media_to_transcribe = video_path
    if not media_to_transcribe:
        cached_filename = f"yt_{video_id[:11]}_{int(start_sec)}_{int(duration_sec)}.mp4"
        candidate = os.path.join(UPLOADS_DIR, cached_filename)
        if os.path.exists(candidate) and os.path.getsize(candidate) > 10000:
            media_to_transcribe = candidate

    if media_to_transcribe and os.path.exists(media_to_transcribe):
        print(f"[SUBTITLES] Transcribing audio with Whisper AI on: {os.path.basename(media_to_transcribe)}")
        whisper_chunks = transcribe_media_whisper(media_to_transcribe, max_duration_sec=duration_sec)
        if whisper_chunks:
            print(f"[SUBTITLES] Successfully transcribed {len(whisper_chunks)} chunks via Whisper!")
            return whisper_chunks

    return []


def format_timestamp(seconds: float) -> str:
    """Format seconds into HH:MM:SS format for yt-dlp download sections."""
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hrs:02d}:{mins:02d}:{secs:02d}"


def get_youtube_info_live(video_url: str) -> Optional[Dict[str, Any]]:
    """Fetches real YouTube video metadata quickly using yt-dlp print."""
    if not os.path.exists(YT_DLP_BIN):
        return None

    cmd = [
        YT_DLP_BIN,
        "--js-runtimes", "node",
        "--print", "%(title)s|||%(uploader)s|||%(duration)s|||%(thumbnail)s",
        "--no-playlist",
        "--no-check-certificates",
        "--socket-timeout", "15",
        video_url
    ]

    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="ignore",
            timeout=25
        )
        if proc.returncode == 0 and proc.stdout.strip():
            for line in proc.stdout.strip().split("\n"):
                if "|||" in line:
                    parts = line.split("|||")
                    title = parts[0].strip() if len(parts) > 0 else ""
                    uploader = parts[1].strip() if len(parts) > 1 else ""
                    dur_val = 0.0
                    try:
                        dur_val = float(parts[2].strip()) if len(parts) > 2 else 0.0
                    except Exception:
                        pass
                    thumb = parts[3].strip() if len(parts) > 3 else ""
                    return {
                        "title": title,
                        "channel": uploader,
                        "duration": dur_val,
                        "thumbnail": thumb
                    }
    except Exception as e:
        print(f"[YT-DLP] Failed to fetch live metadata: {e}")

    return None


def is_valid_segment(file_path: str) -> bool:
    """Verifies that a downloaded video segment exists and is decodable by ffprobe."""
    if not file_path or not os.path.exists(file_path):
        return False
    if os.path.getsize(file_path) < 200000:
        return False
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if res.returncode == 0 and res.stdout.strip():
            return float(res.stdout.strip()) >= 2.0
    except Exception:
        pass
    return False


def download_youtube_clip_section(
    video_url: str,
    video_id: str,
    start_sec: float,
    duration_sec: float = 30.0
) -> Optional[str]:
    """
    Downloads only the specified clip segment directly from YouTube.
    Returns the absolute path to the downloaded MP4 file.
    """
    if not os.path.exists(YT_DLP_BIN):
        print(f"[YT-DLP] Error: Binary not found at {YT_DLP_BIN}")
        return None

    end_sec = start_sec + duration_sec
    start_str = format_timestamp(start_sec)
    end_str = format_timestamp(end_sec)
    section_arg = f"*{start_str}-{end_str}"

    cached_filename = f"yt_{video_id[:11]}_{int(start_sec)}_{int(duration_sec)}.mp4"
    cached_path = os.path.join(UPLOADS_DIR, cached_filename)

    # Check cache with integrity validation
    if is_valid_segment(cached_path):
        print(f"[YT-DLP] Using cached valid video segment: {cached_path}")
        return cached_path
    elif os.path.exists(cached_path):
        # Corrupted or partial download from earlier, remove it
        try:
            os.remove(cached_path)
        except Exception:
            pass

    cmd = [
        YT_DLP_BIN,
        "--js-runtimes", "node",
        "-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best",
        "--merge-output-format", "mp4",
        "--download-sections", section_arg,
        "--socket-timeout", "20",
        video_url,
        "-o", cached_path
    ]

    print(f"[YT-DLP] Executing segment download: {section_arg} for {video_url} -> {cached_filename}")
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="ignore",
            timeout=100
        )
        if is_valid_segment(cached_path):
            print(f"[YT-DLP] Successfully downloaded clip: {cached_path} ({os.path.getsize(cached_path)} bytes)")
            return cached_path
        else:
            print(f"[YT-DLP] Download exited with code {proc.returncode}. Stderr: {proc.stderr[:300]}")
            if os.path.exists(cached_path):
                try:
                    os.remove(cached_path)
                except Exception:
                    pass
    except Exception as e:
        print(f"[YT-DLP] Download exception: {e}")
        traceback.print_exc()
        if os.path.exists(cached_path):
            try:
                os.remove(cached_path)
            except Exception:
                pass

    return None
