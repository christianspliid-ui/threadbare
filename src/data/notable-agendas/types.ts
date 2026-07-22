/**
 * Notable Agenda Family types (THR-630).
 *
 * A notable-agenda family is a four-phase arc authored as content, carried by
 * a prominent unthreaded notable (a seated faction/nation leader) on the
 * shipped THR-225 composition phase runner — the same machinery as the THR-66
 * rival schemes, whose family shape this deliberately mirrors so the two
 * systems never drift apart structurally.
 *
 * Prose is in the plainspoken-Malazan baseline register (THR-609).
 */
import type { SphereName } from '../../types/index';

/**
 * The concrete world-move a phase performs when it activates.
 * Same vocabulary as rival schemes (rumor → materialize → escalate → crack)
 * so the executor logic stays parallel:
 * - `rumor`      — narration only (chronicle beat).
 * - `materialize`— bind a `sponsors_scheme` edge from the notable to the
 *                  target node, push sphere pressure, surface a toast.
 * - `escalate`   — raise sphere pressure (the pressure beat).
 * - `crack`      — terminal payoff: larger sphere push + terminal narration.
 */
export type NotableAgendaMoveKind = 'rumor' | 'materialize' | 'escalate' | 'crack';

/** One phase beat within an agenda family. */
export interface NotableAgendaBeat {
  /** Kebab-case phase id, family-specific (e.g. `whisper`, `declaration`). */
  phaseId: string;
  /** What concrete move fires when this phase activates. */
  move: NotableAgendaMoveKind;
  /**
   * ≥3 attributed prose variants. Placeholders preserved for substitution at
   * launch: `{notable}` (the sponsoring notable's name), `{faction}` (their
   * faction's name), `{target}` (the target node's name).
   */
  proseVariants: string[];
}

/** A notable-agenda family — the authored content unit. */
export interface NotableAgendaFamily {
  /** Stable id, e.g. `claim` | `feud` | `rite` | `succession` | `campaign`. */
  id: string;
  /** Human-readable title for intent-panel cards. */
  label: string;
  /** Sphere lean (flavor + pressure sphere; not a hard gate). */
  sphereLean: SphereName[];
  /**
   * What the family targets:
   * - `location` — a foreign holding (claim) or the notable's own (rite).
   * - `notable`  — another faction's leader (feud).
   * - `none`     — anchors on the sponsoring notable (succession).
   * Families without a resolvable target anchor pressure on the notable.
   */
  targetKind: 'location' | 'own-location' | 'notable' | 'none';
  /** Exactly four beats. */
  beats: [NotableAgendaBeat, NotableAgendaBeat, NotableAgendaBeat, NotableAgendaBeat];
}
