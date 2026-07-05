/**
 * Rival Scheme Family types (THR-66).
 *
 * A scheme family is a four-phase arc (rumor → materialization → response →
 * crack) authored as content. At launch, `phaseRivalActions` builds a THR-225
 * `Composition`'s `Phase[]` from a family and hands it to the shipped phase
 * runner; the runner advances phases on world-flags, and `phaseRivalActions`
 * executes each phase's concrete *move* when the runner activates it.
 *
 * Prose is in the plainspoken-Malazan baseline register (THR-609): rival
 * menace reads better plain; lyricism is rationed to the crack beat.
 */
import type { RivalBehavior } from '../../types/rival';
import type { SphereName } from '../../types/index';

/**
 * The concrete world-move a phase performs when it activates.
 * - `rumor`      — narration only (chronicle beat); optional detection read.
 * - `materialize`— the counter-play surface: bind a `sponsors_scheme` edge to a
 *                  target location, push sphere pressure, emit an attributed toast.
 * - `escalate`   — raise sphere pressure + rival hostility (the "response" beat).
 * - `crack`      — terminal payoff: large sphere push + terminal narration.
 */
export type RivalSchemeMoveKind = 'rumor' | 'materialize' | 'escalate' | 'crack';

/** One phase beat within a scheme family. */
export interface RivalSchemeBeat {
  /** Kebab-case phase id (`rumor`, `materialize`, `respond`, `crack`). */
  phaseId: string;
  /** What concrete move fires when this phase activates. */
  move: RivalSchemeMoveKind;
  /** Narrative register for the Chronicle entry (baseline plain unless the crack beat). */
  voice: 'divine' | 'mortal';
  /**
   * ≥3 attributed prose variants. Placeholders preserved for enrichment:
   * `{rival}` (the sponsoring rival's name), `{location}` / `{target}` (the target
   * location's name). One variant is picked seeded at launch and baked into the
   * phase rationale so the runner's Chronicle entry is attributed.
   */
  proseVariants: string[];
}

/** A rival scheme family — the authored content unit. */
export interface RivalSchemeFamily {
  /** Stable id, e.g. `corruptive` | `territorial`. */
  id: string;
  /** Human-readable title for the RivalPanel scheme card. */
  label: string;
  /** Behaviors this family is eligible for. */
  eligibleBehaviors: RivalBehavior[];
  /** Sphere lean (flavor + prose bias; not a hard gate). */
  sphereLean: SphereName[];
  /** Minimum escalation tier a rival must reach to launch this family. */
  minTier: number;
  /** Whether this family needs a target location node (materialize/crack need one). */
  requiresTarget: boolean;
  /** Exactly four beats: rumor → materialization → response → crack. */
  beats: [RivalSchemeBeat, RivalSchemeBeat, RivalSchemeBeat, RivalSchemeBeat];
}
