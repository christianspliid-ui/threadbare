import type { ReachDomain } from './traits';

/**
 * Canonical Core registry (THR-542 — slice 1 of 4, Engine foundation).
 *
 * The **Core** is a second, more *fundamental* personality layer that sits
 * beneath the 8 reach moral axes (`axisRegistry.ts`). Where a reach axis says
 * *how an agent acts in a domain* (Brave vs Power-Hungry on Iron), the Core says
 * *who they fundamentally are* — five plain virtue↔vice continuums of character.
 *
 * ## The five continuums
 *
 * | Continuum id      | Virtue (1.0) ← → Vice (0.0) | What it governs                |
 * |-------------------|-----------------------------|--------------------------------|
 * | `core_warmth`     | Warm ← → Cold               | care for others                |
 * | `core_hope`       | Hopeful ← → Bitter          | outlook                        |
 * | `core_forgiveness`| Forgiving ← → Vengeful      | how harm is metabolized        |
 * | `core_humility`   | Humble ← → Proud            | self-regard                    |
 * | `core_integrity`  | True ← → False              | inner self matches outer       |
 *
 * ## Canon-safe framing (LOAD-BEARING — do not "fix" this away)
 *
 * The Core and **Quintessence** are *co-resident on the foundation layer but
 * distinct*. Quintessence = how much self is left / how bendable the agent is;
 * the Core = *who* that self is / *which direction* they bend. They couple
 * **directionally, not evaluatively**: low Quintessence makes an agent bend, and
 * the Core decides which way — but goodness is NEVER a pole of the Quintessence
 * scalar (that would make villains thin out of the story). `core_integrity`
 * (True↔False = integrity-of-self) is the most Quintessence-native continuum,
 * but it is still character, not the Quintessence meter. **Never label the Core
 * "Quintessence traits" in UI/UL.**
 *
 * ## Core ≠ reach ≠ capability (three separate field sets)
 *
 * - **Core** — this layer; `node.properties.coreProfile` (`CoreProfile`).
 * - **Reach axis** — `node.properties.axiologicalProfile` (`AxiologicalProfile`).
 * - **Capability** — `node.properties.domainCapabilities`.
 *
 * The Core **seeds** reach traits at birth, **colours** their expression at
 * runtime, and sets **bend-direction** under low Quintessence — but it **never
 * caps** them. A cold philanthropist (Cold core, Generous Gold axis) must stay
 * possible. See `src/engine/core/coreMechanics.ts` for the seed/colour/bend
 * functions and `Docs/plans/2026-06-29-quintessence-core-layer.md` for the spec.
 *
 * ## Canonical scale
 *
 * Each continuum is a single scalar per agent on **0–1, 0.5 neutral, virtue pole
 * = 1.0, vice pole = 0.0** — the same canonical scale as the reach axes.
 */

/** Which side of a Core continuum a pole label refers to. */
export type CorePoleSide = 'virtue' | 'vice';

/** A single pole of a Core continuum: the plain character word usable in prose. */
export interface CorePole {
  /** Plain character word, e.g. 'Warm' or 'Cold'. */
  readonly word: string;
}

/**
 * A directional coupling from a Core continuum to a reach axis. Used by the
 * **bend** mechanic (and, in a later slice, birth **seeding** of reach traits):
 * when the agent is bending (low Quintessence), a Core continuum nudges the
 * coupled reach axis toward its virtue (`sign: +1`) or vice (`sign: -1`) pole.
 *
 * This is a *direction*, never a *cap* — magnitudes live in named constants
 * (`coreConstants.ts`). v1 encodes only the couplings explicitly stated in the
 * THR-542 spec; the remaining couplings are intentionally left empty (fail-soft,
 * no contribution) for the content slice to author against the full plan doc.
 */
export interface CoreReachCoupling {
  readonly reach: ReachDomain;
  /** +1 = Core-virtue pushes the reach toward its virtue pole; -1 = toward vice. */
  readonly sign: 1 | -1;
}

/** One Core continuum of character. */
export interface CoreContinuum {
  /**
   * Stable continuum id. Convention: `core_<virtue-anchor>` — prefixed `core_`
   * so a Core continuum is never confused with a reach axis (`<reach>_axis`).
   */
  readonly continuumId: string;
  /** Virtue pole (canonical position 1.0). */
  readonly virtue: CorePole;
  /** Vice pole (canonical position 0.0). */
  readonly vice: CorePole;
  /** One-line description of what this continuum governs. */
  readonly governs: string;
  /**
   * True for the continuum closest to the Quintessence concept (integrity of
   * self). Documentation/coupling hint only — the Core is still character, never
   * the Quintessence meter (see module doc, canon-safe framing).
   */
  readonly quintessenceNative: boolean;
  /**
   * Directional couplings to reach axes for the bend mechanic. v1: only the
   * spec-stated couplings; empty is valid (no bend contribution from this
   * continuum yet).
   */
  readonly reachCouplings: readonly CoreReachCoupling[];
}

