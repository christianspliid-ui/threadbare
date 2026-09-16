/**
 * The four content kinds THR-1495 chartered into the codex.
 *
 * Slice 2 of THR-1482 measured which `ContentObjectKindId`s the codex actually
 * catalogues and found six with none — so six kinds' content cards rendered without
 * an "open in codex ↗" footer, because Law 25 forbids a control that does nothing.
 * That is one silence covering six different situations, which is the defect: a kind
 * withheld on purpose and a kind nobody got to read the same way.
 *
 * THR-1495 ruled on all six. Four are chartered here; two are withheld, and their
 * rulings live in `SURFACE_BY_CONTENT_KIND` (`src/data/surface-registry.ts`) where
 * the CTA reads them. Re-measured on 2026-09-13 before the ruling — the *predicate*
 * ("a kind whose catalog ids resolve to zero `getAllCodexEntries()` entries") held for
 * the same six, while every count in the original table had moved.
 *
 * **Chartered**
 *
 * - **Legendary artifacts** (3) — into `possessions`, as its own `legendary` group
 *   rather than a tab of three. A plain gap, not a design question: the category
 *   already exists and simply never read `ARTIFACT_TEMPLATES`.
 * - **Companions** (9) — their own category, *not* a group under Possessions. A
 *   companion is a person who walks with a mortal; filing one under things-you-own
 *   would be the game saying something it does not mean.
 * - **Ambitions** (20) — their own category. Undertakings — the *work* — have been
 *   catalogued since THR-1434; an ambition is the *want* the work serves, and
 *   cataloguing one half of a mortal's motives while withholding the other leaves the
 *   vocabulary half-readable.
 * - **Cards** (37) — their own category. This is the deck the player plays from; all
 *   37 members are dealable today (measured), so no card here is one the player can
 *   never hold.
 *
 * **Withheld** (see the registry for the quotable rulings)
 *
 * - **Encounters** (513) — browsing them is reading the answer key. A chapter a mortal
 *   meets has to be met. A chronicle of encounters *already* met is a different
 *   feature, and a good one; it is not this catalog.
 * - **Omens** (44) — a track of signs the world shows before something breaks. A
 *   catalog turns dread into a lookup table.
 *
 * Every entry here follows `undertakingCodex.ts`'s discipline: game words only, never
 * a code id (Law 14), and a kind with no native rarity derives its tier from something
 * the player can feel rather than being stamped with a default.
 */

import type { CodexEntry } from './codexRegistry';
import { conceptRow, contributionConcepts, sphereConcept, type CodexDetail } from './codexConcepts';
import { RARITY_TIER_NAMES, RARITY_TIER_COLORS, clampRarityTier } from '../../types/rarity';
import type { RarityTier } from '../../types/rarity';
import { ARTIFACT_TEMPLATES } from '../../data/artifact-templates';
import { COMPANION_TEMPLATES } from '../../data/companion-templates';
import {
  AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
} from '../../data/ambition-templates';
import type { AmbitionCategory, AmbitionTemplate } from '../../types/ambition';
import {
  NUDGE_CARD_LIBRARY,
  nudgeCardType,
  cardDisplayTitle,
  dealableMembers,
} from '../../data/nudge-card-library';
import type { NudgeCardMember } from '../../data/nudge-card-library';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';
import {
  durationLabel,
  countWord,
  magnitudeWord,
  reachDisplayName,
  type MagnitudeBand,
} from '../../engine/aftermathWords';

// ─── Category and subcategory ids ────────────────────────────────
//
// Exported so the registry's `catDefs` and the sidebar's display vocabulary name the
// same strings this file writes onto entries — a category whose id nothing else spells
// the same way renders an empty tab, which is the one failure mode a hand-kept pair of
// lists has.

export const COMPANION_CATEGORY_ID = 'companions';
export const AMBITION_CATEGORY_ID = 'ambitions';
export const CARD_CATEGORY_ID = 'cards';

/** Legendary artifacts join Possessions under their own rail group. */
export const LEGENDARY_SUBCATEGORY_ID = 'legendary';

/** Companions form one flat list — nine entries do not want a rail. */
export const COMPANION_SUBCATEGORY_ID = 'companion';

