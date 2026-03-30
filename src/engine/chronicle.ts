import type {
  GreatChronicle,
  ChronicleVolume,
  ChronicleChapter,
  ChronicleInterlude,
} from '../types/chronicle';
import type { DoomClockArchetype } from '../types/doomClock';

// ── Roman numerals for volume titles ────────────────────────────

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

function toRoman(n: number): string {
  return ROMAN[n - 1] ?? String(n);
}

/** Archetype names with proper capitalization */
function capitalizeArchetype(archetype: DoomClockArchetype): string {
  return archetype.charAt(0).toUpperCase() + archetype.slice(1);
}

// ── Chronicle assembly ──────────────────────────────────────────

/** Create an empty Great Chronicle */
export function createGreatChronicle(): GreatChronicle {
  return { volumes: [], echoThreads: [] };
}

/** Generate a volume title from doom archetype and cycle number */
export function getVolumeTitle(archetype: DoomClockArchetype, cycleNumber: number): string {
  return `Volume ${toRoman(cycleNumber)}: The Age of the ${capitalizeArchetype(archetype)}`;
}

/** Add a new volume for a cycle. Immutable. */
export function createVolume(
  chronicle: GreatChronicle,
  cycleNumber: number,
  doomArchetype: DoomClockArchetype
): GreatChronicle {
  const volume: ChronicleVolume = {
    id: `vol_${String(cycleNumber).padStart(3, '0')}`,
    cycleNumber,
    title: getVolumeTitle(doomArchetype, cycleNumber),
    doomArchetype,
    chapters: [],
    interludes: [],
    harvestSummary: '',
  };
  return { ...chronicle, volumes: [...chronicle.volumes, volume] };
}

/** Add a chapter to the latest volume. Immutable. */
export function addChapter(
  chronicle: GreatChronicle,
  chapter: ChronicleChapter
): GreatChronicle {
  if (chronicle.volumes.length === 0) return chronicle;
  const volumes = [...chronicle.volumes];
  const latest = { ...volumes[volumes.length - 1] };
  latest.chapters = [...latest.chapters, chapter];
  volumes[volumes.length - 1] = latest;
  return { ...chronicle, volumes };
}

/** Add an interlude to the latest volume. Immutable. */
export function addInterlude(
  chronicle: GreatChronicle,
  interlude: ChronicleInterlude
): GreatChronicle {
  if (chronicle.volumes.length === 0) return chronicle;
  const volumes = [...chronicle.volumes];
  const latest = { ...volumes[volumes.length - 1] };
  latest.interludes = [...latest.interludes, interlude];
  volumes[volumes.length - 1] = latest;
  return { ...chronicle, volumes };
}

/** Set the harvest summary on the latest volume. Immutable. */
export function closeVolume(
  chronicle: GreatChronicle,
  harvestSummary: string
): GreatChronicle {
  if (chronicle.volumes.length === 0) return chronicle;
  const volumes = [...chronicle.volumes];
  const latest = { ...volumes[volumes.length - 1] };
  latest.harvestSummary = harvestSummary;
  volumes[volumes.length - 1] = latest;
  return { ...chronicle, volumes };
}

/** Record an echo's appearance in a volume. Creates thread if it doesn't exist. Immutable. */
export function addEchoThreadAppearance(
  chronicle: GreatChronicle,
  echoId: string,
  cycleNumber: number,
  volumeId: string,
  description: string
): GreatChronicle {
  const threads = [...chronicle.echoThreads];
  const existingIdx = threads.findIndex(t => t.echoId === echoId);

  const appearance = { cycleNumber, volumeId, description };

  if (existingIdx >= 0) {
    const thread = { ...threads[existingIdx] };
    thread.appearances = [...thread.appearances, appearance];
    threads[existingIdx] = thread;
  } else {
    threads.push({ echoId, appearances: [appearance] });
  }

  return { ...chronicle, echoThreads: threads };
}
