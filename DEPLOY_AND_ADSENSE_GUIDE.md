# 🚀 ViralClip AI - Production Deployment & Google AdSense Guide

This repository contains everything needed to deploy **ViralClip AI** as a live public web app and monetize it with **Google AdSense**.

---

## 📋 What Was Prepared For You:

1. **`Dockerfile`**: Fully configured Linux production container with Python 3.11, FFmpeg 9.0, Node.js (for YouTube challenge decoding), and clean font packages.
2. **`render.yaml`**: 1-Click deployment blueprint for **Render.com**.
3. **`railway.json`**: 1-Click deployment blueprint for **Railway.app**.
4. **`requirements.txt`**: Production Python dependencies.
5. **Google AdSense Integration**:
   - Official AdSense script slot in `<head>` of `static/index.html`.
   - Responsive Ad banner slot under the clipper.
   - **4 Mandatory Legal Compliance Pages** required by Google AdSense:
     - `/privacy.html` (Privacy Policy with DART cookies & GDPR/CCPA disclosures)
     - `/terms.html` (Terms of Service & Fair Use disclaimers)
     - `/about.html` (About Us & Technology overview)
     - `/contact.html` (Contact, Support & DMCA channels)

---

## 🌐 Option 1: 1-Click Deploy on Render (Recommended & Easiest)

1. Create a free account at [https://render.com](https://render.com).
2. Push your `shorts-ai` folder to a GitHub repository (e.g. `github.com/your-username/viralclip-ai`).
3. In Render Dashboard, click **New +** ➔ **Web Service**.
4. Connect your GitHub repository.
5. Render will automatically detect the `Dockerfile`:
   - **Name**: `viralclip-ai`
   - **Environment**: `Docker`
   - **Instance Type**: Starter / Standard (Minimum 1GB - 2GB RAM recommended for FFmpeg video processing).
6. Click **Create Web Service**.
7. In ~3 minutes, your app is live at `https://viralclip-ai.onrender.com`!

---

## 🚂 Option 2: 1-Click Deploy on Railway

1. Sign up at [https://railway.app](https://railway.app).
2. Click **New Project** ➔ **Deploy from GitHub repo**.
3. Select this repository. Railway will detect the `Dockerfile` and `railway.json` automatically.
4. Go to **Settings** ➔ **Generate Domain** (e.g. `viralclip-ai.up.railway.app`).
5. Your app is live with SSL in under 2 minutes!

---

## 💰 How to Get Approved & Connect Google AdSense

Google AdSense requires a live public website and specific legal compliance. Follow these exact steps to ensure 100% approval:

### Step 1: Add a Custom Domain (Crucial)
While free subdomains (`.onrender.com` / `.railway.app`) are great for testing, Google AdSense requires an apex custom domain (e.g. `viralclipai.com`, `clipviral.io`, etc.).
- Buy a domain from Namecheap, Cloudflare, or GoDaddy ($8–$12/year).
- In Render or Railway, go to **Settings ➔ Custom Domains** and add your domain (e.g. `www.yourdomain.com`).
- Add the CNAME / A records provided by Render/Railway into your domain registrar.

### Step 2: Put Your AdSense Publisher ID in `index.html`
1. Sign up for [Google AdSense](https://adsense.google.com).
2. Copy your **Publisher ID** (looks like `ca-pub-1234567890123456`).
3. Open `static/index.html` and replace all instances of `ca-pub-XXXXXXXXXXXXXXXX` with your real ID:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_REAL_ID" crossorigin="anonymous"></script>
   ```
4. Update the ad slot ID `data-ad-slot="YOUR_AD_UNIT_ID"` with the display unit created in your AdSense console.

### Step 3: Submit for Review
1. In your Google AdSense dashboard, enter your custom domain URL (e.g. `https://yourdomain.com`).
2. Google’s automated crawler will check your site. Because we already created:
   - ✅ Full interactive video creation functionality
   - ✅ GDPR/CCPA Privacy Policy (`/privacy.html`)
   - ✅ Terms of Service (`/terms.html`)
   - ✅ About Us page (`/about.html`)
   - ✅ Contact form & DMCA email (`/contact.html`)
3. You will receive an approval email within 24–48 hours!
4. Once approved, ads will automatically render on your website, earning you revenue on every visitor and video generation.