/** How a card is come by — the Repertoire's rail groups, in the order a god meets them. */
export const CARD_SUBCATEGORY_IDS = {
  core: 'card_core',
  signature: 'card_signature',
  hunger: 'card_hunger',
  earned: 'card_earned',
} as const;

// ─── Tunables ────────────────────────────────────────────────────

/**
 * Where an ambition's rarity comes from, since the template carries none.
 *
 * An ambition's *reach floors* say how capable a mortal must already be to want it at
 * all — which is the closest thing it has to rarity, and the thing a player can feel:
 * a scattered few can chase the high-floor drives. Banded on the highest single floor.
 *
 * Measured across the 20 templates (2026-09-13), the floors are `0.1 ×6, 0.2 ×3,
 * 0.3 ×5, 0.4 ×6`, so these two marks split the corpus 6 / 8 / 6 rather than piling it
 * into one band — a banding that sorted every entry the same way would be decoration.
 */
export const AMBITION_TIER_FLOORS = { storied: 0.2, mythic: 0.4 } as const;

/**
 * The ladder for a **raw sub-agent capability point** — what a companion lends and what a
 * legendary artifact's standing contribution is worth.
 *
 * **Why this is a third ladder and not one of the Codex's two.** `codexRegistry`'s
 * `CAPABILITY_CONTRIBUTION_BANDS` reads 0–1 sigmoid weights (commanding at `0.50`) and its
 * `REACH_BONUS_BANDS` reads possession bonuses (commanding at `8`). Both corpora here sit on
 * neither scale: measured 2026-09-13, companion contributions are `1 ×8, 2 ×7, 3 ×2` and
 * legendary contributions `1 ×3, 1.5 ×3` — every one of the 20 values would band as
 * *commanding* on the capability ladder and as *faint* on the bonus ladder. A ladder whose
 * whole corpus lands on one rung says nothing, which is the failure `CAPABILITY_CONTRIBUTION_BANDS`
 * documents at its own definition; these marks spread the same corpus across all four rungs.
 *
 * **The scale anchor:** `COMPANION_CONTRIBUTION_RANGE` is `{ min: 1, max: 3 }` and its authoring
 * note fixes agent-scale at 4–16 raw — so 3 is the top of what a thing-beside-you may lend, and
 * the ladder tops out there rather than at an agent's own weight.
 */
export const BESIDE_YOU_CONTRIBUTION_BANDS: readonly MagnitudeBand[] = [
  { min: 3, word: 'commanding' },
  { min: 2, word: 'strong' },
  { min: 1.5, word: 'solid' },
  { min: 0, word: 'slight' },
];

/**
 * A standing contribution in words — the same `edge` / `drag` grammar the Codex's other two
 * ladders use, so the three read as one vocabulary at different scales (UI Law 3).
 */
export function formatBesideYouContributions(contributions: Record<string, number>): string {
  return Object.entries(contributions)
    .map(([domain, value]) => {
      const word = magnitudeWord(value, BESIDE_YOU_CONTRIBUTION_BANDS);
      const reach = reachDisplayName(domain);
      return value >= 0 ? `a ${word} edge in ${reach}` : `a ${word} drag on ${reach}`;
    })
    .join(', ');
}

/** What a card's rarity means here: how many gods ever hold it. */
export const CARD_TIERS = {
  /** Every god holds it from the first hand. */
  core: 1,
  /** Only gods signed by that Sphere. */
  signature: 2,
  /** One hunger's own, and no other god's. */
  hunger: 3,
  /** Not in any opening hand — unlocked in play. */
  earned: 3,
} as const satisfies Record<string, RarityTier>;

// ─── Display vocabularies ────────────────────────────────────────

/**
 * The seven ambition categories in game words, and a mark for each.
 *
 * Total over `AmbitionCategory`, so a category added to the union without a word here
 * is a compile error rather than a raw key in the nav rail (Law 14's miss case, made
 * unreachable instead of merely warned about).
 */
export const AMBITION_CATEGORY_WORDS: Readonly<Record<AmbitionCategory, string>> = {
  dominion: 'Dominion',
  mastery: 'Mastery',
  legacy: 'Legacy',
  survival: 'Survival',
  discovery: 'Discovery',
  devotion: 'Devotion',
  vengeance: 'Vengeance',
};

