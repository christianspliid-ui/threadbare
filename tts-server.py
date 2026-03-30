"""
Kokoro TTS FastAPI server — runs inference on GPU for fast narration.

Start: .venv/Scripts/python.exe tts-server.py
Endpoint: POST /api/tts  { text, voice?, speed? }  → audio/wav
"""

import io
import sys
import time

import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

# ── Constants ────────────────────────────────────────────────────────

DEFAULT_VOICE = "bm_george"
DEFAULT_SPEED = 0.9
MAX_TEXT_LENGTH = 1500
SECTION_PAUSE_MS = 800  # Silence between sections (ms)
PORT = 3001

# ── App ──────────────────────────────────────────────────────────────

app = FastAPI(title="Kokoro TTS Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ── Model (lazy-loaded on first request) ─────────────────────────────

pipeline = None


def get_pipeline():
    global pipeline
    if pipeline is not None:
        return pipeline

    print("[TTS] Loading Kokoro model...")
    t0 = time.time()

    try:
        from kokoro import KPipeline
        device = "cuda" if torch.cuda.is_available() else "cpu"
        pipeline = KPipeline(lang_code="b", device=device)  # 'b' = British English
        dt = time.time() - t0
        print(f"[TTS] Model loaded on {device} in {dt:.1f}s")
    except Exception as e:
        print(f"[TTS] Failed to load model: {e}", file=sys.stderr)
        raise

    return pipeline


# ── Endpoint ─────────────────────────────────────────────────────────


class TTSRequest(BaseModel):
    sections: list[str] | None = None  # Preferred: list of text sections with pauses between
    text: str | None = None            # Fallback: single text block
    voice: str = DEFAULT_VOICE
    speed: float = DEFAULT_SPEED
    pause_ms: int = SECTION_PAUSE_MS   # Silence between sections (ms)


@app.post("/api/tts")
async def generate_tts(req: TTSRequest):
    import numpy as np
    import soundfile as sf

    # Accept either sections array or single text
    if req.sections:
        texts = [s.strip() for s in req.sections if s.strip()]
    elif req.text:
        texts = [req.text.strip()]
    else:
        raise HTTPException(400, "Provide 'sections' or 'text'")

    if not texts:
        raise HTTPException(400, "Empty text")

    try:
        pipe = get_pipeline()
    except Exception as e:
        raise HTTPException(500, f"Model load failed: {e}")

    t0 = time.time()
    silence = np.zeros(int(24000 * req.pause_ms / 1000), dtype=np.float32)

    all_segments = []
    for i, section_text in enumerate(texts):
        truncated = section_text[:MAX_TEXT_LENGTH]
        for _gs, _ps, audio in pipe(truncated, voice=req.voice, speed=req.speed):
            all_segments.append(audio)
        # Insert silence between sections (not after the last one)
        if i < len(texts) - 1:
            all_segments.append(silence)

    if not all_segments:
        raise HTTPException(500, "No audio generated")

    full_audio = np.concatenate(all_segments)
    total_chars = sum(len(t) for t in texts)
    dt = time.time() - t0
    print(f"[TTS] Generated {len(full_audio)/24000:.1f}s audio in {dt:.2f}s ({total_chars} chars, {len(texts)} sections)")

    # Encode as WAV
    buf = io.BytesIO()
    sf.write(buf, full_audio, 24000, format="WAV")
    buf.seek(0)

    return Response(content=buf.read(), media_type="audio/wav")


# ── Health check ─────────────────────────────────────────────────────


@app.get("/api/tts/health")
async def health():
    return {"status": "ok", "cuda": torch.cuda.is_available()}


# ── Main ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Pre-load model at startup
    get_pipeline()
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="info")
