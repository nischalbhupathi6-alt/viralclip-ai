"""
ViralClip AI - FFmpeg Video Rendering Engine (Pro Studio / KineMaster Edition)
Cuts clips, converts to 9:16 vertical shorts, composites split-screen gameplay,
applies cinematic VFX filters, overlays animated emojis/stickers, and mixes
multi-track background music & SFX with timed Hormozi captions.
"""

import os
import re
import subprocess
from typing import List, Dict, Any, Optional

def get_system_font_path(prefer_impact: bool = True) -> str:
    """Finds best bold display font on Windows or Linux cloud environments."""
    candidates = [
        r"C:\Windows\Fonts\impact.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\trebucbd.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    ]
    if not prefer_impact:
        candidates = [r"C:\Windows\Fonts\arialbd.ttf"] + candidates

    for path in candidates:
        if os.path.exists(path):
            return path.replace("\\", "/").replace(":", "\\:")
    return ""


def get_video_duration(file_path: str) -> float:
    """Probes the real duration of a media file in seconds using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if res.returncode == 0 and res.stdout.strip():
            return float(res.stdout.strip())
    except Exception as e:
        print(f"ffprobe warning for {file_path}: {e}")
    return 15.0


def clean_text_for_ffmpeg(text: str) -> str:
    """Sanitizes text for FFmpeg drawtext filter syntax."""
    if not text:
        return ""
    cleaned = (
        str(text)
            .replace("\r", " ")
            .replace("\n", " ")
            .replace("\t", " ")
            .replace("'", "")
            .replace('"', '')
            .replace(":", " - ")
            .replace(";", " - ")
            .replace(",", " ")
            .replace("%", " pct")
            .replace("$", "USD ")
            .replace("\\", "")
            .replace("[", "(")
            .replace("]", ")")
            .replace("{", "(")
            .replace("}", ")")
    )
    # Strip non-ASCII so drawtext doesn't crash font rendering
    cleaned = re.sub(r'[^\x00-\x7F]+', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


EMOJI_FALLBACK: Dict[str, str] = {
    "🔥": "FIRE",
    "💀": "DEAD",
    "🚀": "VIRAL",
    "😱": "OMG",
    "🤯": "MIND BLOWN",
    "💯": "100%",
    "👑": "GOAT",
    "✨": "MAGIC",
    "😂": "LOL",
    "🚨": "ALERT",
    "⚡": "ELECTRIC",
    "🎉": "WINNER",
    "🎬": "ACTION",
    "🍿": "INSANE",
    "🏆": "CHAMPION",
    "💎": "DIAMOND",
    "❤️": "LOVE",
    "👏": "FACTS",
    "💰": "BAG SECURED",
    "💣": "BOOM"
}


def check_audio_stream(filepath: str) -> bool:
    """Checks if a media file has a decodable audio stream using ffprobe."""
    if not filepath or not os.path.exists(filepath):
        return False
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-select_streams", "a",
            "-show_entries", "stream=codec_type",
            "-of", "csv=p=0",
            filepath
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        return bool(res.returncode == 0 and "audio" in res.stdout.lower())
    except Exception:
        return False


def render_vertical_short(
    input_video_path: str,
    output_video_path: str,
    start_sec: float,
    end_sec: float,
    layout_mode: str = "crop",
    subtitles: Optional[List[Dict[str, Any]]] = None,
    subtitle_style: str = "hormozi",
    hook_banner: Optional[str] = None,
    gameplay_path: Optional[str] = None,
    vfx_filter: str = "normal",
    music_track: Optional[str] = None,
    music_volume: float = 0.20,
    speech_volume: float = 1.0,
    stickers: Optional[List[Dict[str, Any]]] = None,
    speed: float = 1.0
) -> Dict[str, Any]:
    """
    Renders a master 9:16 vertical short (1080x1920, 30fps) with multi-track
    background music, visual filters, emoji/sticker overlays, and timed captions.
    """
    target_duration = max(1.0, float(end_sec - start_sec))
    os.makedirs(os.path.dirname(os.path.abspath(output_video_path)), exist_ok=True)

    font_path = get_system_font_path(prefer_impact=(subtitle_style in ["hormozi", "mrbeast"]))
    font_arg = f"fontfile='{font_path}':" if font_path else ""

    src_duration = get_video_duration(input_video_path)
    if src_duration <= 0:
        src_duration = 15.0

    norm_start = float(start_sec) % max(1.0, src_duration)

    cmd = ["ffmpeg", "-y"]

    # Input 0: Primary video clip
    cmd.extend([
        "-stream_loop", "-1",
        "-ss", str(round(norm_start, 2)),
        "-t", str(round(target_duration, 2)),
        "-i", input_video_path
    ])
    input_count = 1

    # Input 1: Satisfying gameplay background for split screen
    gameplay_in_idx = None
    if layout_mode == "split":
        if not gameplay_path or not os.path.exists(gameplay_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            gameplay_path = os.path.join(base_dir, "assets", "satisfying_loop.mp4")

        cmd.extend([
            "-stream_loop", "-1",
            "-t", str(round(target_duration, 2)),
            "-i", gameplay_path
        ])
        gameplay_in_idx = input_count
        input_count += 1

    # Input 2: Background Music Track (if selected)
    music_in_idx = None
    if music_track and music_track not in ["none", ""]:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        music_candidates = [
            os.path.join(base_dir, "assets", "music", f"{music_track}.mp3"),
            os.path.join(base_dir, "assets", "music", music_track),
            os.path.join(base_dir, "assets", f"{music_track}.mp3")
        ]
        chosen_music = next((m for m in music_candidates if os.path.exists(m)), None)
        if chosen_music:
            cmd.extend([
                "-stream_loop", "-1",
                "-t", str(round(target_duration, 2)),
                "-i", chosen_music
            ])
            music_in_idx = input_count
            input_count += 1

    filter_complex = []

    # 1. Canvas Layout (All output strictly 1080x1920 with high-precision Lanczos scaling)
    if layout_mode == "split" and gameplay_in_idx is not None:
        filter_complex.append(
            f"[0:v]scale=1080:960:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:960[top]; "
            f"[{gameplay_in_idx}:v]scale=1080:960:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:960[bottom]; "
            f"[top][bottom]vstack=inputs=2[base_canvas]"
        )
        current_v = "[base_canvas]"

    elif layout_mode == "blur":
        filter_complex.append(
            "[0:v]split=2[bg_raw][fg_raw]; "
            "[bg_raw]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,boxblur=26:6[bg]; "
            "[fg_raw]scale=1080:-2:flags=lanczos[fg]; "
            "[bg][fg]overlay=(W-w)/2:(H-h)/2[base_canvas]"
        )
        current_v = "[base_canvas]"

    elif layout_mode == "fit":
        filter_complex.append(
            "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[base_canvas]"
        )
        current_v = "[base_canvas]"

    else:
        # Full 9:16 Center Crop
        filter_complex.append(
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920:(in_w-1080)/2:(in_h-1920)/2[base_canvas]"
        )
        current_v = "[base_canvas]"

    # 2. Visual Effects (VFX & Cinematic Filters)
    vfx_filter_map = {
        "cyberpunk": "colorbalance=rs=0.15:gs=-0.08:bs=0.25:rm=0.1:gm=-0.05:bm=0.2,eq=saturation=1.35:contrast=1.15",
        "warm": "colorbalance=rs=0.22:gs=0.08:bs=-0.18,eq=saturation=1.15",
        "vintage_bw": "hue=s=0,eq=contrast=1.25:brightness=-0.04",
        "contrast": "eq=contrast=1.32:brightness=-0.05:saturation=1.2",
        "vibrant": "eq=saturation=1.65:contrast=1.12",
        "glitch": "noise=alls=15:allf=t+u,eq=contrast=1.2"
    }
    if vfx_filter in vfx_filter_map:
        filter_complex.append(f"{current_v}{vfx_filter_map[vfx_filter]}[with_vfx]")
        current_v = "[with_vfx]"

    # 3. Hook Banner at Top
    if hook_banner and hook_banner.strip():
        sanitized_hook = clean_text_for_ffmpeg(hook_banner.upper())
        if sanitized_hook:
            filter_complex.append(
                f"{current_v}drawbox=y=90:color=0x0a0a14@0.90:width=iw:height=130:t=fill,"
                f"drawbox=y=220:color=0x6366f1@1:width=iw:height=4:t=fill,"
                f"drawtext={font_arg}text='{sanitized_hook}':fontcolor=white:fontsize=46:"
                f"x=(w-text_w)/2:y=135[with_hook]"
            )
            current_v = "[with_hook]"

    # 4. Timed Hormozi-style Captions (Skip if subtitle_style is "none")
    if subtitles and len(subtitles) > 0 and subtitle_style != "none":
        sub_filters = []
        color_map = {
            "hormozi": ["yellow", "white", "0x00FF88"],
            "mrbeast": ["0xFFDD00", "white", "0x00FF44"],
            "cyber": ["0x00F0FF", "0xFF00AA", "white"],
            "classic": ["white", "yellow"]
        }
        palette = color_map.get(subtitle_style, color_map["hormozi"])

        for idx, sub in enumerate(subtitles):
            raw_t = sub.get("text", "")
            clean_t = clean_text_for_ffmpeg(raw_t.upper())
            if not clean_t:
                continue

            sub_start = max(0.0, float(sub.get("start", 0.0)))
            sub_end = min(target_duration, float(sub.get("end", sub_start + 1.2)))
            if sub_end <= sub_start:
                sub_end = sub_start + 1.0

            color = palette[idx % len(palette)]
            fontsize = 66 if subtitle_style in ["hormozi", "mrbeast"] else 58
            y_pos = "(1920-text_h)/2" if layout_mode == "split" else "1280"

            draw_cmd = (
                f"drawtext={font_arg}text='{clean_t}':fontcolor={color}:fontsize={fontsize}:"
                f"borderw=6:bordercolor=black:fix_bounds=true:"
                f"x=(w-text_w)/2:y={y_pos}:enable='between(t,{sub_start},{sub_end})'"
            )
            sub_filters.append(draw_cmd)

        if sub_filters:
            chained = ",".join(sub_filters)
            filter_complex.append(f"{current_v}{chained}[with_subs]")
            current_v = "[with_subs]"

    # 5. Stickers & Text Overlays (KineMaster Studio Layers)
    if stickers and len(stickers) > 0:
        sticker_filters = []
        for stk in stickers:
            txt = stk.get("text") or stk.get("label") or stk.get("emoji") or ""
            # Check emoji fallback
            txt_stripped = str(txt).strip()
            if txt_stripped in EMOJI_FALLBACK:
                clean_stk = EMOJI_FALLBACK[txt_stripped]
            else:
                clean_stk = clean_text_for_ffmpeg(txt)
                if not clean_stk:
                    # If whole text was an unlisted emoji, try finding any known emoji in it
                    for em, fb in EMOJI_FALLBACK.items():
                        if em in txt_stripped:
                            clean_stk = fb
                            break
                    if not clean_stk:
                        clean_stk = "VIRAL"

            stk_start = max(0.0, float(stk.get("start", 0.0)))
            stk_end = min(target_duration, float(stk.get("end", target_duration)))
            if stk_end <= stk_start:
                stk_end = target_duration

            pos_y = str(stk.get("y", "450"))
            pos_x = str(stk.get("x", "(w-text_w)/2"))
            color = stk.get("color", "white")
            fontsize = stk.get("fontsize", 54)

            # Use native drawtext box=1 to avoid invalid text_w evaluation in drawbox filter
            sticker_filters.append(
                f"drawtext={font_arg}text='{clean_stk}':fontcolor={color}:fontsize={fontsize}:"
                f"borderw=4:bordercolor=black:box=1:boxcolor=0x0c0d18@0.85:boxborderw=14:"
                f"x={pos_x}:y={pos_y}:enable='between(t,{stk_start},{stk_end})'"
            )
        if sticker_filters:
            chained_stk = ",".join(sticker_filters)
            filter_complex.append(f"{current_v}{chained_stk}[with_stickers]")
            current_v = "[with_stickers]"

    # 6. Playback Speed Adjustment (if set and != 1.0)
    speed_factor = max(0.5, min(2.0, float(speed))) if speed else 1.0
    if abs(speed_factor - 1.0) > 0.05:
        filter_complex.append(f"{current_v}setpts=PTS/{speed_factor}[with_speed]")
        current_v = "[with_speed]"

    # 7. Audio Processing & Mixing (Speech Volume + Background Music)
    has_src_audio = check_audio_stream(input_video_path)
    speech_vol = max(0.0, min(2.0, float(speech_volume)))
    music_vol = max(0.0, min(1.0, float(music_volume)))

    # Apply audio tempo if speed changed
    speed_a_filter = f",atempo={speed_factor}" if abs(speed_factor - 1.0) > 0.05 else ""

    if music_in_idx is not None and has_src_audio:
        # Both speech and background music present -> mix cleanly
        filter_complex.append(
            f"[0:a]volume={speech_vol}{speed_a_filter}[speech_aud]; "
            f"[{music_in_idx}:a]volume={music_vol}[bg_aud]; "
            f"[speech_aud][bg_aud]amix=inputs=2:duration=first:dropout_transition=2[out_audio]"
        )
        audio_mapped = "[out_audio]"
    elif music_in_idx is not None and not has_src_audio:
        # Source video is silent, background music selected -> use music
        filter_complex.append(
            f"[{music_in_idx}:a]volume={music_vol}[out_audio]"
        )
        audio_mapped = "[out_audio]"
    elif music_in_idx is None and has_src_audio:
        # Source video has audio, no background music
        if abs(speech_vol - 1.0) > 0.05 or abs(speed_factor - 1.0) > 0.05:
            filter_complex.append(f"[0:a]volume={speech_vol}{speed_a_filter}[out_audio]")
            audio_mapped = "[out_audio]"
        else:
            audio_mapped = "0:a"
    else:
        # Neither source video has audio NOR background music -> synthesize stereo silence
        cmd.extend([
            "-f", "lavfi",
            "-t", str(round(target_duration, 2)),
            "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"
        ])
        silent_in_idx = input_count
        input_count += 1
        audio_mapped = f"{silent_in_idx}:a"

    full_filter_str = "; ".join(filter_complex)
    cmd.extend(["-filter_complex", full_filter_str])
    cmd.extend(["-map", current_v])
    cmd.extend(["-map", audio_mapped])

    # Output encoding parameters (Master 1080x1920 30fps H.264 High Profile + 320k AAC)
    cmd.extend([
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-b:v", "8500k",
        "-maxrate", "12000k",
        "-bufsize", "16000k",
        "-pix_fmt", "yuv420p",
        "-colorspace", "bt709",
        "-color_primaries", "bt709",
        "-color_trc", "bt709",
        "-r", "30",
        "-c:a", "aac",
        "-b:a", "320k",
        "-ar", "48000",
        "-t", str(round(target_duration, 2)),
        output_video_path
    ])

    print("Executing FFmpeg command:", " ".join(cmd[:12]), "...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        err_msg = result.stderr[-450:] if result.stderr else "Unknown FFmpeg error"
        print("FFMPEG ERROR OUTPUT:\n", err_msg)
        raise RuntimeError(f"FFmpeg rendering failed: {err_msg}")

    file_size_bytes = os.path.getsize(output_video_path) if os.path.exists(output_video_path) else 0

    return {
        "success": True,
        "output_path": output_video_path,
        "filename": os.path.basename(output_video_path),
        "duration": target_duration,
        "file_size_mb": round(file_size_bytes / (1024 * 1024), 2),
        "resolution": "1080x1920 (9:16 Vertical)"
    }
