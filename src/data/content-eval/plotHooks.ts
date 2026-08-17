/**
 * The Plot-Hook Draw — rollable story seeds for the factory's brief. THR-1147.
 *
 * Plan: `Docs/plans/2026-08-16-consequence-palette-expansion.md` § Other tables.
 * Director direction, 2026-08-16: *"it could be good to have a story seed table
 * with all our inspiration that the encounter writing agent could roll on to
 * take one of the plot hooks as a starting point, again to ensure we get
 * variety."*
 *
 * **What this is for.** The consequence draw (THR-1145) fixed the *back* of the
 * encounter — what happens to you when it ends. This fixes the *front*: what the
 * encounter is about in the first place. Left to invent a premise, an author
 * reaches for the nearest one, and the corpus converges on roadside trouble and
 * shrine errands. So the brief rolls {@link PLOT_HOOK_DRAW_COUNT} hooks from the
 * project's own inspiration corpus and the author takes one, or blends two.
 *
 * **A starting point, never a contract.** The gate checks that the brief
 * *recorded* a roll; nothing checks that the finished encounter still resembles
 * the hook it started from. Creative drift is the point of a starting point — a
 * hook that survives contact unchanged is a coincidence, not a requirement. This
 * is the one hard difference from the consequence draw, whose hand *is* binding,
 * and it is why this module ships no template field and no `check:encounter`
 * rule: there is nothing about a finished encounter a machine could honestly
 * compare against a premise.
 *
 * **Reuse damping is the variety guarantee, mechanically.** Every hook carries
 * `usedBy` — the templates that started from it. Weight decays by
 * {@link PLOT_HOOK_REUSE_DAMPING} per use, so a well-used hook keeps appearing,
 * just rarely, and the long tail of never-drawn archetypes gets its turn. Decay
 * rather than exclusion, because a good hook is worth a second encounter under a
 * different reach — it is habit that needs correcting, not repetition.
 *
 * **Pure and authoring-time.** No graph, no fs, no runtime. Nothing under
 * `src/engine/**` imports it, exactly as with the rest of `content-eval/`.
 */

import type { ReachDomain } from '../../types/traits';
import { drawFromTable } from './drawTable';

// ─── Constants (NFP #1 — every magic number is named) ────────────────

/** Table id, mixed into the seed so this draw is independent of the consequence draw. */
export const PLOT_HOOK_TABLE_ID = 'plot_hook';

/**
 * Hooks offered per brief.
 *
 * Three rather than one: a single rolled premise is a straitjacket, and an
 * author handed one hook they cannot use will quietly write something else and
 * record the roll anyway. Three is enough to choose from and blend, and few
 * enough that the choice is still constrained.
 */
export const PLOT_HOOK_DRAW_COUNT = 3;

/** Weight of a hook in a reach it carries no affinity for. */
export const PLOT_HOOK_BASE_WEIGHT = 1;

/**
 * Weight of a hook in a reach it is tagged for.
 *
 * The floor above is deliberately non-zero, on the same law as the consequence
 * matrix: any hook can surface in any reach. A siege read through `heart` is a
 * different and better encounter than a siege read through `iron`, and a table
 * that forbade it would produce eight rigid genres — the convergence problem one
 * level up.
 */
export const PLOT_HOOK_AFFINITY_WEIGHT = 6;

/**
 * Weight multiplier applied once per recorded use.
 *
 * At 0.45 a twice-used hook sits near a fifth of its original weight — still
 * eligible, rarely drawn. Never zero: an excluded hook could not come back when
 * the corpus grew around it, and `drawFromTable` treats a zero weight as absent
 * from the table entirely.
 */
export const PLOT_HOOK_REUSE_DAMPING = 0.45;

// ─── Themes ──────────────────────────────────────────────────────────

/**
 * The theme vocabulary, closed on purpose.
 *
 * A free-text tag field would drift into forty synonyms within a year and make
 * coverage unmeasurable — the failure the batch report exists to catch. Adding a
 * theme is a deliberate edit here.
 */
export type PlotHookTheme =
  | 'protection'
  | 'betrayal'
  | 'discovery'
  | 'power'
  | 'scarcity'
  | 'faith'
  | 'craft'
  | 'journey'
  | 'bargain'
  | 'transformation'
  | 'conflict'
  | 'justice';