export const AMBITION_CATEGORY_GLYPHS: Readonly<Record<AmbitionCategory, string>> = {
  dominion: '♔',   // ♔ a crown — to rule
  mastery: '✹',    // ✹ a worked star — the perfected hand
  legacy: '⚜',     // ⚜ a line that outlasts the one who made it
  survival: '⚕',   // ⚕ the staff — to still be here
  discovery: '☼',  // ☼ a sun — what is brought to light
  devotion: '❋',   // ❋ an offering
  vengeance: '†',  // † the debt, paid
};

/** A card's rail group in game words. */
export const CARD_GROUP_WORDS: Readonly<Record<string, string>> = {
  [CARD_SUBCATEGORY_IDS.core]: 'Every God Holds',
  [CARD_SUBCATEGORY_IDS.signature]: 'Sphere Signatures',
  [CARD_SUBCATEGORY_IDS.hunger]: 'Hunger Uniques',
  [CARD_SUBCATEGORY_IDS.earned]: 'Earned In Play',
};

const CARD_GROUP_GLYPHS: Readonly<Record<string, string>> = {
  [CARD_SUBCATEGORY_IDS.core]: '❖',      // ❖
  [CARD_SUBCATEGORY_IDS.signature]: '✦', // ✦
  [CARD_SUBCATEGORY_IDS.hunger]: '☽',    // ☽
  [CARD_SUBCATEGORY_IDS.earned]: '✧',    // ✧
};

/** A legendary artifact's mark — a star ringed, for the three that are one of a kind. */
const LEGENDARY_GLYPH = '✪'; // ✪

/** A companion's mark — one who walks beside, the same pawn the undertaking grid uses. */
const COMPANION_GLYPH = '♟'; // ♟

/**
 * `LossCondition` in game words.
 *
 * Deliberately not a `Record<LossCondition, string>`: the corpus carries values from
 * more than one authoring era, and an unlisted one falls to the plain-English default
 * below rather than failing the build for a catalog this section only reads.
 */
const LOSS_WORDS: Readonly<Record<string, string>> = {
  permanent: 'Stays until a story takes them',
  cursed: 'Cannot be put down',
  temporary: 'Fades on its own',
  conditional: 'Held only while its terms hold',
};

/** A Sphere key in its display form — the Codex capitalises these everywhere (Law 14). */
function sphereWord(sphere: string): string {
  return sphere.charAt(0).toUpperCase() + sphere.slice(1);
}

const LOSS_DEFAULT = 'Held until something takes it';

function lossWord(loss: string | undefined): string {
  return loss ? (LOSS_WORDS[loss] ?? LOSS_DEFAULT) : LOSS_DEFAULT;
}

// ─── Legendary artifacts → Possessions ───────────────────────────

/**
 * What a legendary artifact *is*, said in the game's own words.
 *
 * The three templates carry no prose field — they are effect graphs — so the summary is
 * derived from the two halves a player can feel: the standing capability it lends, and
 * the workings it can be made to perform. `activatedEffects[].name` is authored,
 * player-facing text ("Found Legendary Forge"); the effect *types* underneath are code
 * ids and never reach the panel.
 */
function legendarySummary(template: (typeof ARTIFACT_TEMPLATES)[number]): string {
  const parts: string[] = [];
  const contributions = template.effects.find(
    (e): e is Extract<typeof e, { type: 'stat_contribution' }> => e.type === 'stat_contribution',
  );
  if (contributions && Object.keys(contributions.contributions).length > 0) {
    parts.push(`Lends ${formatBesideYouContributions(contributions.contributions as Record<string, number>)}.`);
  }
  const powers = (template.activatedEffects ?? []).map(p => p.name).filter(Boolean);
  if (powers.length > 0) {
    parts.push(
      powers.length === 1
        ? `Can be made to work ${powers[0]}.`
        : `Can be made to work ${powers.slice(0, -1).join(', ')} or ${powers[powers.length - 1]}.`,
    );
  }
  return parts.join(' ');
}

