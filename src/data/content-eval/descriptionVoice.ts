/**
 * Designer-voice detector for an encounter's `description`. THR-1739.
 *
 * `UnifiedActionTemplate.description` is **player-facing summary prose**: the
 * Codex entry summary, the story-beat modal, the actions block and the veil's
 * fallback all print it as-is. The encounter factory used to fill it with a
 * design spec instead — *"A two-step master Heart job in a town: … The mortal
 * holds the crowd back … wins the trust of the crowd's speaker … plants a
 * town-watch errand."* — because the package format showed the field with no
 * definition and no gate read it as player text. 44 of the 85 descriptions
 * under `src/data/encounters/` read that way when the ticket was filed.
 *
 * Each marker below names a thing a designer writes and a narrator never
 * does: the encounter's step count, its band, "the mortal"/"the agent", the
 * reward mechanic, a sequel, a content-query tag, a binding sentinel, a Reach
 * or persona label in parentheses. Design notes belong in the package's `doc`
 * block, never in `description`.
 *
 * The list is pinned by `descriptionVoice.test.ts`: widening it is a reviewed
 * diff, and a marker that stops matching its own example fails the test.
 *
 * Scope is encounters only. A divine verb's description legitimately names
 * "the mortal" it targets — it is an intervention tooltip, not scene prose —
 * so `check:encounter` is the only caller.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export interface DesignerVoiceMarker {
  /** Short name printed in the gate line. */
  readonly name: string;
  readonly pattern: RegExp;
  /** A designer-voice phrase this marker must match — the pin test reads it. */
  readonly example: string;
}

const BANDS = '(?:novice|journeyman|expert|master)';
const REACH_OR_PERSONA =
  '(?:Vanguard|Watcher|Puppeteer|Confessor|Archivist|Heretic|Mender|Magnate'
  + '|Iron|Gold|Stone|Heart|Veil|Star|Eye|Shadow)';

export const DESIGNER_VOICE_MARKERS: readonly DesignerVoiceMarker[] = [
  {
    name: 'step count',
    pattern: /\b(?:one|single|two|three|four|five|\d)-step\b/iu,
    example: 'A two-step court summons',
  },
  {
    name: 'band + job/test',
    pattern: new RegExp(`\\b${BANDS}(?:\\s+[\\w'’]+){0,2}\\s+(?:job|test)\\b`, 'iu'),
    example: 'A master Heart job in a town',
  },
  {
    name: 'job/test for a band',
    pattern: new RegExp(`\\b(?:job|test|call)\\s+for\\s+(?:a|an)\\s+${BANDS}\\b`, 'iu'),
    example: 'A Star test for a journeyman',
  },
  {
    name: '"the mortal"',
    pattern: /\bthe mortal\b/iu,
    example: 'The mortal holds the crowd back',
  },
  {
    name: '"the agent"',
    pattern: /\b(?:the|an) agent\b/iu,
    example: "the agent's own goods are locked behind the bar",
  },
  {
    name: 'payoff verb "plants"',
    pattern: /\bplants\b/iu,
    example: 'plants a town-watch errand',
  },
  {
    name: 'payoff verb "earns"',
    pattern: /\bearns\b/iu,
    example: "earns the town's regard",
  },
  {
    name: 'payoff "wins the trust"',
    pattern: /\bwins the trust\b/iu,
    example: "wins the trust of the crowd's speaker",
  },
  {
    name: 'sequel',
    pattern: /\bsequels?\b/iu,
    example: 'a placeless seeded sequel',
  },
  {
    name: 'calls itself an encounter',
    pattern: /\bencounter\b/iu,
    example: 'A regional-scale truth-versus-comfort encounter',
  },
  {
    name: 'missed branch',
    pattern: /\bmissed branch\b/iu,
    example: 'The missed branch of the crossroads appointment',
  },
  {
    name: 'Reach label',
    pattern: /\bReach:/u,
    example: 'Reach: star (Wanderer ↔ Anchor).',
  },
  {
    name: 'content query',
    pattern: /\bby (?:family )?query\b/iu,
    example: 'The prize is drawn by query',
  },
  {
    name: 'content tag',
    pattern: /#[a-z]/u,
    example: 'from the #trade item family',
  },
  {
    name: 'binding sentinel',
    pattern: /\$[a-z]/u,
    example: 'binding $realm for the standing it moves',
  },
  {
    name: 'Reach/persona in parentheses',
    pattern: new RegExp(`\\((?:a |an )?${REACH_OR_PERSONA}\\b`, 'u'),
    example: 'lead the next run (a Vanguard)',
  },
];

/** The markers a description trips, by name. Empty means player prose. */
export function designerVoiceMarkers(description: string): readonly string[] {
  return DESIGNER_VOICE_MARKERS.filter(m => m.pattern.test(description)).map(m => m.name);
}

/** Gate lines for one template — `check:encounter`'s register block reads these. */
export function designerVoiceProblems(template: UnifiedActionTemplate): readonly string[] {
  const description = template.description ?? '';
  if (description.length === 0) return [];
  const hits = designerVoiceMarkers(description);
  if (hits.length === 0) return [];
  return [
    `description reads as designer voice (${hits.join(', ')}) — it is player-facing summary prose; `
      + 'move design notes to the package `doc` block (THR-1739)',
  ];
}