/** Canonical order, so a printed roll reads identically wherever it appears. */
export const PLOT_HOOK_THEMES: readonly PlotHookTheme[] = [
  'protection',
  'betrayal',
  'discovery',
  'power',
  'scarcity',
  'faith',
  'craft',
  'journey',
  'bargain',
  'transformation',
  'conflict',
  'justice',
];

// ─── The hook ────────────────────────────────────────────────────────

/** One rollable story seed. */
export interface PlotHook {
  /** Stable id. Recorded on the brief; never rewritten once shipped. */
  readonly id: string;
  /**
   * The number this hook carried in the authoring-era catalog, where known.
   *
   * Only four are knowable — see {@link PLOT_HOOK_NUMBERING_NOTE}.
   */
  readonly catalogNumber?: number;
  /** The premise, in one line, in the register an author can start writing from. */
  readonly hook: string;
  readonly themes: readonly PlotHookTheme[];
  /** Reaches this hook naturally suits. Empty is legal and means "equally any". */
  readonly reaches: readonly ReachDomain[];
  /** Where it came from — a vault page, a shipped encounter, an unshipped draft. */
  readonly source: string;
  /**
   * Template ids that started from this hook. Drives {@link PLOT_HOOK_REUSE_DAMPING}.
   *
   * Stamped by hand as encounters ship, because the hook is not a contract and
   * so leaves no machine-readable trace on the finished template. A missing
   * stamp costs variety, not correctness — the hook simply stays likelier than
   * it deserves — which is the right failure direction for a hand-maintained
   * field.
   */
  readonly usedBy: readonly string[];
}

/**
 * What became of the numbered `Hook #NNN` catalog.
 *
 * `vertical-slice.ts` cites `Hook #204`–`#207`, so a numbered list existed in the
 * THR-883 authoring session. It is **not in the repository, the Obsidian vault,
 * or any plan doc** — searched 2026-08-17 across all three named sources: `Hook #`
 * appears only in the slice's own headers, the THR-1078 records that removed the
 * citations from player-facing prose, and the plan text commissioning this
 * ticket; the vault holds no numbered hook list under `Archetypes/` or
 * `Brainstorms/`; no `Docs/plans/` doc carries one. It was most likely a chat
 * artifact of that session and is gone.
 *
 * So the numbering is preserved where it is *knowable* — the four hooks the slice
 * names, mapped by their encounter titles — and nothing is invented for the rest.
 * A fabricated #1–#200 would be worse than an absence: it would read as recovered
 * provenance.
 */
export const PLOT_HOOK_NUMBERING_NOTE =
  'The numbered Hook #NNN catalog is lost; #204–#207 are recovered from '
  + 'vertical-slice.ts headers. Unnumbered hooks never had a number.';

// ─── The catalog ─────────────────────────────────────────────────────

/**
 * The inspiration corpus, made rollable.
 *
 * Sourced from the three places the ticket names: the Obsidian `Archetypes/`
 * folder (the Adventure & Quest, Event and Ordeal pages — the project's curated
 * Malazan/Mystara-derived catalog), the four recoverable numbered hooks, and the
 * one encounter draft that never shipped.
 *
 * Each `hook` is compressed to the premise and the pressure, not the archetype's
 * full essay: what an author needs at brief time is a situation with a fork in
 * it. The vault page stays the long form — `source` is the way back to it.
 */
