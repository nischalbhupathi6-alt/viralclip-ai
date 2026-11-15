"""
ViralClip AI - Audio Asset Generator
Synthesizes royalty-free background music loops and viral sound effects using FFmpeg.
"""
import os
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC_DIR = os.path.join(BASE_DIR, "assets", "music")
SFX_DIR = os.path.join(BASE_DIR, "assets", "sfx")

os.makedirs(MUSIC_DIR, exist_ok=True)
os.makedirs(SFX_DIR, exist_ok=True)

def generate_sfx():
    # 1. Vine Boom (Sub-bass impact drop with decay)
    vine_path = os.path.join(SFX_DIR, "vine_boom.mp3")
    cmd_vine = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "aevalsrc='0.8*sin(2*PI*(70-45*t)*t)*exp(-2.5*t)':s=44100:d=1.8",
        "-af", "lowpass=f=200,volume=2.5",
        "-c:a", "libmp3lame", "-b:a", "192k",
        vine_path
    ]
    subprocess.run(cmd_vine, check=True)
    print("Created:", vine_path)

    # 2. Whoosh (Airy white noise sweep)
    whoosh_path = os.path.join(SFX_DIR, "whoosh.mp3")
    cmd_whoosh = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "anoisesrc=d=0.7:c=white:a=0.6",
        "-af", "bandpass=f=1200:w=800,afade=t=in:ss=0:d=0.3,afade=t=out:st=0.3:d=0.4,volume=2.0",
        "-c:a", "libmp3lame", "-b:a", "192k",
        whoosh_path
    ]
    subprocess.run(cmd_whoosh, check=True)
    print("Created:", whoosh_path)

    # 3. Notification Bell Ding
    bell_path = os.path.join(SFX_DIR, "bell_ding.mp3")
    cmd_bell = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "aevalsrc='0.5*sin(2*PI*1760*t)*exp(-3*t) + 0.3*sin(2*PI*3520*t)*exp(-4*t)':s=44100:d=1.2",
        "-c:a", "libmp3lame", "-b:a", "192k",
        bell_path
    ]
    subprocess.run(cmd_bell, check=True)
    print("Created:", bell_path)

    # 4. Cash Register Cha-Ching
    cash_path = os.path.join(SFX_DIR, "cha_ching.mp3")
    cmd_cash = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "aevalsrc='0.4*sin(2*PI*2200*t)*exp(-6*t) + 0.5*sin(2*PI*3300*(t-0.12))*between(t,0.12,1.2)*exp(-5*(t-0.12))':s=44100:d=1.2",
        "-af", "highpass=f=1000,volume=1.8",
        "-c:a", "libmp3lame", "-b:a", "192k",
        cash_path
    ]
    subprocess.run(cmd_cash, check=True)
    print("Created:", cash_path)

    # 5. Record Scratch
    scratch_path = os.path.join(SFX_DIR, "record_scratch.mp3")
    cmd_scratch = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "anoisesrc=d=0.6:c=pink:a=0.7",
        "-af", "highpass=f=800,lowpass=f=4000,volume=2.2,afade=t=out:st=0.4:d=0.2",
        "-c:a", "libmp3lame", "-b:a", "192k",
        scratch_path
    ]
    subprocess.run(cmd_scratch, check=True)
    print("Created:", scratch_path)

def generate_music():
    # 1. Phonk Drill / Dark Rhythmic Beat (30 seconds)
    phonk_path = os.path.join(MUSIC_DIR, "phonk_drill.mp3")
    cmd_phonk = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "aevalsrc='0.4*sin(2*PI*55*t)*(1+0.6*sin(2*PI*4*t)) + 0.15*sin(2*PI*110*t)*(1+sin(2*PI*8*t)) + 0.08*sin(2*PI*220*t)':s=44100:d=30",
        "-af", "lowpass=f=400,volume=1.5",
        "-c:a", "libmp3lame", "-b:a", "192k",
        phonk_path
    ]
    subprocess.run(cmd_phonk, check=True)
    print("Created:", phonk_path)

    # 2. Suspense Drone / Tension (30 seconds)
    suspense_path = os.path.join(MUSIC_DIR, "suspense_drone.mp3")
    cmd_suspense = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "aevalsrc='0.3*sin(2*PI*45*t) + 0.2*sin(2*PI*48*t) + 0.15*sin(2*PI*90*t)*sin(2*PI*0.3*t)':s=44100:d=30",
        "-af", "volume=1.6",
        "-c:a", "libmp3lame", "-b:a", "192k",
        suspense_path
    ]
    subprocess.run(cmd_suspense, check=True)
    print("Created:", suspense_path)

    # 3. Lofi Chill (30 seconds)
    lofi_path = os.path.join(MUSIC_DIR, "lofi_chill.mp3")
    cmd_lofi = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "aevalsrc='0.2*sin(2*PI*220*t)*sin(2*PI*0.5*t) + 0.2*sin(2*PI*277.18*t) + 0.18*sin(2*PI*329.63*t)':s=44100:d=30",
        "-af", "lowpass=f=900,volume=1.4",
        "-c:a", "libmp3lame", "-b:a", "192k",
        lofi_path
    ]
    subprocess.run(cmd_lofi, check=True)
    print("Created:", lofi_path)

    # 4. Upbeat Viral Pulse (30 seconds)
    upbeat_path = os.path.join(MUSIC_DIR, "upbeat_viral.mp3")
    cmd_upbeat = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "aevalsrc='0.35*sin(2*PI*120*t)*(1+sin(2*PI*4*t)) + 0.2*sin(2*PI*360*t)*(1+sin(2*PI*2*t))':s=44100:d=30",
        "-af", "volume=1.5",
        "-c:a", "libmp3lame", "-b:a", "192k",
        upbeat_path
    ]
    subprocess.run(cmd_upbeat, check=True)
    print("Created:", upbeat_path)

if __name__ == "__main__":
    generate_sfx()
    generate_music()
    print("All audio assets successfully synthesized!")