/** Canonical neutral position on the 0–1 Core scale. */
export const CORE_NEUTRAL = 0.5;
/** Canonical virtue-pole position on the 0–1 Core scale. */
export const CORE_VIRTUE = 1.0;
/** Canonical vice-pole position on the 0–1 Core scale. */
export const CORE_VICE = 0.0;

/**
 * The five Core continuums, in canonical order.
 *
 * `reachCouplings` v1 encodes ONLY the couplings the THR-542 spec states
 * explicitly (Warm→Generous/Loyal, Humble→away from Power-Hungry, True→
 * Fair/Perceptive). `core_hope` / `core_forgiveness` couplings are deliberately
 * empty until the content slice authors them against the full plan doc — empty
 * is fail-soft (those continuums still seed, colour, and emerge; only their
 * bend contribution is pending).
 */
export const CORE_CONTINUA: readonly CoreContinuum[] = [
  {
    continuumId: 'core_warmth',
    virtue: { word: 'Warm' },
    vice: { word: 'Cold' },
    governs: 'care for others',
    quintessenceNative: false,
    // Warm seeds Generous (Gold) and Loyal (Heart) — spec-stated.
    reachCouplings: [
      { reach: 'gold', sign: 1 },
      { reach: 'heart', sign: 1 },
    ],
  },
  {
    continuumId: 'core_hope',
    virtue: { word: 'Hopeful' },
    vice: { word: 'Bitter' },
    governs: 'outlook',
    quintessenceNative: false,
    reachCouplings: [],
  },
  {
    continuumId: 'core_forgiveness',
    virtue: { word: 'Forgiving' },
    vice: { word: 'Vengeful' },
    governs: 'how harm is metabolized',
    quintessenceNative: false,
    reachCouplings: [],
  },
  {
    continuumId: 'core_humility',
    virtue: { word: 'Humble' },
    vice: { word: 'Proud' },
    governs: 'self-regard',
    quintessenceNative: false,
    // Humble seeds away from Power-Hungry (Iron) — i.e. toward the virtue pole.
    reachCouplings: [{ reach: 'iron', sign: 1 }],
  },
  {
    continuumId: 'core_integrity',
    virtue: { word: 'True' },
    vice: { word: 'False' },
    governs: 'inner self matches outer',
    quintessenceNative: true,
    // True seeds Fair (Shadow) and Perceptive (Eye) — spec-stated.
    reachCouplings: [
      { reach: 'shadow', sign: 1 },
      { reach: 'eye', sign: 1 },
    ],
  },
];

// ─── Lookup indexes (built once at module load) ─────────────────────────────

const CONTINUUM_BY_ID: ReadonlyMap<string, CoreContinuum> = new Map(
  CORE_CONTINUA.map((c) => [c.continuumId, c]),
);

// ─── Helper getters ─────────────────────────────────────────────────────────

/** Get a Core continuum by its stable id, or undefined if unknown. */
export function getCoreContinuum(continuumId: string): CoreContinuum | undefined {
  return CONTINUUM_BY_ID.get(continuumId);
}

/**
 * Look up a pole label (word) for a given continuum id and side.
 * Returns undefined if the continuum id is unknown.
 */
export function getCorePoleLabel(continuumId: string, side: CorePoleSide): CorePole | undefined {
  const c = CONTINUUM_BY_ID.get(continuumId);
  if (!c) return undefined;
  return side === 'virtue' ? c.virtue : c.vice;
}

/** All Core continuum ids, in canonical order. */
export const CORE_CONTINUUM_IDS: readonly string[] = CORE_CONTINUA.map((c) => c.continuumId);

/**
 * A per-agent Core position: one 0–1 scalar per continuum (0.5 neutral, virtue
 * 1.0, vice 0.0). Stored at `node.properties.coreProfile`, kept entirely
 * separate from `axiologicalProfile` (reach) and `domainCapabilities`
 * (capability). A partial map is valid — absent continuums read as neutral.
 */
export type CoreProfile = Partial<Record<string, number>>;