export const PLOT_HOOKS: readonly PlotHook[] = [
  // ── Recovered numbered hooks (vertical-slice.ts headers) ──────────
  {
    id: 'hook.swindled_family',
    catalogNumber: 204,
    hook: 'A family has been cheated of everything by someone still nearby, and asks for help they cannot pay for.',
    themes: ['justice', 'protection'],
    reaches: ['heart', 'gold'],
    source: 'Hook #204 — vertical-slice.ts (The Swindled Family)',
    usedBy: ['encounter.slice.swindled_family'],
  },
  {
    id: 'hook.unsafe_crossing',
    catalogNumber: 205,
    hook: 'The only crossing is failing under its own weight, and the people behind you are still coming.',
    themes: ['protection', 'journey'],
    reaches: ['iron', 'stone'],
    source: 'Hook #205 — vertical-slice.ts (The Unsafe Bridge)',
    usedBy: ['encounter.slice.unsafe_bridge'],
  },
  {
    id: 'hook.stranger_bargain',
    catalogNumber: 206,
    hook: 'A stranger at a waypoint offers exactly what you need, on terms they will not fully explain.',
    themes: ['bargain', 'betrayal'],
    reaches: ['shadow', 'gold'],
    source: 'Hook #206 — vertical-slice.ts (A Bargain at the Crossroads)',
    usedBy: ['encounter.slice.bargain_at_crossroads'],
  },
  {
    id: 'hook.followed_on_the_road',
    catalogNumber: 207,
    hook: 'Someone has been behind you for two days, matching your pace, and has not yet closed the distance.',
    themes: ['conflict', 'discovery'],
    reaches: ['eye', 'shadow'],
    source: 'Hook #207 — vertical-slice.ts (Riders Behind the Caravan)',
    usedBy: ['encounter.slice.riders_behind_caravan'],
  },

  // ── Adventure & Quest archetypes (vault) ──────────────────────────
  {
    id: 'hook.desperate_escort',
    hook: 'Someone who must survive the journey cannot make it alone, and every hour of travel is an hour the pursuit gains.',
    themes: ['protection', 'journey'],
    reaches: ['iron', 'heart'],
    source: 'vault: Archetypes/Adventure & Quest — Desperate Escort Mission',
    usedBy: [],
  },
  {
    id: 'hook.heresy_hunt',
    hook: 'An authority has named someone a heretic and expects the sentence carried out; the accused may be innocent, right, or genuinely dangerous.',
    themes: ['faith', 'justice'],
    reaches: ['veil', 'iron'],
    source: 'vault: Archetypes/Adventure & Quest — Heresy Hunt',
    usedBy: [],
  },
  {
    id: 'hook.siege_and_hold',
    hook: 'A position must be held against a force that can afford to wait, with supplies and morale both running down.',
    themes: ['protection', 'scarcity'],
    reaches: ['iron', 'stone'],
    source: 'vault: Archetypes/Adventure & Quest — Siege and Hold',
    usedBy: [],
  },
  {
    id: 'hook.rivals_challenge',
    hook: 'A rival issues a public challenge — blade, wits, or trial — where refusing costs as much as losing.',
    themes: ['conflict', 'power'],
    reaches: ['iron', 'heart'],
    source: 'vault: Archetypes/Adventure & Quest — Rival\'s Challenge',
    usedBy: [],
  },
  {
    id: 'hook.monster_eradication',
    hook: 'Something is taking people from the outlying settlements, and nobody agrees on what it is.',
    themes: ['protection', 'discovery'],
    reaches: ['iron', 'eye'],
    source: 'vault: Archetypes/Adventure & Quest — Monster Eradication',
    usedBy: [],
  },
  {
    id: 'hook.broken_alliance',
    hook: 'Two powers that were allied are no longer, over something neither will say aloud, and the border is where it shows.',
    themes: ['betrayal', 'conflict'],
    reaches: ['gold', 'heart'],
    source: 'vault: Archetypes/Adventure & Quest — Broken Alliance',
    usedBy: [],
  },
  {
    id: 'hook.artifact_recovery',
    hook: 'Something powerful is loose in the world and several parties are already looking for it.',
    themes: ['power', 'discovery'],
    reaches: ['gold', 'eye'],
    source: 'vault: Archetypes/Adventure & Quest — Artifact Recovery',
    usedBy: [],
  },
  {
    id: 'hook.prophetic_investigation',
    hook: 'A prophecy is circulating and nobody can agree whether it has already begun.',
    themes: ['faith', 'discovery'],
    reaches: ['star', 'eye'],
    source: 'vault: Archetypes/Adventure & Quest — Prophetic Investigation',
    usedBy: [],
  },
  {
    id: 'hook.civil_unrest',
    hook: 'A settlement is coming apart — the grievance is real, and so is the damage being done in its name.',
    themes: ['justice', 'conflict'],
    reaches: ['heart', 'iron'],
    source: 'vault: Archetypes/Adventure & Quest — Civil Unrest',
    usedBy: [],
  },
  {
    id: 'hook.sacred_crime',
    hook: 'The thing that would help most is forbidden, and the prohibition is not arbitrary.',
    themes: ['faith', 'bargain'],
    reaches: ['veil', 'shadow'],
    source: 'vault: Archetypes/Adventure & Quest — Sacred Crime',
    usedBy: [],
  },
  {
    id: 'hook.lost_civilization',
    hook: 'A place built by people nobody remembers is open again, intact enough to be dangerous and rich enough to be worth it.',
    themes: ['discovery', 'craft'],
    reaches: ['eye', 'stone'],
    source: 'vault: Archetypes/Adventure & Quest — The Lost Civilization Expedition',
    usedBy: [],
  },
  {
    id: 'hook.haunted_relic',
    hook: 'What you came for is here, and so is whatever has been keeping everyone else from leaving with it.',
    themes: ['discovery', 'faith'],
    reaches: ['veil', 'shadow'],
    source: 'vault: Archetypes/Adventure & Quest — The Haunted Relic Recovery',
    usedBy: [],
  },
  {
    id: 'hook.mad_artificer',
    hook: 'Someone brilliant has been building things out here for years, unsupervised, and the results are wandering.',
    themes: ['craft', 'discovery'],
    reaches: ['stone', 'eye'],
    source: 'vault: Archetypes/Adventure & Quest — The Mad Artificer Stronghold',
    usedBy: [],
  },
  {
    id: 'hook.underground_city',
    hook: 'Below the known settlement is another one, older, with its own politics and no interest in yours.',
    themes: ['discovery', 'power'],
    reaches: ['shadow', 'stone'],
    source: 'vault: Archetypes/Adventure & Quest — The Underground City Intrigue',
    usedBy: [],
  },
  {
    id: 'hook.stronghold_raid',
    hook: 'The enemy holds a fixed position that must be entered, learned, and left before the garrison understands what happened.',
    themes: ['conflict', 'discovery'],
    reaches: ['shadow', 'iron'],
    source: 'vault: Archetypes/Adventure & Quest — The Enemy Stronghold Raid',
    usedBy: [],
  },
  {
    id: 'hook.compassionate_liberation',
    hook: 'Something is imprisoned for good reason and is suffering for it, and the suffering is the part you cannot stop looking at.',
    themes: ['justice', 'faith'],
    reaches: ['heart', 'veil'],
    source: 'vault: Archetypes/Adventure & Quest — The Compassionate Liberation',
    usedBy: [],
  },
  {
    id: 'hook.deck_reading_gone_wrong',
    hook: 'A divination was performed correctly and something on the other side noticed.',
    themes: ['faith', 'discovery'],
    reaches: ['star', 'veil'],
    source: 'vault: Archetypes/Adventure & Quest — The Deck Reading Gone Wrong',
    usedBy: [],
  },

  // ── Event archetypes (vault) ──────────────────────────────────────
  {
    id: 'hook.assassination_succeeded',
    hook: 'The figure everyone organized around is dead, the killer is unaccounted for, and the succession has already started.',
    themes: ['power', 'betrayal'],
    reaches: ['shadow', 'gold'],
    source: 'vault: Archetypes/Event — Assassination Succeeded',
    usedBy: [],
  },
  {
    id: 'hook.scarcity_crisis',
    hook: 'There is not enough, there will not be enough, and the rationing is where the community decides what it is.',
    themes: ['scarcity', 'justice'],
    reaches: ['heart', 'gold'],
    source: 'vault: Archetypes/Event — Plague/Famine',
    usedBy: [],
  },
  {
    id: 'hook.celestial_sign',
    hook: 'Something impossible happened in front of witnesses, and the interpretations are already hardening into factions.',
    themes: ['faith', 'discovery'],
    reaches: ['veil', 'star'],
    source: 'vault: Archetypes/Event — Miracle/Celestial Sign',
    usedBy: [],
  },
  {
    id: 'hook.natural_disaster',
    hook: 'The ground or the weather has taken the settlement apart, and what is left has to be dug out before dark.',
    themes: ['scarcity', 'protection'],
    reaches: ['stone', 'iron'],
    source: 'vault: Archetypes/Event — Natural Disaster',
    usedBy: [],
  },
  {
    id: 'hook.unlikely_alliance',
    hook: 'Two parties who have hurt each other must cooperate now, and the cooperation is tactical, not forgiven.',
    themes: ['conflict', 'bargain'],
    reaches: ['heart', 'gold'],
    source: 'vault: Archetypes/Event — Unlikely Alliance',
    usedBy: [],
  },
  {
    id: 'hook.succession_crisis',
    hook: 'A seat is empty, several people can make a real case for it, and each is assembling more than an argument.',
    themes: ['power', 'conflict'],
    reaches: ['gold', 'iron'],
    source: 'vault: Archetypes/Event — Succession Crisis',
    usedBy: [],
  },
  {
    id: 'hook.betrayal_revealed',
    hook: 'Someone trusted has been working against the household all along, and every past kindness now reads differently.',
    themes: ['betrayal', 'discovery'],
    reaches: ['heart', 'shadow'],
    source: 'vault: Archetypes/Event — Betrayal Revealed',
    usedBy: [],
  },
  {
    id: 'hook.dangerous_truth',
    hook: 'A record has surfaced that contradicts the founding story everyone here organizes their life around.',
    themes: ['discovery', 'power'],
    reaches: ['eye', 'shadow'],
    source: 'vault: Archetypes/Event — Discovery / The Scholar\'s Dangerous Discovery',
    usedBy: [],
  },
  {
    id: 'hook.apotheosis',
    hook: 'Someone who was mortal last season is no longer, and nobody has decided yet what is owed to them.',
    themes: ['transformation', 'power'],
    reaches: ['star', 'veil'],
    source: 'vault: Archetypes/Event — Apotheosis',
    usedBy: [],
  },
  {
    id: 'hook.reconciliation',
    hook: 'Two sides that should still hate each other have agreed to stop, and the people who lost family to the war were not consulted.',
    themes: ['justice', 'betrayal'],
    reaches: ['heart', 'veil'],
    source: 'vault: Archetypes/Event — Reconciliation',
    usedBy: [],
  },
  {
    id: 'hook.trade_war',
    hook: 'Two houses are strangling each other over a route, and the settlements along it are running out of things they used to buy.',
    themes: ['scarcity', 'conflict'],
    reaches: ['gold', 'heart'],
    source: 'vault: Archetypes/Event — The Trade War',
    usedBy: [],
  },
  {
    id: 'hook.oath_breaking_scandal',
    hook: 'A sworn oath was broken in public, and in this culture that costs both the breaker and the one who accepted the oath.',
    themes: ['betrayal', 'justice'],
    reaches: ['veil', 'heart'],
    source: 'vault: Archetypes/Event — The Oath-Breaking Scandal',
    usedBy: [],
  },
  {
    id: 'hook.blame_falls_on_outsiders',
    hook: 'Sickness came with the season and the settlement has settled on who brought it, on no evidence.',
    themes: ['scarcity', 'justice'],
    reaches: ['heart', 'eye'],
    source: 'vault: Archetypes/Event — The Seasonal Plague',
    usedBy: [],
  },
  {
    id: 'hook.stronghold_mobilization',
    hook: 'A fortress is provisioning for a march, and the direction it is provisioning for is here.',
    themes: ['conflict', 'power'],
    reaches: ['iron', 'gold'],
    source: 'vault: Archetypes/Event — The Stronghold Mobilization',
    usedBy: [],
  },
  {
    id: 'hook.relic_awakening',
    hook: 'Something that has been quiet for generations has started doing what it was made to do.',
    themes: ['power', 'transformation'],
    reaches: ['veil', 'star'],
    source: 'vault: Archetypes/Event — The Relic Awakening',
    usedBy: [],
  },
  {
    id: 'hook.home_becomes_dangerous',
    hook: 'The trouble is not out on the road this time; it is in the streets the traveler grew up on.',
    themes: ['protection', 'conflict'],
    reaches: ['heart', 'shadow'],
    source: 'vault: Archetypes/Event — Hot Night in the Old Town',
    usedBy: [],
  },
  {
    id: 'hook.the_convergence',
    hook: 'Too much power has accumulated in one place and everything capable of noticing is now travelling toward it.',
    themes: ['power', 'journey'],
    reaches: ['star', 'veil'],
    source: 'vault: Archetypes/Event — The Convergence',
    usedBy: [],
  },
  {
    id: 'hook.gods_fall',
    hook: 'A god is gone, and every institution that ran on that god\'s authority woke up this morning without it.',
    themes: ['faith', 'power'],
    reaches: ['veil', 'star'],
    source: 'vault: Archetypes/Event — The God\'s Fall',
    usedBy: [],
  },
  {
    id: 'hook.market_collapse',
    hook: 'The money stopped meaning anything last week and everyone is finding out what they are actually worth.',
    themes: ['scarcity', 'power'],
    reaches: ['gold', 'heart'],
    source: 'vault: Archetypes/Event — The Market Collapse',
    usedBy: [],
  },
  {
    id: 'hook.harvest_reckoning',
    hook: 'The harvest is in and short, and the settlement is finding out who hoards, who shares, and who takes.',
    themes: ['scarcity', 'justice'],
    reaches: ['stone', 'heart'],
    source: 'vault: Archetypes/Event — The Harvest Reckoning',
    usedBy: [],
  },
  {
    id: 'hook.masterwork_completion',
    hook: 'An artisan has finished something that should not be possible, and people are already arriving to see it.',
    themes: ['craft', 'discovery'],
    reaches: ['stone', 'gold'],
    source: 'vault: Archetypes/Event — The Masterwork Completion',
    usedBy: [],
  },
  {
    id: 'hook.festival_of_fools',
    hook: 'For one day the rules are suspended — servants mock masters, masks permit honesty, and old grudges surface as jokes.',
    themes: ['transformation', 'betrayal'],
    reaches: ['heart', 'shadow'],
    source: 'vault: Archetypes/Event — The Festival of Fools',
    usedBy: [],
  },
  {
    id: 'hook.the_great_building',
    hook: 'A community is pouring itself into building something, and the argument is not how but who decides and whose labor pays.',
    themes: ['craft', 'justice'],
    reaches: ['stone', 'heart'],
    source: 'vault: Archetypes/Event — The Great Building',
    usedBy: [],
  },
  {
    id: 'hook.ritual_of_undeath',
    hook: 'A community has chosen to stop dying rather than accept losing, and is partway through the ritual.',
    themes: ['transformation', 'faith'],
    reaches: ['veil', 'shadow'],
    source: 'vault: Archetypes/Event — The Ritual of Undeath',
    usedBy: [],
  },

  // ── Ordeal archetypes (vault) ─────────────────────────────────────
  {
    id: 'hook.trial_by_combat',
    hook: 'A dispute will be settled by single combat, and the person in the right is not the better fighter.',
    themes: ['justice', 'conflict'],
    reaches: ['iron', 'veil'],
    source: 'vault: Archetypes/Ordeal — Trial by Combat',
    usedBy: [],
  },
  {
    id: 'hook.impossible_heist',
    hook: 'The thing needed is behind guards, locks, and an architecture built specifically to stop this.',
    themes: ['craft', 'discovery'],
    reaches: ['shadow', 'eye'],
    source: 'vault: Archetypes/Ordeal — Impossible Heist',
    usedBy: [],
  },
  {
    id: 'hook.long_road',
    hook: 'The destination is weeks away and the road itself — weather, distance, isolation — is the thing that will decide it.',
    themes: ['journey', 'transformation'],
    reaches: ['star', 'stone'],
    source: 'vault: Archetypes/Ordeal — Pilgrimage/Journey',
    usedBy: [],
  },
  {
    id: 'hook.negotiation_under_pressure',
    hook: 'Two armed parties are talking, the timeline is short, and the wrong sentence starts the fighting.',
    themes: ['bargain', 'conflict'],
    reaches: ['heart', 'gold'],
    source: 'vault: Archetypes/Ordeal — Negotiation Under Pressure',
    usedBy: [],
  },
  {
    id: 'hook.rebuilding_trust',
    hook: 'Someone was failed — deliberately or not — and is standing here again, willing to hear what comes next.',
    themes: ['betrayal', 'transformation'],
    reaches: ['heart', 'veil'],
    source: 'vault: Archetypes/Ordeal — Betrayal & Redemption',
    usedBy: [],
  },
  {
    id: 'hook.descent_into_darkness',
    hook: 'The way on goes down, the light will not last the distance, and what is down there was buried on purpose.',
    themes: ['journey', 'discovery'],
    reaches: ['shadow', 'stone'],
    source: 'vault: Archetypes/Ordeal — Descent Into Darkness',
    usedBy: [],
  },
  {
    id: 'hook.mentors_test',
    hook: 'A teacher has set a test that decides whether the student is finished, and is watching without helping.',
    themes: ['transformation', 'craft'],
    reaches: ['eye', 'heart'],
    source: 'vault: Archetypes/Ordeal — Mentor\'s Test',
    usedBy: [],
  },
  {
    id: 'hook.standing_the_line',
    hook: 'Someone who cannot fight is behind you and the thing coming does not have to stop.',
    themes: ['protection', 'conflict'],
    reaches: ['iron', 'heart'],
    source: 'vault: Archetypes/Ordeal — Defense of the Innocent',
    usedBy: [],
  },
  {
    id: 'hook.impossible_choice',
    hook: 'Two things matter and only one can be kept, and refusing to choose loses both.',
    themes: ['bargain', 'justice'],
    reaches: ['star', 'heart'],
    source: 'vault: Archetypes/Ordeal — Impossible Choice',
    usedBy: [],
  },
  {
    id: 'hook.puzzle_gauntlet',
    hook: 'The way through was built as a test by people who expected to be understood, and it still works.',
    themes: ['craft', 'discovery'],
    reaches: ['eye', 'stone'],
    source: 'vault: Archetypes/Ordeal — The Puzzle Temple Gauntlet',
    usedBy: [],
  },
  {
    id: 'hook.environmental_gauntlet',
    hook: 'The country itself is the threat — cold, distance, or thirst — and everything living here is a secondary problem.',
    themes: ['journey', 'scarcity'],
    reaches: ['stone', 'iron'],
    source: 'vault: Archetypes/Ordeal — The Environmental Gauntlet',
    usedBy: [],
  },
  {
    id: 'hook.political_labyrinth',
    hook: 'Nothing here can be taken directly; it has to be granted, and everyone who can grant it wants something first.',
    themes: ['power', 'bargain'],
    reaches: ['gold', 'eye'],
    source: 'vault: Archetypes/Ordeal — The Political Labyrinth',
    usedBy: [],
  },
  {
    id: 'hook.haunt_resolution',
    hook: 'Something unfinished is keeping a place occupied, and settling it means learning what was done here.',
    themes: ['faith', 'discovery'],
    reaches: ['veil', 'eye'],
    source: 'vault: Archetypes/Ordeal — The Haunt Resolution',
    usedBy: [],
  },
  {
    id: 'hook.grief_absorption',
    hook: 'One person has been carrying the settlement\'s grief so nobody else has to, and is nearly finished.',
    themes: ['protection', 'transformation'],
    reaches: ['heart', 'veil'],
    source: 'vault: Archetypes/Ordeal — The Grief Absorption',
    usedBy: [],
  },
  {
    id: 'hook.endless_pursuit',
    hook: 'A hunt has outlasted the reason for it, and the hunters cannot say what winning would look like.',
    themes: ['journey', 'conflict'],
    reaches: ['star', 'iron'],
    source: 'vault: Archetypes/Ordeal — The Endless Pursuit',
    usedBy: [],
  },
  {
    id: 'hook.shifting_shape',
    hook: 'A shape not one\'s own is available and useful, and each time it is worn a little less comes back.',
    themes: ['transformation', 'power'],
    reaches: ['veil', 'star'],
    source: 'vault: Archetypes/Ordeal — The Veering',
    usedBy: [],
  },
  {
    id: 'hook.impossible_bargain',
    hook: 'Every option on the table costs something irreplaceable, and the terms being offered are honest.',
    themes: ['bargain', 'scarcity'],
    reaches: ['gold', 'shadow'],
    source: 'vault: Archetypes/Ordeal — The Impossible Bargain',
    usedBy: [],
  },
  {
    id: 'hook.forbidden_knowledge_price',
    hook: 'The answer has been found, it is correct, and knowing it cannot be undone.',
    themes: ['discovery', 'transformation'],
    reaches: ['eye', 'shadow'],
    source: 'vault: Archetypes/Ordeal — The Forbidden Knowledge Price',
    usedBy: [],
  },
  {
    id: 'hook.builders_dilemma',
    hook: 'What is being asked for can be built, will outlast the builder, and will be used by people who do not share their values.',
    themes: ['craft', 'bargain'],
    reaches: ['stone', 'gold'],
    source: 'vault: Archetypes/Ordeal — The Builder\'s Dilemma',
    usedBy: [],
  },
  {
    id: 'hook.death_and_return',
    hook: 'Someone died and did not stay dead, and what came back is recognisably them and not quite them.',
    themes: ['transformation', 'faith'],
    reaches: ['veil', 'star'],
    source: 'vault: Archetypes/Ordeal — Unmaking & Resurrection',
    usedBy: [],
  },

  // ── Unshipped drafts ──────────────────────────────────────────────
  {
    id: 'hook.crowd_and_purse',
    hook: 'A crowd is thick enough to work and the purses in it belong to people who will be missed.',
    themes: ['bargain', 'justice'],
    reaches: ['shadow', 'eye'],
    source: 'unshipped draft: Docs/plans/encounters/pick-pocket-skill-test.md',
    usedBy: [],
  },
];