/** One entry per legendary artifact — three, each its own thing, none of them a trinket. */
export function buildLegendaryCodexEntries(): CodexEntry[] {
  return ARTIFACT_TEMPLATES.map(template => {
    const tier = clampRarityTier(template.tier);
    const powers = (template.activatedEffects ?? []).map(p => p.name).filter(Boolean);
    return {
      id: template.id,
      name: template.name,
      glyph: LEGENDARY_GLYPH,
      tier,
      tierName: RARITY_TIER_NAMES[tier],
      tierColor: RARITY_TIER_COLORS[tier],
      category: 'possessions',
      subcategory: LEGENDARY_SUBCATEGORY_ID,
      subtitle: `Legendary · ${RARITY_TIER_NAMES[tier]}`,
      summary: legendarySummary(template),
      tags: template.tags ?? [],
      details: [
        { label: 'Tier', value: RARITY_TIER_NAMES[tier] },
        { label: 'Holding it', value: lossWord(template.lossCondition) },
        {
          label: 'Workings',
          value: powers.length > 0 ? powers.join(' · ') : 'None it can be made to perform',
        },
        { label: 'One of a kind', value: 'Yes — only one may exist in a world' },
      ],
    };
  });
}

// ─── Companions ──────────────────────────────────────────────────

/**
 * The join sentence with its `{name}` slot filled by the profession.
 *
 * A template is the profession, not the person — the instance gets a generated name —
 * so the codex has no name to put here. Filling the slot with the profession shows the
 * player the *shape* of the sentence they will meet, which is honest; leaving `{name}`
 * raw would show them an authoring placeholder, which is not.
 */
function genericJoinSentence(profession: string, sentence: string): string {
  return sentence.replace(/\{name\}/g, `The ${profession.toLowerCase()}`);
}

/** One entry per companion profession. */
export function buildCompanionCodexEntries(): CodexEntry[] {
  return COMPANION_TEMPLATES.map(template => {
    const tier = clampRarityTier(template.tier);
    const contributions = formatBesideYouContributions(
      template.domainContributions as Record<string, number>,
    );
    return {
      id: template.id,
      name: template.profession,
      glyph: COMPANION_GLYPH,
      tier,
      tierName: RARITY_TIER_NAMES[tier],
      tierColor: RARITY_TIER_COLORS[tier],
      category: COMPANION_CATEGORY_ID,
      subcategory: COMPANION_SUBCATEGORY_ID,
      subtitle: template.unique
        ? `${RARITY_TIER_NAMES[tier]} · One of a kind`
        : RARITY_TIER_NAMES[tier],
      summary: template.goodFor,
      flavorText: genericJoinSentence(template.profession, template.joinSentence),
      tags: template.tags,
      details: [
        // The reach words hover (THR-1507) — declared from the same record the phrase was
        // banded from, through the same `reachDisplayName`, so span and text cannot drift.
        conceptRow(
          'What they are good for',
          contributions || 'Company, and little else',
          contributionConcepts(template.domainContributions as Record<string, number>, reachDisplayName),
        ),
        { label: 'Tier', value: RARITY_TIER_NAMES[tier] },
        {
          label: 'How long they stay',
          value:
            template.durationTicks != null
              ? `Contracted — ${durationLabel(template.durationTicks)}`
              : lossWord(template.lossCondition),
        },
        {
          label: 'One of a kind',
          value: template.unique ? 'Yes — one in a world, granted by name' : 'No — met by chance',
        },
      ],
    };
  });
}

// ─── Ambitions ───────────────────────────────────────────────────

const ALL_AMBITION_TEMPLATES: readonly AmbitionTemplate[] = [
  ...AMBITION_TEMPLATES,
  ...GRIEVANCE_AMBITION_TEMPLATES,
  ...EVENT_MINTED_AMBITION_TEMPLATES,
];

/** The highest single reach floor, banded — see {@link AMBITION_TIER_FLOORS}. */
export function ambitionTier(template: AmbitionTemplate): RarityTier {
  const floors = Object.values(template.reachFloors);
  const highest = floors.length > 0 ? Math.max(...floors) : 0;
  if (highest >= AMBITION_TIER_FLOORS.mythic) return 3;
  if (highest >= AMBITION_TIER_FLOORS.storied) return 2;
  return 1;
}

/** What finishing it takes, as a sentence. */
function completionWords(template: AmbitionTemplate): string {
  const { requires, of } = template.completion;
  if (of === 0) return 'Nothing marks it done';
  if (requires >= of) return `All ${countWord(of)} of its marks`;
  return `${countWord(requires).charAt(0).toUpperCase()}${countWord(requires).slice(1)} of its ${countWord(of)} marks`;
}

