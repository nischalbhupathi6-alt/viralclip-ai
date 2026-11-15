"""
ViralClip AI - Hormozi-Style ASS Subtitle Generator
Generates high-retention karaoke style subtitles for burning via FFmpeg.
"""

from typing import List, Dict, Any


def format_ass_time(seconds: float) -> str:
    """Formats float seconds into ASS timestamp format: H:MM:SS.cs"""
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int(round((seconds - int(seconds)) * 100))
    if centis >= 100:
        centis = 99
    return f"{hrs}:{mins:02d}:{secs:02d}.{centis:02d}"


def create_ass_subtitles(
    subtitles: List[Dict[str, Any]],
    output_path: str,
    style_preset: str = "hormozi",
    video_width: int = 1080,
    video_height: int = 1920
) -> str:
    """
    Writes an ASS subtitle file with bold, animated Hormozi / MrBeast styling.
    Color codes in ASS are &HAABBGGRR (Alpha, Blue, Green, Red).
    """

    # Styling presets
    presets = {
        "hormozi": {
            "font": "Arial",
            "size": 68,
            "primary": "&H0000FFFF",    # Bright Yellow (BGR: 00 FFFF)
            "secondary": "&H00FFFFFF",  # White
            "outline": "&H00000000",    # Black outline
            "back": "&H80000000",       # Dark shadow
            "outline_w": 5.0,
            "shadow_w": 3.0,
            "margin_v": 280,
            "alignment": 2              # Bottom center
        },
        "mrbeast": {
            "font": "Arial Black",
            "size": 72,
            "primary": "&H0000E6FF",    # Amber Yellow
            "secondary": "&H0000FF00",  # Neon Green
            "outline": "&H00000000",
            "back": "&H00000000",
            "outline_w": 7.0,
            "shadow_w": 4.0,
            "margin_v": 320,
            "alignment": 2
        },
        "cyber": {
            "font": "Trebuchet MS",
            "size": 64,
            "primary": "&H00FFFF00",    # Cyan / Electric Blue
            "secondary": "&H00FF00FF",  # Magenta
            "outline": "&H001A0A26",    # Deep Purple outline
            "back": "&H80000000",
            "outline_w": 4.5,
            "shadow_w": 3.0,
            "margin_v": 300,
            "alignment": 2
        },
        "classic": {
            "font": "Arial",
            "size": 58,
            "primary": "&H00FFFFFF",    # Crisp White
            "secondary": "&H0000FFFF",  # Yellow
            "outline": "&H00000000",
            "back": "&H80000000",
            "outline_w": 4.0,
            "shadow_w": 2.0,
            "margin_v": 240,
            "alignment": 2
        }
    }

    style = presets.get(style_preset, presets["hormozi"])

    ass_header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {video_width}
PlayResY: {video_height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{style['font']},{style['size']},{style['primary']},{style['secondary']},{style['outline']},{style['back']},-1,0,0,0,100,100,1,0,1,{style['outline_w']},{style['shadow_w']},{style['alignment']},40,40,{style['margin_v']},1
Style: Highlight,{style['font']},{int(style['size'] * 1.08)},&H0000FF55,{style['secondary']},{style['outline']},{style['back']},-1,0,0,0,105,105,2,0,1,{style['outline_w'] + 1},{style['shadow_w']},5,40,40,{style['margin_v']},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    dialogue_lines = []
    for sub in subtitles:
        start_ts = format_ass_time(sub["start"])
        end_ts = format_ass_time(sub["end"])
        raw_text = sub["text"].strip()
        emoji = sub.get("emoji", "")

        # Format line with uppercase emphasis and emoji
        formatted = f"{raw_text.upper()} {emoji}".strip()
        dialogue_lines.append(f"Dialogue: 0,{start_ts},{end_ts},Default,,0,0,0,,{formatted}")

    full_content = ass_header + "\n".join(dialogue_lines) + "\n"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_content)

    return output_path