// ─── The draw ────────────────────────────────────────────────────────

/** Hooks by id, for the roll recorder and the CLI. */
const HOOKS_BY_ID: ReadonlyMap<string, PlotHook> = new Map(
  PLOT_HOOKS.map(hook => [hook.id, hook]),
);

/** The hook with this id, or `undefined`. */
export function plotHookById(id: string): PlotHook | undefined {
  return HOOKS_BY_ID.get(id);
}

/**
 * The weight a hook carries for a reach, after reuse damping.
 *
 * Exported because the CLI prints it — an author who can see why a hook was
 * unlikely can tell a cold table from a well-worn hook.
 */
export function plotHookWeight(hook: PlotHook, reach: ReachDomain): number {
  const base = hook.reaches.includes(reach)
    ? PLOT_HOOK_AFFINITY_WEIGHT
    : PLOT_HOOK_BASE_WEIGHT;
  return base * PLOT_HOOK_REUSE_DAMPING ** hook.usedBy.length;
}

/** What the draw needs. The brief has no template id yet, so the seed is its own. */
export interface PlotHookDrawInput {
  /**
   * Stable per-brief string — the slug the brief is filed under, typically.
   *
   * Deliberately not a template id: at brief time the template does not exist,
   * and naming the draw after something that does not exist yet is how a re-roll
   * becomes silent.
   */
  readonly briefSeed: string;
  readonly reach: ReachDomain;
  /** How many to offer. Defaults to {@link PLOT_HOOK_DRAW_COUNT}. */
  readonly count?: number;
}