/** One entry per ambition — what a mortal wants, and what chasing it looks like. */
export function buildAmbitionCodexEntries(): CodexEntry[] {
  return ALL_AMBITION_TEMPLATES.map(template => {
    const tier = ambitionTier(template);
    const categoryWord = AMBITION_CATEGORY_WORDS[template.category];
    const marks = template.milestones.map(m => m.prose[0]).filter(Boolean);
    return {
      id: template.id,
      name: template.displayName,
      glyph: AMBITION_CATEGORY_GLYPHS[template.category],
      tier,
      tierName: RARITY_TIER_NAMES[tier],
      tierColor: RARITY_TIER_COLORS[tier],
      category: AMBITION_CATEGORY_ID,
      subcategory: template.category,
      subtitle: `${categoryWord} · ${RARITY_TIER_NAMES[tier]}`,
      // The prose a mortal's taking-it-up is narrated with — the game's own voice for
      // the want, rather than a description written about it from outside.
      summary: template.selectionProse[0] ?? '',
      flavorText: template.selectionProse[1],
      // Sphere keys are stored lower-case and must not reach a chip that way (Law 14) —
      // the same resolution the Codex's own `SPHERE_DISPLAY` does for every other section.
      tags: [categoryWord, ...template.sphereAffinities.map(sphereWord)],
      details: [
        { label: 'The kind of want', value: categoryWord },
        {
          label: 'Who reaches for it',
          value:
            tier === 3
              ? 'Only the already-formidable'
              : tier === 2
                ? 'Those who have made a start'
                : 'Anyone who wants it enough',
        },
        { label: 'What finishes it', value: completionWords(template) },
        {
          label: 'The marks along the way',
          value: marks.length > 0 ? marks.join(' · ') : 'None the chronicle records',
        },
      ],
    };
  });
}

// ─── Nudge cards — The Repertoire ────────────────────────────────

/** Which rail group a member belongs to, by how a god comes to hold it. */
export function cardGroup(member: NudgeCardMember): string {
  if (member.hunger) return CARD_SUBCATEGORY_IDS.hunger;
  if (member.sphere) return CARD_SUBCATEGORY_IDS.signature;
  if (!member.unlock || member.unlock.kind === 'starting') return CARD_SUBCATEGORY_IDS.core;
  return CARD_SUBCATEGORY_IDS.earned;
}

const CARD_GROUP_TIERS: Readonly<Record<string, RarityTier>> = {
  [CARD_SUBCATEGORY_IDS.core]: CARD_TIERS.core,
  [CARD_SUBCATEGORY_IDS.signature]: CARD_TIERS.signature,
  [CARD_SUBCATEGORY_IDS.hunger]: CARD_TIERS.hunger,
  [CARD_SUBCATEGORY_IDS.earned]: CARD_TIERS.earned,
};

function hungerWord(id: string): string {
  return HUNGER_CATALOG.find(h => h.id === id)?.name ?? id;
}

/**
 * How this card is come by, as a row — the Sphere it names hovers (THR-1507). A hunger has
 * no registry entry, so that sentence declares nothing and paints plain rather than dead.
 */
function howHeldRow(member: NudgeCardMember): CodexDetail {
  const label = 'How you hold it';
  if (member.hunger) return { label, value: `The ${hungerWord(member.hunger)} hunger's own` };
  if (member.sphere) {
    const word = sphereWord(member.sphere);
    return conceptRow(label, `Signed by ${word} — held by gods of that Sphere`, [sphereConcept(member.sphere, word)]);
  }
  if (!member.unlock || member.unlock.kind === 'starting') return { label, value: 'In every god’s first hand' };
  if (member.unlock.kind === 'sphere_attunement') {
    const word = sphereWord(member.unlock.sphere);
    return conceptRow(label, `Earned by practice in ${word}`, [sphereConcept(member.unlock.sphere, word)]);
  }
  return { label, value: 'Earned in play' };
}

/**
 * One entry per card in the library.
 *
 * Every one of the 37 members is dealable today (a play profile and at least one band
 * fragment — measured 2026-09-13), so this catalog holds no card a god can never play.
 * Should that stop being true, {@link undealableCardIds} names the ones that slipped,
 * and they are still catalogued: a card the library declares and the dealer refuses is
 * a defect to surface, not a row to hide.
 */
