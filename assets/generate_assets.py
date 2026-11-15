"""
Generates rich speech audio and animated podcast video for all sample presets.
"""
import subprocess
import os

ASSETS_DIR = r"C:\Users\savit\OneDrive\Desktop\jarvis\shorts-ai\assets"

samples_text = {
    "elon": "The argument for simulation is actually quite strong. If you assume any rate of improvement at all, games will become indistinguishable from reality. Either games will become indistinguishable from reality, or civilization will cease to exist. Those are the two options. Therefore, we are most likely in a simulation.",
    "schulz": "You bought front row tickets to tell me how to do my job? Bro you look like you got fired from an unpaid internship! Look at his haircut, that is not a fade, that is a cry for help! Everyone look at him right now, he is rethinking his entire life choices!",
    "mrbeast": "I have a fresh hot pepperoni pizza and twenty thousand dollars cash. If you step out right now, both are yours. He looked at his best friend, apologized, and sprinted outside the line! His friend literally fell to the floor in disbelief!",
    "jobs": "You cannot connect the dots looking forward; you can only connect them looking backwards. So you have to trust that the dots will somehow connect in your future. Have the courage to follow your heart and intuition. Stay hungry, stay foolish."
}

def generate_speech_wav(key: str, text: str) -> str:
    wav_path = os.path.join(ASSETS_DIR, f"{key}_voice.wav")
    clean_text = text.replace('"', '\\"').replace("'", "")
    ps_cmd = f"""
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.SetOutputToWaveFile('{wav_path}')
$synth.Speak('{clean_text}')
$synth.Dispose()
"""
    subprocess.run(["powershell", "-Command", ps_cmd], check=True)
    return wav_path

def generate_video(key: str, wav_path: str, bg_image: str) -> str:
    mp4_path = os.path.join(ASSETS_DIR, f"{key}_clip.mp4")
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", bg_image,
        "-i", wav_path,
        "-filter_complex",
        "[0:v]scale=1280:720,zoompan=z='min(zoom+0.0006,1.2)':d=1200:s=1280x720[bg]; "
        "[1:a]showwaves=s=750x110:mode=line:colors=0x6366f1|0x06b6d4[wave]; "
        "[bg][wave]overlay=(W-w)/2:H-150[v]",
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        mp4_path
    ]
    subprocess.run(cmd, check=True)
    return mp4_path

if __name__ == "__main__":
    bg_path = os.path.join(ASSETS_DIR, "podcast_bg.jpg")
    for key, text in samples_text.items():
        print(f"Generating voice for {key}...")
        wav = generate_speech_wav(key, text)
        print(f"Generating video for {key}...")
        mp4 = generate_video(key, wav, bg_path)
        print(f"Generated {mp4}")
    
    # Also overwrite sample_clip.mp4 with elon clip as default
    elon_mp4 = os.path.join(ASSETS_DIR, "elon_clip.mp4")
    sample_mp4 = os.path.join(ASSETS_DIR, "sample_clip.mp4")
    if os.path.exists(elon_mp4):
        import shutil
        shutil.copyfile(elon_mp4, sample_mp4)
        print("Updated sample_clip.mp4 with real speech and audio waveform!")
