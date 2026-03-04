import type { SphereName } from './index';
import type { DoomClockArchetype } from './doomClock';

// ── Chronicle Chapter (from tier-3 entries) ─────────────────────

export interface ChronicleChapter {
  id: string;
  title: string;
  prose: string;
  /** The tick this chapter corresponds to */
  tick: number;
  significance: number;
  spheres: SphereName[];
  actorIds: string[];
}

// ── Interlude (compressed routine summaries) ────────────────────

export interface ChronicleInterlude {
  id: string;
  summary: string;
  tickRange: { start: number; end: number };
  /** How many routine events were compressed */
  eventCount: number;
}

// ── Echo Thread (cross-volume tracking) ─────────────────────────

export interface EchoThreadAppearance {
  cycleNumber: number;
  volumeId: string;
  description: string;
}

export interface EchoThread {
  echoId: string;
  appearances: EchoThreadAppearance[];
}

// ── Volume (one per cycle) ──────────────────────────────────────

export interface ChronicleVolume {
  id: string;
  cycleNumber: number;
  /** Named after the doom clock archetype, e.g. "The Age of the Breach" */
  title: string;
  doomArchetype: DoomClockArchetype;
  chapters: ChronicleChapter[];
  interludes: ChronicleInterlude[];
  harvestSummary: string;
}

// ── The Great Chronicle ─────────────────────────────────────────

export interface GreatChronicle {
  volumes: ChronicleVolume[];
  echoThreads: EchoThread[];
}