/**
 * Roll hooks for a brief. Pure, seeded, recomputable from the brief seed.
 *
 * Returned in draw order, unlike the consequence hand: these are *offers*, and
 * the first one being first is information — it is the one the table pushed
 * hardest. Nothing downstream compares the list, so ordering costs nothing.
 */
export function drawPlotHooks(input: PlotHookDrawInput): readonly PlotHook[] {
  const weights: Record<string, number> = {};
  for (const hook of PLOT_HOOKS) {
    weights[hook.id] = plotHookWeight(hook, input.reach);
  }

  const drawn = drawFromTable(
    PLOT_HOOK_TABLE_ID,
    weights,
    input.briefSeed,
    input.count ?? PLOT_HOOK_DRAW_COUNT,
  );

  // Every drawn id came from PLOT_HOOKS, so the lookup cannot miss; the filter
  // is narrowing, not defence.
  return drawn
    .map(id => HOOKS_BY_ID.get(id))
    .filter((hook): hook is PlotHook => hook !== undefined);
}

// ─── Catalog health ──────────────────────────────────────────────────

/**
 * Problems with the catalog itself — duplicate ids, empty fields, unknown themes.
 *
 * The rot class this exists to stop is THR-844's: a table whose entries are
 * quietly unreachable. A duplicate id silently shadows a hook in the id map and
 * makes it undrawable; an empty `reaches` is legal (it means "equally any") but
 * an empty `hook` string is a row that offers an author nothing.
 *
 * Returns human-readable violations, never throws (NFP #4).
 */
export function plotHookCatalogViolations(): readonly string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const hook of PLOT_HOOKS) {
    if (seen.has(hook.id)) {
      problems.push(`duplicate hook id '${hook.id}' — the later row is undrawable`);
    }
    seen.add(hook.id);

    if (!hook.hook.trim()) problems.push(`'${hook.id}' has an empty hook line`);
    if (!hook.source.trim()) problems.push(`'${hook.id}' records no source`);
    if (hook.themes.length === 0) problems.push(`'${hook.id}' carries no theme tag`);

    for (const theme of hook.themes) {
      if (!PLOT_HOOK_THEMES.includes(theme)) {
        problems.push(`'${hook.id}' tags unknown theme '${theme}'`);
      }
    }
  }

  return problems;
}
