# ViralClip AI - Faceless YouTube Shorts & Viral Video Maker 🚀🎬

**ViralClip AI** is a full-stack automated video clipping and editing platform. Paste any YouTube video link (podcasts, comedy specials, gaming, interviews, educational videos) or upload a video file to automatically detect funny punchlines, viral hooks, and high-retention segments formatted into 9:16 vertical Shorts, Reels, and TikToks.

---

## ⚡ Core Features

- 🎯 **Automated Viral Clip Discovery**:
  - **Funny & Punchlines**: Scans for jokes, roasts, laughter, comedic timing, and viral banter.
  - **Mind-Blowing Hooks**: Detects high-tension takes, conspiracy/shock facts, and suspenseful moments.
  - **Money & Wealth**: Extracts business tips, passive income secrets, and high-CPM investment advice.
  - **Wisdom & Motivation**: Curates inspiring mindset quotes and life advice.
  - **Custom Search / Prompt**: Search for specific topics (e.g. *"clips where he talks about Elon Musk"*).
- 📱 **9:16 Vertical Video Studio (FFmpeg Powered)**:
  - **Split-Screen Mode (Viral TikTok/Shorts formula)**: Top half original video + bottom half hypnotic satisfying gameplay loop (Subway Surfers / kinetic blocks).
  - **Smart Center Crop**: Automatically crops 16:9 to vertical 1080x1920 centered on the subject.
  - **Blurred Studio Canvas**: Centers the video with a smooth blurred ambient background.
- 🟡 **Dynamic Hormozi-Style Captions**:
  - Bold, punchy word-by-word synchronized captions with bright yellow/cyan highlights, thick black borders, drop shadows, and automatic emoji insertion (`💀`, `😂`, `🔥`, `🤯`, `💰`).
  - Choose between *Alex Hormozi*, *MrBeast*, *Cyber Cyan*, and *Clean Classic* styles.
- 📱 **Interactive Mobile Simulator**:
  - Test and watch your short in a realistic iPhone 16 Pro mockup with live playback, captions, and simulated YouTube Shorts overlays (Likes, Comments, Sound disc, Channel avatar).
- ⚡ **1-Click High-Quality MP4 Render & Download**:
  - Built-in FFmpeg pipeline encodes crisp 1080x1920 30fps H.264 video with synchronized audio in seconds.
- 💰 **Faceless Channel Monetization Hub & Income Calculator**:
  - Complete blueprint for earning \$3,000 - \$10,000/month with zero on-camera appearance.
  - Interactive income calculator simulating YouTube Shorts AdSense, TikTok Creator Rewards, and pinned comment affiliate sales.

---

## 🚀 How to Launch the Web App

### Option A: One-Click Launcher (Recommended)
Double-click `run-shorts-ai.bat` in the repository root. It will start the server and automatically open:
```
http://127.0.0.1:8000
```

### Option B: Terminal Command
```powershell
cd c:\Users\savit\OneDrive\Desktop\jarvis\shorts-ai
& "..\backend\.venv\Scripts\python.exe" -m uvicorn app:app --host 127.0.0.1 --port 8000
```

---

## 💡 How to Earn Money with Faceless AI Shorts

1. **Pick a Proven Viral Niche**:
   - **Podcast Highlights & Humor**: Joe Rogan, Andrew Schulz, Theo Von, Impractical Jokers, Flagrant. Highest view velocity.
   - **Finance & Hustle**: Elon Musk, Alex Hormozi, Naval Ravikant, Warren Buffett. Highest AdSense RPM (\$0.15 - \$0.45).
2. **Apply the Split-Screen Retention Hack**:
   - The YouTube Shorts algorithm rewards **Average Percentage Viewed (APV) > 100%**.
   - The split-screen with satisfying gameplay loop doubles watch time and causes users to re-watch in a loop.
3. **Use the Monetization Triple-Stack**:
   - **YouTube Shorts Partner Program**: Reach 1,000 subscribers and 10M shorts views in 90 days.
   - **TikTok Creator Rewards**: Post the exact same clips on TikTok. Videos over 60s earn \$0.50 - \$1.00 RPM.
   - **Pinned Comment Affiliate Links**: Pin an affiliate link to Audible (free 30-day trial pays \$5/signup), Amazon gear, or software. 30 sales/month = \$750+ passive income.
4. **Post Consistently (3x Daily)**:
   - 11:30 AM (Lunch peak)
   - 3:30 PM (Afternoon break)
   - 8:00 PM (Prime evening scroll)

---

## 🛠️ Technology Stack
- **Backend**: FastAPI, Python 3.14, Uvicorn, FFmpeg 9.0 (Gyan.dev build).
- **Video Engine**: FFmpeg filter graphs (`vstack`, `scale`, `crop`, `boxblur`, `drawbox`, `drawtext`).
- **Frontend**: Responsive HTML5, CSS3 Glassmorphism, Lucide Icons, Vanilla ES6 JavaScript.
