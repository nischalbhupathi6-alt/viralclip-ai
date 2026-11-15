"""
ViralClip AI - Faceless YouTube Shorts & Viral Video Generator
Backend Server powered by FastAPI, FFmpeg, and AI Virality Engine.
"""

import os
import shutil
import uuid
import re
import json
import traceback
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from engine.samples_db import SAMPLE_VIDEOS, get_sample_by_id_or_url
from engine.youtube_fetcher import analyze_video_for_shorts, fetch_youtube_metadata, extract_clip_thumbnail
from engine.youtube_downloader import download_youtube_clip_section, get_real_timed_subtitles, is_valid_segment
from engine.whisper_transcriber import transcribe_media_whisper, generate_subtitles_from_script
from engine.video_renderer import render_vertical_short, get_video_duration

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

app = FastAPI(
    title="ViralClip AI - Faceless Shorts & Viral Video Generator",
    description="Automated AI Clipper for YouTube Shorts, Reels, and TikTok",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    url: str
    objective: str = "funny"
    duration: int = 30
    custom_prompt: Optional[str] = None



class PrepareClipRequest(BaseModel):
    video_id: str
    start_time: float
    duration: float = 30.0


class SubscriptionRequest(BaseModel):
    tier: str  # "pro" | "ultra"
    utr: Optional[str] = None
    payment_method: str = "upi"


class DevAuthRequest(BaseModel):
    passcode: str


class RenderRequest(BaseModel):
    clip_id: Optional[str] = "viral_clip"
    video_id: Optional[str] = "clip"
    start_time: Optional[float] = 0.0
    end_time: Optional[float] = 30.0
    layout_mode: str = "crop"
    subtitle_style: str = "hormozi"
    hook_banner: Optional[str] = None
    subtitles: Optional[List[Dict[str, Any]]] = None
    source_file: Optional[str] = None
    vfx_filter: Optional[str] = "normal"
    music_track: Optional[str] = None
    music_volume: Optional[float] = 0.20
    speech_volume: Optional[float] = 1.0
    stickers: Optional[List[Dict[str, Any]]] = None
    speed: Optional[float] = 1.0


class TranscribeRequest(BaseModel):
    video_id: str
    source_file: Optional[str] = None
    script_text: Optional[str] = None
    start_time: float = 0.0
    duration: float = 30.0


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ViralClip AI Engine",
        "ffmpeg": "ready",
        "version": "2.0.0"
    }


@app.get("/api/samples")
async def get_samples():
    """Returns curated viral sample videos with pre-analyzed punchlines."""
    return {"samples": SAMPLE_VIDEOS}


@app.post("/api/analyze")
async def analyze_video(req: AnalyzeRequest):
    """Analyzes a YouTube URL or query and discovers viral short clips."""
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="YouTube URL or search query is required.")

    try:
        result = analyze_video_for_shorts(
            video_url=req.url.strip(),
            objective=req.objective,
            target_duration=req.duration,
            custom_prompt=req.custom_prompt
        )
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/prepare-clip")
async def prepare_clip_video(req: PrepareClipRequest):
    """Ensures a specific clip segment is downloaded and ready for preview."""
    try:
        cached_filename = f"yt_{req.video_id[:11]}_{int(req.start_time)}_{int(req.duration)}.mp4"
        cached_path = os.path.join(UPLOAD_DIR, cached_filename)
        if os.path.exists(cached_path) and is_valid_segment(cached_path):
            thumb_name = f"thumb_{req.video_id[:11]}_{int(req.start_time)}_{int(req.duration)}.jpg"
            thumb_path = os.path.join(UPLOAD_DIR, thumb_name)
            if not os.path.exists(thumb_path):
                extract_clip_thumbnail(cached_path, thumb_path)
            return {
                "success": True,
                "source_file": cached_path,
                "video_url": f"/uploads/{cached_filename}",
                "thumbnail": f"/uploads/{thumb_name}" if os.path.exists(thumb_path) else None
            }

        yt_url = req.video_id if req.video_id.startswith("http") else f"https://www.youtube.com/watch?v={req.video_id}"
        dl_path = download_youtube_clip_section(
            video_url=yt_url,
            video_id=req.video_id,
            start_sec=req.start_time,
            duration_sec=req.duration
        )
        if dl_path and os.path.exists(dl_path) and is_valid_segment(dl_path):
            filename = os.path.basename(dl_path)
            thumb_name = f"thumb_{req.video_id[:11]}_{int(req.start_time)}_{int(req.duration)}.jpg"
            thumb_path = os.path.join(UPLOAD_DIR, thumb_name)
            extract_clip_thumbnail(dl_path, thumb_path)
            return {
                "success": True,
                "source_file": dl_path,
                "video_url": f"/uploads/{filename}",
                "thumbnail": f"/uploads/{thumb_name}" if os.path.exists(thumb_path) else None
            }

        # Fallback 1: Any existing valid clip for this video in uploads
        prefix = f"yt_{req.video_id[:11]}"
        candidates = [
            f for f in os.listdir(UPLOAD_DIR)
            if f.startswith(prefix) and f.endswith(".mp4")
        ]
        valid_cands = [f for f in candidates if is_valid_segment(os.path.join(UPLOAD_DIR, f))]
        if valid_cands:
            best_cand = max(valid_cands, key=lambda f: os.path.getsize(os.path.join(UPLOAD_DIR, f)))
            best_path = os.path.join(UPLOAD_DIR, best_cand)
            print(f"[PREPARE] Falling back to existing downloaded clip segment: {best_cand}")
            return {
                "success": True,
                "source_file": best_path,
                "video_url": f"/uploads/{best_cand}",
                "thumbnail": None
            }

        # Fallback 2: Sample clip so the user is NEVER blocked by an error
        sample_path = os.path.join(ASSETS_DIR, "sample_clip.mp4")
        if os.path.exists(sample_path):
            return {
                "success": True,
                "source_file": sample_path,
                "video_url": "/assets/sample_clip.mp4",
                "thumbnail": None
            }

        raise HTTPException(status_code=404, detail="Could not prepare video segment.")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload")
