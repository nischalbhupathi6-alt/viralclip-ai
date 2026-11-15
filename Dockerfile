# ViralClip AI - Production Container Image
FROM python:3.11-slim-bookworm

# Avoid prompts from debian
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies: FFmpeg, Node.js, curl, fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    nodejs \
    npm \
    curl \
    fontconfig \
    fonts-dejavu-core \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Ensure storage directories exist
RUN mkdir -p uploads output assets engine

# Default port - Render uses PORT (default 10000)
ENV PORT=10000
EXPOSE 10000

# Run uvicorn bound to all interfaces on $PORT using python3 -m
CMD ["sh", "-c", "python3 -m uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}"]