export function buildCardCodexEntries(): CodexEntry[] {
  return NUDGE_CARD_LIBRARY.map(member => {
    const group = cardGroup(member);
    const tier = CARD_GROUP_TIERS[group] ?? 1;
    const type = nudgeCardType(member.typeId);
    return {
      id: member.id,
      name: cardDisplayTitle(member),
      glyph: CARD_GROUP_GLYPHS[group] ?? '❖',
      tier,
      tierName: RARITY_TIER_NAMES[tier],
      tierColor: RARITY_TIER_COLORS[tier],
      category: CARD_CATEGORY_ID,
      subcategory: group,
      subtitle: `${type?.keyword ?? cardDisplayTitle(member)} · ${CARD_GROUP_WORDS[group]}`,
      // What the card does, and the question it puts to the player — the two lines the
      // type table was authored to carry. `hostSystem` is a designer's word for where
      // the effect is wired and stays off the panel (Law 14).
      summary: type?.effectShape ?? '',
      flavorText: type?.decision,
      tags: [type?.keyword ?? member.typeId, ...(member.sphere ? [sphereWord(member.sphere)] : [])],
      details: [
        { label: 'Keyword', value: type?.keyword ?? member.typeId },
        { label: 'What it does', value: type?.effectShape ?? 'Unwritten' },
        { label: 'The decision', value: type?.decision ?? 'Unwritten' },
        howHeldRow(member),
      ],
    };
  });
}

/** Library members the dealer would refuse. Empty is the measured, asserted state. */
export function undealableCardIds(): string[] {
  const dealable = new Set(dealableMembers().map(m => m.id));
  return NUDGE_CARD_LIBRARY.filter(m => !dealable.has(m.id)).map(m => m.id);
}

// ─── The section ─────────────────────────────────────────────────

/** Every entry the four chartered kinds contribute, in catalog order. */
export function buildCharteredKindCodexEntries(): CodexEntry[] {
  return [
    ...buildLegendaryCodexEntries(),
    ...buildCompanionCodexEntries(),
    ...buildAmbitionCodexEntries(),
    ...buildCardCodexEntries(),
  ];
}

/**
 * Codex coverage per content kind, measured live.
 *
 * The predicate `SURFACE_BY_CONTENT_KIND`'s doc table is a dated reading of — probing every
 * catalog id of every kind against the built codex. THR-688 rule A is the reason this exists
 * as a function: the 2026-09-12 table's counts had all moved by 2026-09-13 while the
 * *predicate* picked out exactly the same kinds, so a count in a comment is a thing that rots
 * and a probe is not. `surfaceRegistry.test.ts` asserts each row's `sheet` against this.
 *
 * Imported lazily inside the function: this module is part of the codex build, and the
 * content-object registry imports the surface registry, so a top-level import would tie two
 * layers together for a diagnostic that only a test and a script ever call.
 */
export async function contentKindCodexCoverage(): Promise<
  Record<string, { ids: number; inCodex: number; categories: string[] }>
> {
  const [{ CONTENT_OBJECT_KINDS }, { entriesOfKind }, { getAllCodexEntries }] = await Promise.all([
    import('../../data/content-objects'),
    import('../../data/contentCatalogs'),
    import('./codexRegistry'),
  ]);
  const codex = getAllCodexEntries();
  const categoryById = new Map(codex.map(e => [e.id, e.category]));
  const out: Record<string, { ids: number; inCodex: number; categories: string[] }> = {};
  for (const kind of CONTENT_OBJECT_KINDS) {
    const ids = entriesOfKind(kind.id).map(e => e.id);
    const categories = new Set<string>();
    let inCodex = 0;
    for (const id of ids) {
      const category = categoryById.get(id);
      if (category === undefined) continue;
      inCodex++;
      categories.add(category);
    }
    out[kind.id] = { ids: ids.length, inCodex, categories: [...categories].sort() };
  }
  return out;
}

/** The section's census — what a verification run compares to the catalogs. */
export function charteredKindCensus(): Record<string, number> {
  return {
    legendary: buildLegendaryCodexEntries().length,
    companions: buildCompanionCodexEntries().length,
    ambitions: buildAmbitionCodexEntries().length,
    cards: buildCardCodexEntries().length,
    undealableCards: undealableCardIds().length,
  };
}