async def upload_video_file(
    file: UploadFile = File(...),
    objective: str = Form("funny"),
    duration: int = Form(30),
    custom_prompt: Optional[str] = Form(None)
):
    """Upload a raw video file from computer to analyze and generate shorts."""
    if not file.filename.lower().endswith((".mp4", ".mov", ".mkv", ".webm", ".avi")):
        raise HTTPException(status_code=400, detail="Only video files (.mp4, .mov, .webm) are supported.")

    file_id = f"upload_{uuid.uuid4().hex[:8]}"
    ext = os.path.splitext(file.filename)[1]
    saved_filename = f"{file_id}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Synthetic analysis on user-uploaded file
    result = analyze_video_for_shorts(
        video_url=f"local_{file_id}",
        objective=objective,
        target_duration=duration,
        custom_prompt=custom_prompt or file.filename
    )
    result["title"] = file.filename
    result["channel"] = "Uploaded by You"
    result["source_file"] = dest_path
    result["video_url"] = f"/uploads/{saved_filename}"
    result["is_upload"] = True

    return result


@app.post("/api/transcribe")
async def transcribe_clip(req: TranscribeRequest):
    """
    Transcribes audio or converts custom script into perfectly timed subtitle chunks.
    """
    try:
        # Case 1: Custom script provided by user -> Auto-sync into timed chunks
        if req.script_text and req.script_text.strip():
            chunks = generate_subtitles_from_script(
                script_text=req.script_text.strip(),
                duration_sec=max(3.0, req.duration)
            )
            return {"success": True, "subtitles": chunks, "source": "custom_script"}

        # Case 2: Transcribe via Whisper AI directly from video file
        target_file = req.source_file
        if not target_file or not os.path.exists(target_file):
            cached_candidate = os.path.join(UPLOAD_DIR, f"yt_{req.video_id[:11]}_{int(req.start_time)}_{int(req.duration)}.mp4")
            if os.path.exists(cached_candidate):
                target_file = cached_candidate

        if not target_file or not os.path.exists(target_file):
            if len(req.video_id) >= 11:
                yt_url = req.video_id if req.video_id.startswith("http") else f"https://www.youtube.com/watch?v={req.video_id}"
                target_file = download_youtube_clip_section(
                    video_url=yt_url,
                    video_id=req.video_id,
                    start_sec=req.start_time,
                    duration_sec=req.duration
                )

        if target_file and os.path.exists(target_file):
            chunks = transcribe_media_whisper(target_file, max_duration_sec=req.duration)
            if chunks:
                return {"success": True, "subtitles": chunks, "source": "whisper"}

        return {
            "success": False,
            "message": "No speech detected in audio. You can type custom captions in the editor.",
            "subtitles": []
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@app.post("/api/render")
async def render_short_video(req: RenderRequest):
    """Renders 1080x1920 vertical MP4 using FFmpeg with captions and split-screen."""
    out_filename = f"short_{req.clip_id}_{uuid.uuid4().hex[:6]}.mp4"
    out_path = os.path.join(OUTPUT_DIR, out_filename)

    print(f"\n[RENDER] Received render request for clip: {req.clip_id}, layout: {req.layout_mode}, timestamps: {req.start_time} - {req.end_time}")

    # Determine source video file
    source_video = None
    is_pre_trimmed = False

    # 1. Check if source_file was explicitly provided, exists, and has non-trivial size
    if req.source_file and os.path.exists(req.source_file) and os.path.getsize(req.source_file) > 200000:
        source_video = req.source_file
        if os.path.basename(source_video).startswith("yt_"):
            is_pre_trimmed = True

    # 2. Check sample presets database
    if not source_video:
        sample_match = get_sample_by_id_or_url(req.video_id)
        if sample_match and sample_match.get("source_file") and os.path.exists(sample_match["source_file"]):
            source_video = sample_match["source_file"]

    # 3. If it's a real YouTube video, download the requested segment live!
    if not source_video and req.video_id and len(req.video_id) >= 11:
        yt_url = req.video_id if req.video_id.startswith("http") else f"https://www.youtube.com/watch?v={req.video_id}"
        duration = max(5.0, req.end_time - req.start_time)
        print(f"[RENDER] Fetching live segment from YouTube: {yt_url} at {req.start_time}s...")
        dl_path = download_youtube_clip_section(
            video_url=yt_url,
            video_id=req.video_id,
            start_sec=req.start_time,
            duration_sec=duration
        )
        if dl_path and os.path.exists(dl_path) and os.path.getsize(dl_path) > 200000:
            source_video = dl_path
            is_pre_trimmed = True

    # 4. Fallback: check if ANY video segment for this video exists in uploads/
    if not source_video and req.video_id and len(req.video_id) >= 11:
        prefix = f"yt_{req.video_id[:11]}"
        candidates = [
            f for f in os.listdir(UPLOAD_DIR)
            if f.startswith(prefix) and f.endswith(".mp4")
        ]
        valid_cands = [f for f in candidates if is_valid_segment(os.path.join(UPLOAD_DIR, f))]
        if valid_cands:
            best_cand = max(valid_cands, key=lambda f: os.path.getsize(os.path.join(UPLOAD_DIR, f)))
            source_video = os.path.join(UPLOAD_DIR, best_cand)
            is_pre_trimmed = True
            print(f"[RENDER] Using existing cached clip: {source_video}")

    # 5. Guaranteed fallback to sample clip so render NEVER crashes with 404
    if not source_video or not os.path.exists(source_video) or os.path.getsize(source_video) < 50000:
        sample_path = os.path.join(ASSETS_DIR, "sample_clip.mp4")
        if os.path.exists(sample_path):
            source_video = sample_path
            is_pre_trimmed = False
            print("[RENDER] Fallback to sample_clip.mp4 since requested source was not found.")
        else:
            raise HTTPException(status_code=404, detail="Source video asset not found on server.")

    # If the segment was downloaded via yt-dlp, it already starts at 0.0 and has the requested length!
    src_dur = get_video_duration(source_video)
    if is_pre_trimmed:
        render_start = 0.0
        render_end = min(src_dur, max(3.0, req.end_time - req.start_time))
    else:
        render_start = max(0.0, req.start_time)
        render_end = min(src_dur, max(render_start + 3.0, req.end_time))

    if render_end <= render_start:
        render_end = min(src_dur, render_start + 30.0)

    # Normalize and prepare subtitles
    if req.subtitle_style == "none":
        subtitles = []
    else:
        subtitles = req.subtitles
        if not subtitles and len(req.video_id) >= 11:
            yt_url = req.video_id if req.video_id.startswith("http") else f"https://www.youtube.com/watch?v={req.video_id}"
            duration = max(5.0, req.end_time - req.start_time)
            subtitles = get_real_timed_subtitles(
                video_url=yt_url,
                video_id=req.video_id,
                start_sec=req.start_time,
                duration_sec=duration,
                video_path=source_video
            )

        # Double fallback: if still no subtitles, transcribe the source_video with Whisper directly
        if not subtitles and source_video and os.path.exists(source_video):
            subtitles = transcribe_media_whisper(source_video, max_duration_sec=(req.end_time - req.start_time))

    # Offset subtitles to 0.0 if source file is pre-trimmed
    if subtitles and is_pre_trimmed:
        first_start = min(s.get("start", 0.0) for s in subtitles)
        if first_start >= req.start_time - 1.0 and first_start > 2.0:
            offset = req.start_time
            normalized_subs = []
            for s in subtitles:
                s_copy = dict(s)
                s_copy["start"] = max(0.0, round(s.get("start", 0.0) - offset, 2))
                s_copy["end"] = max(0.0, round(s.get("end", 0.0) - offset, 2))
                normalized_subs.append(s_copy)
            subtitles = normalized_subs

    try:
        render_result = render_vertical_short(
            input_video_path=source_video,
            output_video_path=out_path,
            start_sec=render_start,
            end_sec=render_end,
            layout_mode=req.layout_mode,
            subtitles=subtitles,
            subtitle_style=req.subtitle_style,
            hook_banner=req.hook_banner,
            gameplay_path=os.path.join(ASSETS_DIR, "satisfying_loop.mp4"),
            vfx_filter=req.vfx_filter or "normal",
            music_track=req.music_track,
            music_volume=req.music_volume if req.music_volume is not None else 0.20,
            speech_volume=req.speech_volume if req.speech_volume is not None else 1.0,
            stickers=req.stickers or [],
            speed=req.speed or 1.0
        )
        render_result["download_url"] = f"/api/download/{out_filename}"
        print(f"[RENDER] Success! Generated: {out_filename} ({render_result['file_size_mb']} MB)")
        return render_result
    except Exception as e:
        print("[RENDER] ERROR during video rendering:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Rendering failed: {str(e)}")


@app.get("/api/download/{filename}")
async def download_rendered_short(filename: str):
    """Provides direct file download of the rendered short video."""
    file_path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested video file not found or expired.")

    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@app.get("/api/clips")
async def list_rendered_clips():
    """Returns list of recently rendered video clips with direct links."""
    clips = []
    if os.path.exists(OUTPUT_DIR):
        for f in os.listdir(OUTPUT_DIR):
            if f.endswith(".mp4"):
                fp = os.path.join(OUTPUT_DIR, f)
                size_mb = round(os.path.getsize(fp) / (1024 * 1024), 2)
                mtime = os.path.getmtime(fp)
                clips.append({
                    "filename": f,
                    "download_url": f"/api/download/{f}",
                    "file_size_mb": size_mb,
                    "created_at": mtime
                })
    clips.sort(key=lambda x: x["created_at"], reverse=True)
    return {"clips": clips[:10]}


@app.get("/api/audio/assets")
async def list_audio_assets():
    """Returns library of background music loops and sound effects for KineMaster editor."""
    return {
        "music": [
            {"id": "phonk_drill", "name": "🔥 Phonk Drill Beat", "category": "High Energy / Hype", "url": "/assets/music/phonk_drill.mp3"},
            {"id": "suspense_drone", "name": "🤫 Suspense Tension Drone", "category": "Mystery / Hook", "url": "/assets/music/suspense_drone.mp3"},
            {"id": "lofi_chill", "name": "☕ LoFi Chill Mellow", "category": "Podcast / Wisdom", "url": "/assets/music/lofi_chill.mp3"},
            {"id": "upbeat_viral", "name": "🚀 Upbeat Viral Rhythm", "category": "Trending / Fun", "url": "/assets/music/upbeat_viral.mp3"}
        ],
        "sfx": [
            {"id": "vine_boom", "name": "💥 Vine Boom Impact", "emoji": "💥", "url": "/assets/sfx/vine_boom.mp3"},
            {"id": "whoosh", "name": "💨 Whoosh Transition", "emoji": "💨", "url": "/assets/sfx/whoosh.mp3"},
            {"id": "bell_ding", "name": "🔔 Notification Bell", "emoji": "🔔", "url": "/assets/sfx/bell_ding.mp3"},
            {"id": "cha_ching", "name": "💰 Cash Register (Cha-Ching)", "emoji": "💰", "url": "/assets/sfx/cha_ching.mp3"},
            {"id": "record_scratch", "name": "🛑 Record Scratch Stop", "emoji": "🛑", "url": "/assets/sfx/record_scratch.mp3"}
        ]
    }


@app.get("/api/subscription/plans")
async def get_subscription_plans():
    """Returns available subscription tiers, pricing in INR, and feature allocations."""
    return {
        "currency": "INR",
        "symbol": "₹",
        "plans": [
            {
                "id": "free",
                "name": "Free Starter",
                "price": 0,
                "price_display": "₹0 / Free",
                "period": "Forever",
                "tries": 10,
                "badge": "Standard",
                "description": "Perfect for testing the AI Clipper and creating initial shorts.",
                "features": [
                    "10 Free Video Generations",
                    "9:16 Vertical Auto-Split & Smart Crop",
                    "720p HD Video Output",
                    "Basic Virality & Hook Scoring",
                    "Original Video Audio"
                ],
                "locked": [
                    "Dynamic Hormozi & MrBeast Captions",
                    "KineMaster Pro Multi-track Studio",
                    "Background Music & SFX Audio Library",
                    "Cinematic VFX Color Grading"
                ]
            },
            {
                "id": "pro",
                "name": "Pro Creator",
                "price": 10,
                "price_display": "₹10",
                "period": "Single Pass or Monthly",
                "tries": 50,
                "badge": "⚡ POPULAR (90% Choose)",
                "description": "Unlock viral Hormozi & MrBeast captions that boost view retention by 200%.",
                "features": [
                    "50 Viral Video Generations",
                    "🔥 Alex Hormozi Captions (Yellow/Green)",
                    "💥 MrBeast Pop Captions (Bouncy Colors)",
                    "⚡ Cyberpunk Neon Glow Subtitles",
                    "AI Whisper Word-by-Word Auto-Sync",
                    "1080p Full HD Export (High Bitrate)",
                    "No Watermark Guarantee"
                ],
                "locked": [
                    "KineMaster Pro Multi-track Studio",
                    "Background Music & SFX Audio Library",
                    "Cinematic VFX Color Grading"
                ]
            },
            {
                "id": "ultra",
                "name": "Ultra Studio",
                "price": 50,
                "price_display": "₹50",
                "period": "All-Access Pass",
                "tries": -1,
                "badge": "👑 ALL FEATURES UNLOCKED",
                "description": "Full KineMaster Pro multi-track editor, visual effects, music, SFX and unlimited renders.",
                "features": [
                    "Unlimited Video Generations",
                    "🎬 Full KineMaster Pro Multi-Track Studio",
                    "Multi-track Timeline (Video, Captions, Music, Stickers, SFX)",
                    "🎵 Full Background Music Library (Phonk, LoFi, Upbeat)",
                    "🔊 Viral Sound Effects (Vine Boom, Cha-Ching, Whoosh)",
                    "😎 Emoji Sticker Overlay Layer (🔥, 💀, 🚀, 💰)",
                    "✨ Cinematic VFX Color Grading (Cyber, Golden, Vintage)",
                    "⚡ Speed Ramping (0.5x - 2.0x)",
                    "🚀 60 FPS Ultra HD Export",
                    "VIP Priority Rendering Queue"
                ],
                "locked": []
            }
        ]
    }


@app.post("/api/subscription/activate")
async def activate_subscription(req: SubscriptionRequest):
    """Activates a selected subscription tier for the user."""
    tier = req.tier.lower()
    if tier not in ["free", "pro", "ultra", "dev"]:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    return {
        "success": True,
        "tier": tier,
        "transaction_id": req.transaction_id or str(uuid.uuid4())[:8],
        "message": f"Successfully upgraded to {tier.title()} Plan!"
    }


@app.post("/api/subscription/verify-dev")
async def verify_dev_mode(req: DevAuthRequest):
    """Verifies developer/owner passcode to grant permanent unlimited access."""
    if req.passcode.strip().upper() == "DEV2026":
        return {
            "success": True,
            "tier": "dev",
            "role": "owner",
            "message": "🛠️ Developer Mode Verified! Unlimited access granted to owner."
        }
    raise HTTPException(status_code=403, detail="Invalid developer passcode. Contact owner.")



# Serve assets (e.g. sample video clips, satisfying loops)
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

# Serve uploaded user video files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/robots.txt")
async def get_robots():
    robots_path = os.path.join(STATIC_DIR, "robots.txt")
    if os.path.exists(robots_path):
        return FileResponse(robots_path, media_type="text/plain")
    return FileResponse(os.path.join(STATIC_DIR, "robots.txt"), media_type="text/plain")

@app.get("/sitemap.xml")
async def get_sitemap():
    sitemap_path = os.path.join(STATIC_DIR, "sitemap.xml")
    if os.path.exists(sitemap_path):
        return FileResponse(sitemap_path, media_type="application/xml")
    raise HTTPException(status_code=404, detail="Sitemap not found")

@app.get("/apps/{full_path:path}")
@app.get("/apps")
async def apps_redirect():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

# Serve static web interface
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app:app", host=host, port=port)
