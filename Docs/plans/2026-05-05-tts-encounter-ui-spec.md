---
status: current
title: TTS Encounter UI Integration Spec
date: 2026-05-06
linear: THR-336
parent_plan: 2026-05-05-encounter-ui-implementation-phasing.md
---

# THR-336 — Encounter UI TTS Discovery + 5-Line Spec

## Discovery summary

Existing TTS infrastructure already ships in `src/services/narration/` as dual-mode narration:
- `useNarration()` exposes `speak(text)`, `speakSections(sections)`, `stop()`, `initWorker()`, status flags, and backend type.
- `NarrationService` routes through `TtsBackend` implementations (`ServerBackend` and `WorkerBackend`).
- Default voice is `NARRATION_VOICE = 'bm_george'` (Kokomoro voice key) in `src/services/narration/narrationConstants.ts`.
- Cancellation exists today via `stop()` (UI-level immediate stop), `AbortController` (server fetch cancel), and worker `stop` message (best-effort stream halt).
- Current API carries text/sections + voice + speed only; no explicit prose scene context object is passed into the TTS layer.

## 5-line encounter UI integration spec

1. `speakEncounter(text: string, voice: string = NARRATION_VOICE, options?: { speed?: number; context?: EncounterTtsContext; mode?: 'single' | 'sections' }) => Promise<TtsHandle>`
2. `voice` is a Kokomoro voice ID string; v1 default and canonical encounter voice is `'bm_george'`.
3. `TtsHandle` exposes `cancel(): void`; cancel must stop playback immediately, abort in-flight generation, and leave narration state in `ready`.
4. `EncounterTtsContext` is optional metadata only (`encounterId`, `stepId`, `actorId`, `threadTier`) and must not affect synthesis determinism in v1.
5. On failure (network/worker/voice unavailable/concurrent request), fail-soft: log warning, keep encounter UI interactive, and return a rejected promise with no thrown synchronous error.

## Implementation note for H3 (post-v1)

H3 should implement `speakEncounter(...)` as a thin adapter over existing `useNarration()` / `NarrationService` surfaces, preserving the existing stop semantics and adding only the typed `TtsHandle` + optional context wrapper.