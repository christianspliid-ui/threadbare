/**
 * The undertaking grid's curated half (THR-1392 slice 4; Christian, 2026-09-03:
 * "keep this map of undertakings up to date as we develop and name them, so we do not
 * miss out on opportunities of connecting undertakings to the different parts of the
 * world graph").
 *
 * The grid is every world-object kind × every undertaking verb variant. Its LIVE cells
 * come from the registry (`src/data/undertaking-objects.ts`) — a declared semantic is a
 * live cell, nothing here can claim one. What this file holds is the rest, and it is
 * held to totality by `generate-undertaking-grid --check`:
 *
 *   - every LIVE cell carries a `LIVE_CELL_NOTES` sentence (what it does, on which op,
 *     which old templates it absorbs) — a new semantic without one fails the build, so
 *     a cell cannot be added without being named on the map. A live cell may also
 *     record what it still `owes`: a consequence Christian decided it should have that
 *     no reader delivers yet (the write-what-nobody-reads finding, THR-1400);
 *   - every cell that is NOT live carries a disposition: `wanted` (decided yes — the
 *     note names the operation the cell needs), `later` (decided, waiting on a named
 *     precondition), `open` (the model admits it, nobody has decided) or `no` (not an
 *     object of undertakings, with the reason);
 *   - a disposition on a cell the registry now declares is stale and fails — the map
 *     cannot say "wanted" or "open" about something that shipped.
 *
 * A kind listed in `NOT_AN_OBJECT` needs no per-verb row: every verb is `no` for the
 * one stated reason. Adding a world-object kind (THR-1394's one-PR rule) therefore
 * means either a `NOT_AN_OBJECT` reason or a full row here — the generator fails by
 * name either way, which is the mechanism that keeps the map from drifting.
 *
 * The `wanted` / `later` verdicts below were decided by Christian in chat on
 * 2026-09-03 (THR-1397, the grilling ticket of the map THR-1396), band by band: yield
 * and leverage, ownership of people-things, the dormant kinds, then his three forks —
 * killing a mortal, cursing someone, usurping a leader. The resolution comment on
 * THR-1397 is the primary source; this file is the grid's memory of it.
 */
import type { WorldObjectKindId } from '../src/data/world-objects';
import type { UndertakingVerbVariant } from '../src/types/strategicAction';
import { SECRET_CELL_IDS } from '../src/data/intention-reading-constants';

/**
 * Cells whose intention is a secret (THR-1433): the god reads them only through a
 * followed mortal's mark or a followed network, never by familiarity. The list lives
 * beside the predicate that reads it (`src/data/intention-reading-constants.ts`) and
 * is re-exported here so the grid renders it and the generator holds it to the live
 * cells — a secret cell that is not a live cell is a stale entry.
 */
export { SECRET_CELL_IDS };

export type CellDispositionStatus = 'wanted' | 'later' | 'open' | 'no';

export interface CellDisposition {
  readonly status: CellDispositionStatus;
  readonly note: string;
  /** Who decided, when — present on every `wanted` / `later` cell. */
  readonly decided?: string;
  /**
   * What will read this cell's product (THR-1428). Required on every `wanted` cell:
   * a cell ships with its reader, and a wanted cell whose product no phase or surface
   * reads is not built until one does. The generator fails by name on an empty reader.
   */
  readonly reader?: string;
}

export interface LiveCellNote {
  /** The graph operation(s) the cell rides, by name. */
  readonly op: string;
  readonly note: string;
  /** Old authored templates this cell absorbs or retires (informational). */
  readonly retires?: readonly string[];
  /** A consequence the cell was decided to have that nothing reads yet (THR-1397). */
  readonly owes?: string;
  /** What reads this cell's product, once something does (THR-1428). Replaces `owes`. */
  readonly readBy?: string;
}

/** The grilling that decided every `wanted` / `later` cell below. */
export const DECIDED_THR_1397 = 'THR-1397, Christian in chat, 2026-09-03';

/** Open: the model admits the cell and nobody has decided. Unused since THR-1397 emptied the column; kept for the next kind that arrives. */
export const O = (note: string): CellDisposition => ({ status: 'open', note });
const N = (note: string): CellDisposition => ({ status: 'no', note });
const W = (note: string, reader?: string): CellDisposition => ({ status: 'wanted', note, decided: DECIDED_THR_1397, reader });
const L = (note: string): CellDisposition => ({ status: 'later', note, decided: DECIDED_THR_1397 });

/**
 * Rules Christian set during the grilling that bind every cell rather than one —
 * rendered on the grid so a cell's designer reads them before the cell.
 */
export const STANDING_RIDERS: readonly string[] = [
  'A completed undertaking grows capability in the Reach it leaned on — a successful work means the mortal learned something (Christian, 2026-09-03). Every cell, not only observe.',
  'Wealth — the 0–100 score every mortal and faction already carries (`src/engine/wealth.ts`) — appears on the mortal sheet and the faction view as a banded word before any yield cell ships: an aftermath may only move what the player can inspect.',
  'Holding a thing yields passively at a trickle the economy phase pays (a seized route\'s toll, a controlled Location\'s tithe — the unpaid `WEALTH_*_INCOME` constants); use × Location is the active harvest on top of it.',
];

/** Kinds that are not objects of undertakings at all, with the one reason. */
export const NOT_AN_OBJECT: Readonly<Partial<Record<WorldObjectKindId, string>>> = {
  hex: 'Terrain. Work happens at a Location on the hex; surveying is the Area\'s cell.',
  ascendant: 'The player, and rivals: not a thing a mortal\'s work is aimed at; progression is the beat system.',
  god: 'Dormant kind; not a thing a mortal\'s work is aimed at.',
  culture: 'A people. Spreading faith improves a Location or a Standing, not a culture.',
  battle: 'The war system\'s own; an engine detail kept as an actor node so participants can take part.',
  holding: 'The product of claim and seize, never their object; destroying the held thing razes it.',
  legendary_artifact: 'Minted by worldgen with its own trait graph; bonded through quests (encounters), not made or unmade by work. Wielding one is its bonded trait graph.',
  trait: 'Definitions; the per-bearer state that work changes is the Condition row. Capability growth is its own system.',
  undertaking: 'It is the work; an undertaking on an undertaking is recursion.',
  event: 'A record.',
  journey: 'The doom clock\'s; a record.',
  divine_receipt: 'A record.',
  sphere: 'An axis, not an object.',
  reach: 'An axis, not an object.',
  action_template: 'Content.',
  encounter_template: 'Content.',
  cosmology_node: 'Dormant node type.',
  sublocation_node: 'Legacy reader shape.',
};

const OBSERVE_READ_BY = 'The Intelligence & familiarity layer: the survey writes `knows_of` familiarity (`seedKnowsOf`), which the ruins layer\'s clue convergence and the agent sheet\'s **Knows the way to** row both read. A critical success doubles into a `knows_secret_of` mark about someone there, which the leverage economy presses. The `strategicIntelligence` write is kept, additive. (THR-1428 R1.)';

/** What each LIVE cell does — required for every semantic the registry declares. */
export const LIVE_CELL_NOTES: Readonly<Partial<Record<WorldObjectKindId, Partial<Record<UndertakingVerbVariant, LiveCellNote>>>>> = {
  area: {
    observe: { op: 'record_intelligence', note: 'Walk the unmapped: the old exploration templates become one observe cell whose object is the area.', retires: ['walk_the_unmapped', 'mount_expedition'], readBy: `${OBSERVE_READ_BY} On an unmapped area it may also mint a treasure map (\`mintTreasureMap\`, the chart parameter of create × Item) — the treasure hunt's first step.` },
  },
  location: {
    create: { op: 'create_location', note: 'A settlement-class Location at the site\'s hex with founding prosperity; the subtype is the parameter (a hamlet, a camp).', retires: ['found_settlement'] },
    'change:raise': { op: 'modify_location_property (+)', note: 'Prosperity by default; the old property changes are this cell with the property as a parameter. Reaches every class.', retires: ['grow_settlement', 'fortify_defenses', 'fortify_position', 'organize_festival', 'consecrate_site', 'preach_masses'] },
    'change:lower': { op: 'modify_location_property (−)', note: 'Sabotage: the same op with a negative delta, motive-gated against another\'s Location. A plague on a town is this cell, not create × Condition.' },
    'control:claim': { op: 'claim_control (mode)', note: 'Establishing control is the sustained claim_control mode — upkeep, degradation, collapse — never a one-tick completion. Any class.', readBy: 'The `holding_income` phase (`src/engine/holdingIncome.ts`): a controlled Location tithes its holder every `HOLDING_INCOME_INTERVAL_TICKS`, scaled by the town\'s prosperity, through `applyWealthDelta` and the `wealth_delta` trace — surfaced as the **Means** word on the sheet. The `armySupply` misread is fixed too: `hasReliefLine` filters `controls` sources to faction-typed actors. (THR-1428 R3, R5.)' },
    'control:seize': { op: 'transfer_holding', note: 'Another\'s Location changes hands; motive-gated, holding_seized harm.' },
    destroy: { op: 'ruin_settlement', note: 'The prosperity floor plus the ruins subtype the battle aftermath already reads — not a deletion. Settlement and stronghold classes; ruining a wonder or a deposit is refused.', readBy: 'The Ruins & Delves layer: the cell stamps `ruinMagnitude` banded from what the settlement was, and `delveVariant`\'s admission scan admits a `ruins` Location once `ruinedTick + RUINED_SETTLEMENT_DELVE_DECAY_TICKS` has passed — a warlord\'s destruction feeds a wanderer\'s delve three days later. The located-clue requirement is unchanged. (THR-1428 R2.)' },
    observe: { op: 'record_intelligence', note: 'Learn a Location: its holders, its stocks, its Places.', retires: ['scout_settlement'], readBy: `${OBSERVE_READ_BY} On a ruin or wonder class it also spawns a clue (\`spawnClue\`) — the treasure hunt: observe a ruin → clue → treasure map → delve → claim × Item.` },
  },
  place: {
    create: { op: 'create_sublocation', note: 'A Place inside a Location; the type is the parameter the ambition supplies — a merchant founds a warehouse, a zealot a shrine.', retires: ['build_granary', 'build_warehouse', 'civic_construction', 'consecrate_holy_site', 'establish_dynasty_seat', 'establish_garrison', 'establish_research_circle', 'found_guild_chapter', 'found_shrine', 'organize_patronage'] },
    'control:claim': { op: 'grant_holding', note: 'A freehold on an unheld Place.' },
    'control:seize': { op: 'transfer_holding', note: 'Another\'s Place changes hands; motive-gated.' },
    destroy: { op: 'raze_holding', note: 'The Place is razed: its holding face and the node go.' },
    observe: { op: 'record_intelligence', note: 'What a Place holds and who keeps it.', readBy: OBSERVE_READ_BY },
  },
  route: {
    create: { op: 'create_trade_route', note: 'A trade lane between the durable origin and the far end; both must stand.', retires: ['establish_trade_route'] },
    'change:lower': { op: 'blockade_route', note: 'A blockade: the route suspended, not deleted — the trade phases already honour it. The hostile verb on a route; there is no destroy.', retires: ['disrupt_trade_route'] },
    use: { op: 'conduct_trade', note: 'Trading along one\'s own route — the catalog op, anchored at the near end.', retires: ['conduct_trade'] },
    'control:claim': { op: 'grant_holding', note: 'A freehold on an unheld route\'s identity node.' },
    'control:seize': { op: 'transfer_holding + tax_trade_route', note: 'Another\'s route changes hands and the seizer starts tolling it; motive-gated.', retires: ['tax_trade_route'], readBy: 'The `holding_income` phase: the seizer is paid `WEALTH_ROUTE_CONTROL_INCOME × max(1, round(volume × taxRate))` every `HOLDING_INCOME_INTERVAL_TICKS`. A threatened route or one nobody uses pays nothing — control you cannot enforce collects nothing. (THR-1428 R3.)' },
    observe: { op: 'record_intelligence', note: 'Charting a route: its ends, its traffic, who taxes it.', readBy: OBSERVE_READ_BY },
  },
  faction: {
    create: { op: 'found_faction', note: 'A mortal founds an order — a chapter, a cult, a company of arms — with the default seed unless an override names one.', retires: ['found_faction'] },
    destroy: { op: 'plant_schism', note: 'A schism the world resolves in its own phase. Also the third outcome of a failed usurpation (seize × Faction).', retires: ['plant_schism'] },
    observe: { op: 'record_intelligence', note: 'Intelligence on a faction: its leader, its holdings, its rivals.', readBy: OBSERVE_READ_BY },
  },
  company: {
    create: { op: 'raise_warband', note: 'A company raised from the cast bound during the work.', retires: ['raise_warband'] },
    'change:raise': { op: 'reinforce_group', note: 'The roster grows.', retires: ['reinforce_warband'] },
    destroy: { op: 'disband_group', note: 'Disbanded; the node persists as history.', retires: ['disband_warband'] },
  },
  army: {
    create: { op: 'raise_warhost', note: 'A mortal commander raises an army for their faction — the op the divine lane reaches, as a work.' },
    'change:raise': { op: 'reinforce_group', note: 'The same reinforce the company uses; an army is a company kind.' },
    destroy: { op: 'disband_group', note: 'Stand the army down.' },
  },
  network: {
    create: { op: 'found_ring', note: 'Founding a ring (THR-1430) — `createGroup` stamped with the network kind, the cell that wakes the dormant kind. Members are the bound `recruit` cast first, then co-located ungrouped mortals who share the founder\'s faction or lean Shadow, up to `RING_TARGET_MEMBER_COUNT`. A ring is founded somewhere and then stops caring where it is.', readBy: 'The group layer, which since THR-1430 enumerates networks alongside companies (`GROUP_PHASE_KINDS`) for upkeep, cohesion and dissolution and gates only the movement sub-step (`GROUP_KINDS_THAT_TRAVEL`) — so a ring frays and dies like a company but never travels; the sheet\'s group line; and the ring\'s own `use` cell below.' },
    'change:raise': { op: 'reinforce_group', note: 'Recruiting into the ring — the live op, which since THR-1430 admits the network kind and draws candidates from anyone within `RING_REACH_HEXES` of *any* member rather than only where the leader stands. That is what lets a ring grow across a region.', readBy: 'The same group-roster readers as founding it — roster size is what the ring\'s use cell multiplies against, and `ringMemberInReachOf` walks the roster on every run.' },
    use: { op: 'run_ring', note: 'Running the ring (THR-1430): each completion does what one observe would against a target the ring has members near — the ring is the multiplier on a verb already decided. A place-kind target takes the THR-1428 observe readers with the leader as the knower; a mortal target takes `mintLeverageMark`. Writes nothing into Stealth, hidden marks or detection pressure: mortal surveillance is not the god\'s fingerprints (THR-1397). `seize × Agreement` joins as a third product when the yield band ships, with no other change here.', readBy: 'Whatever the multiplied verb\'s own reader is: a ring observe writes the `knows_of` familiarity and clues the THR-1428 R1 readers write, read by encounter awareness and the sheet\'s Knows-the-way-to row; a ring on a mortal writes the `knows_secret_of` edge the leverage economy presses. The `ring_run` trace names which member\'s position qualified the target.' },
    destroy: { op: 'disband_group', note: 'Roll up the ring.' },
  },
  mortal: {
    destroy: { op: 'plot_death', note: 'The plot (THR-1430) — a premeditated killing, never the duel (an encounter seeded off a quarrel, `destroy × Standing`) or the slaying (a battle, a delve). Motive-gated harder than any other cell: `PLOT_MOTIVES` admits only `grudge` and `faction_war`, so opportunism never licenses a killing. The death goes through the one funnel `markMortalDead` in `retain` mode — it writes `deceased`, `deceasedTick`, `deathCause` and `slainBy` and never removes the node, so the dead stay in the chronicle and their echoes survive. The heaviest harm class (`named_death`) is registered, so the vendetta may be minted; whether anyone *saw* it is THR-1383\'s rule and not this cell\'s. When the target is a mortal the player holds a thread to, a `peril` moment interrupts before the strike resolves and the strike defers `PLOT_PERIL_GRACE_TICKS`, so the god has a turn to spend on levers that already exist. Retires the crude `action.shadow.assassinate`, which deleted the node. **A secret** (THR-1433, `SECRET_CELL_IDS`): the plotter\'s intention is read only through a followed mortal\'s mark or a followed network — knowing a man well does not tell you he is planning a murder; his enemy\'s spy does.', retires: ['action.shadow.assassinate'], readBy: 'The agent lifecycle\'s own readers of `deceased` (`isAgentGone`, every group query, `reconcileLostMembers`); the succession phase, which since THR-1430 reads `deceased` on a seat-holder so a killed leader vacates the seat on the next pass; the grievance funnel in `ambitionTick`, which reads the `named_death` outcome node and the seen-rule to decide the vendetta; and the sheet\'s death header, which names the cause word and — only where a mark or a culprit-provenance hostile edge exists — by whom.' },
  },
  companion: {
    create: { op: 'mint_companion', note: 'Recruit a companion — the op the aftermath effects reach, as a work.' },
    destroy: { op: 'remove_companion', note: 'Send a companion away, or — motive-gated against another\'s — turn them.' },
  },
  item: {
    create: { op: 'mint_masterwork', note: 'A masterwork where the maker stands; a chart is the same cell with the kind as a parameter.', retires: ['craft_masterwork'] },
    'control:seize': { op: 'seize_item', note: 'The possesses edge moves; motive-gated.' },
    destroy: { op: 'destroy_item', note: 'The bearer edges, then the node.' },
  },
  power: {
    create: { op: 'learn_spell', note: 'A scholar learns a spell — the first writer of `knows_spell`, and the cell that gave the Power kind the node shape the world-object registry deferred (THR-1429): one shared `spell`-subcategory trait definition per template, minted at seeding, per-bearer state on the edge. Known is unlimited (the biography); wielded is a `has_trait` edge to the same node under `SLOT_CAPS.spell`, so learning past the cap is known-and-not-carried rather than a refusal. Caster gate: a spell-weaver mastery trait, a caster `npcRole`, or Veil at `LEARN_SPELL_CASTER_VEIL_FLOOR` (raw 0–100).', readBy: 'use × Power enumerates wielded powers of either class and casts through `activateSpell`; the sheet\'s attachments strand shows the class word and a Knows row for what is learned and not carried; `__DEBUG.getPowers` and CLI `agent` report known / wielded / sealed.' },
    destroy: { op: 'seal_power', note: 'Sealing a rival\'s art (THR-1429): the catalog\'s existing Null-Touched (`reward_condition_null_touched`) minted on the bearer with `sign: \'seal\'`, motive-gated by verb. The power is **not** removed — it stays known and wielded and simply will not answer, which is what makes curing the condition the counter-play. Two catalog edits, no new entry: the `#curse` tag, and `suppress.ticks` aligned to `SEAL_POWER_SUPPRESS_TICKS`.', readBy: '`use × Power` refuses `power_suppressed` through `isSpellSuppressedFor`, which reads the **bearer\'s own conditions** — a spell definition node is shared by every mortal who learned it, so a per-node flag would seal the whole world at once. `destroy × Condition` (curing) lifts it early; the Sealed badge on the sheet reads the same predicate.' },
    use: { op: 'activate_spell', note: 'Casting: the spell op, its costs and its backlash. Since THR-1429 the Power kind is live and this casts either class — a bestowal a god gave, or a spell the mortal learned. A power that names no spell template is refused.', readBy: 'Both costs land now: the cell refuses with `spell_exhausted` while `exhaustedUntilTick` is ahead of the tick, and the soul-price leaves the `doom` health meter to become a `QuintessenceEvent` on `pendingQuintessenceEvents`, consumed by `phaseQuintessence` where the threshold gates already bite. `health_sacrifice` still writes `doom` — that cost genuinely is health. (THR-1428 R4.) Since THR-1429 it also refuses `power_suppressed` while a seal holds.' },
  },
  condition: {
    create: { op: 'inflict_condition', note: 'One **signed** cell (THR-1429), and the first in the game whose object is made against a person. The sign is read at proposal from the actor\'s relation to the target and is itself the gate: self or an ally (same faction, same company, or standing ≥ `CONDITION_ALLY_STANDING_MIN`) is a blessing from the `#blessing` pool, un-gated; a mortal the actor holds a motive against is a curse from the `#curse` pool with a band-scaled duration; a stranger is refused `no_sign`. There is deliberately no neutral third outcome. Op: the catalog\'s own `instantiateReward` mint, with `sign` and `inflictedBy` added to the bearer\'s edge.', readBy: '`conditionDecay` runs the duration; `effectPredicates` / `graphConditions` gate eligibility on what is worn; the encounter walkers shape tests around it; a curse registers `afflicted` harm through `UNDERTAKING_MINTING_RULES`, so the cursed may come to want vengeance against a *seen* culprit; and `destroy × Condition` — the cure, already live — is the counter-play.' },
    destroy: { op: 'cure_condition', note: 'Curing: the removal funnel the expiry phase uses, taken as work — a healer\'s undertaking. The counter-play to the curse (create × Condition), and since THR-1429 the way a sealed power is freed early.' },
  },
  agreement: {
    create: { op: 'mint_leverage_mark', note: 'Digging up a secret: a mark on the mortal the work was done about.' },
    use: { op: 'press_the_mark', note: 'Pressing a mark is the self-spend the kind row called a use. Spending a favour owed is the same cell on the favour class (the favour is minted by use × Standing).', retires: ['press_the_mark'] },
    destroy: { op: 'expose_mark', note: 'Exposing a mark: the edge stays, revealed, and loses its leverage. Forgiving a favour is the same cell on the favour class.' },
  },
  standing: {
    'change:raise': { op: 'apply_reputation_with_delta (+)', note: 'Cultivating one\'s own standing with a person, a faction or a place.' },
    'change:lower': { op: 'apply_reputation_with_delta (−)', note: 'Smearing another\'s standing — the same op, signed — motive-gated.' },
    destroy: { op: 'create_relation_edge hostile_to', note: 'A quarrel: the standing broken and a hostile_to edge standing in its place — motive-gated. The seed of a duel, which is an encounter, never a work.' },
  },
};

// ─── The reader column of the subsystem × verb view (THR-1427) ──────────────

/** One subsystem that consumes what another's live cells leave behind, and the sites that do it. */
export interface SubsystemReader {
  /** A `SUBSYSTEM_NAMES` member — the generator fails by name on anything else. */
  readonly subsystem: string;
  /** The engine sites, by module (and line where the audit pinned one). */
  readonly sites: string;
}

/**
 * Who reads what each LIVE-TOUCHED subsystem's cells leave behind — the curated half of
 * the subsystem × verb view, transcribed from the wayfinder research
 * (`Docs/audits/2026-09-03-undertaking-systems-coverage-research.md` § 1, column 5).
 *
 * Keyed by the *written* subsystem (the `owningSystem` of the kind the cell acts on);
 * each entry names the *reading* subsystems. Held to totality by the generator: a
 * LIVE-TOUCHED subsystem with no entry fails, an entry on a subsystem that is not
 * LIVE-TOUCHED is stale and fails, and a key or a `subsystem` the registry does not have
 * fails — the same three-way contract the cell dispositions carry.
 *
 * **An empty array is a finding, not an omission.** It renders as "nothing reads this",
 * because a lever with no consequence is exactly what this view is for. The per-cell
 * version of the same finding is the `owes` field above, which the grid already renders.
 *
 * Two deliberate exclusions, so nothing plausible ships as data: sites the audit lists
 * without a subsystem that claims them (`mentorshipOutcomes.ts`, `binding/binder.ts`,
 * `binding/remoteAnchor.ts`) are left out rather than attributed by guess; and the
 * untouched-by-design / gap split (audit § 3) is deliberately absent — that verdict is
 * THR-1401's question for Christian, not this generator's to render.
 */
/** Why a mortal's own work never moves a subsystem (THR-1401, filed by THR-1431). */
export interface UntouchedByDesign {
  readonly subsystem: string;
  readonly reason: string;
}

/**
 * The subsystems a mortal's own work is **not meant** to reach, each with its reason
 * (decided by Christian on THR-1401, 2026-09-07).
 *
 * Held to totality in both directions by `generate-undertaking-grid`, the same
 * discipline the cell dispositions carry: an UNTOUCHED subsystem missing from this list
 * fails by name, and an entry for a subsystem the three-way join now reaches fails as
 * stale. The second half is the one that matters — without it a reason would quietly
 * outlive the gap it explains, and the map would keep asserting "by design" about
 * something a cell started moving three months ago.
 *
 * A subsystem is UNTOUCHED only when none of the three joins reaches it: it owns no
 * kind a live cell acts on, no live cell's operation lives in its modules, and it reads
 * nothing a live cell leaves. Most of these are the god's own half of the game — the
 * divine economy, the mandate, the doom clock — which mortals move only by being acted
 * *upon*, never by their own undertakings.
 */
export const UNTOUCHED_BY_DESIGN: readonly UntouchedByDesign[] = [
  {
    subsystem: 'Rival Gods & Schemes',
    reason: 'The god\'s peers, not the world\'s people. A rival\'s scheme is run by a rival ascendant against the player and advances on its own phase; a mortal has no verb that reaches it, and giving one would let a farmer\'s season interrupt a god\'s plot. Mortals feel a scheme as the encounters and pressures it produces — that is the whole of their contact with it.',
  },
  {
    subsystem: 'Essence & Divine Economy',
    reason: 'Essence is the god\'s currency and the divine receipt is the god\'s ledger. Mortals neither earn nor spend it — a mortal who could move the essence economy by working would be a second god, which is the one thing the ascendant fantasy cannot share.',
  },
  {
    subsystem: 'Culture',
    reason: 'Culture is a property of regions and peoples that worldgen seeds and long drift moves, on a timescale no single undertaking reaches. One mortal\'s work changes what a culture *holds* — its prosperity, its holdings, its factions — never the culture itself. A verb that let one person edit a people would make the slowest layer in the game the most volatile.',
  },
  {
    subsystem: 'Stealth, Detection & Hidden Marks',
    reason: 'These are the god\'s fingerprints: the layer exists to track how visible the *player\'s* interventions are, and detection pressure is the cost of a god acting through a mortal. Decided on THR-1397 (and restated by THR-1430): mortal surveillance never feeds it — a spy watching a rival is the Intelligence layer\'s business, and routing it here would charge the god for work they did not do.',
  },
  {
    subsystem: 'Ascendant Beats & Progression',
    reason: 'The god\'s own arc — remembrance, the beats, the journey the player climbs. A mortal\'s undertaking cannot advance it, because the beats measure what the *player* has done; mortals supply the occasions a beat fires on, never the progression itself.',
  },
];

/**
 * The omen agenda reads what every harm-carrying cell leaves (THR-1432). One reader,
 * shared by every LIVE-TOUCHED subsystem whose destroy, seize or lower cell registers a
 * harm: the `undertaking_outcome` node the completion writes becomes a portent within
 * `OMEN_UNDERTAKING_LOOKBACK_TICKS`, weighted by the harm and by whether the god follows
 * the hand or the victim. Declared once so the ten rows cannot drift apart.
 */
const OMEN_PORTENT_READER: SubsystemReader = {
  subsystem: 'Omens & Atmospheric Pressure',
  sites: '`phaseOmenAgenda.ts castUndertakingPortent` (THR-1432) — the `undertaking_outcome` node a harm-carrying completion leaves becomes an emitted omen within `OMEN_UNDERTAKING_LOOKBACK_TICKS`, weighted by `OMEN_UNDERTAKING_WEIGHT_BY_HARM` and by attention (a followed culprit\'s or victim\'s work first); the chronicle carries the line and the encounter scorer feels the pressure',
};

export const SUBSYSTEM_READERS: Readonly<Record<string, readonly SubsystemReader[]>> = {
  'World Generation, Terrain & Places': [
    OMEN_PORTENT_READER,
    { subsystem: 'Mortal Economy & Prosperity', sites: '`phaseProsperity.ts`, `phaseSettlementPromotion.ts`, `phases/resourceStockTiers.ts`, `phaseUnrest.ts` — the prosperity a founded, raised, lowered or ruined Location carries' },
    { subsystem: 'Strategic Projects & Control', sites: '`phaseStrategicProjects.ts` (degradation, neglect), `strategicTelemetry.ts`, `strategicPresentation.ts`, `HexMapV2/scene/StrategicMarkerMesh.ts` — the `controls` edge claim × Location writes' },
    { subsystem: 'Movement & Colocation', sites: '`sublocation.ts:592-636 checkDissolutions` (a `permanent` built Place survives), `socialEncounterGeneration.ts` (`sublocationTypeId`), `distanceMatrix.ts` (structural rebuild)' },
    { subsystem: 'War, Armies & Battles', sites: '`battleAftermath.ts:150,163` skips the `ruins` subtype; `armySupply.ts:204` reads the first incoming `controls` source **as the faction** — a mortal claimant is misread as an army\'s provisioning faction (a type confusion, not a design)' },
    { subsystem: 'Factions & Succession', sites: '`notableAgendas.ts:233,269` (`ruins`)' },
    { subsystem: 'Mandate', sites: '`phaseMandate.ts:34` lists `ruins` among the mandate-relevant subtypes' },
    { subsystem: 'Doom Clock & Journey', sites: '`journeyEngine.ts:142` counts the First\'s `controls` edges as `locationsControlled`' },
    { subsystem: 'Attachments, Items & Possessions', sites: '`holdings.ts` — the `owns` edge and holding face that claim / seize / raze × Place move' },
    { subsystem: 'Encounters & Dilemmas', sites: '`encounterScoring.ts` (`prosperity`)' },
  ],
  'Mortal Economy & Prosperity': [
    OMEN_PORTENT_READER,
    { subsystem: 'Mortal Economy & Prosperity', sites: '`phaseTradeRouteDecay.ts:92` (`lastTraded` staleness), `phases/routeEvents.ts:137-144` (auto-clears `threatened` after `ROUTE_THREATENED_CLEAR_TICKS`), `phaseEconomicTraits.ts:75` (counts `controlledBy`)' },
    { subsystem: 'War, Armies & Battles', sites: '`armySupply.ts:115` reads `threatened` on `trades_with` — a blockade starves a campaign' },
    { subsystem: 'Attention, Chronicle & Narrative', sites: '`tradeRouteMarkers.ts`, `proseResolvers.ts:912-924` (the marker and the sentence)' },
  ],
  'War, Armies & Battles': [
    OMEN_PORTENT_READER,
    { subsystem: 'War, Armies & Battles', sites: '`armyAttrition.ts`, `battleResolution.ts` — both walk `member_of` from the raised warhost' },
    { subsystem: 'Companies & Group Travel', sites: '`groups/groupQueries.ts`, `groups/phaseGroups.ts`, `groups/groupDissolution.ts` (`groupStatus`) — an army is a company kind' },
    { subsystem: 'Strategic Projects & Control', sites: '`strategicActionCandidates.ts`' },
  ],
  // THR-1430: the plot is the first undertaking that ends a life, so the lifecycle
  // becomes live-touched. Everything below already read `deceased` — the cell adds a
  // writer, not a reader — except the succession phase, which gained the read in the
  // same commit because a retained dead leader would otherwise keep leading.
  'Agent Lifecycle': [
    OMEN_PORTENT_READER,
    { subsystem: 'Agent Lifecycle', sites: '`agentLifecycle.ts` — `markMortalDead` is the one funnel; its `retain` mode leaves the node carrying `deceased`, `deceasedTick`, `deathCause` and `slainBy`, and the phase\'s own actor scan already skips `deceased !== true`' },
    { subsystem: 'Companies & Group Travel', sites: '`groups/groupQueries.ts:isAgentGone` reads `deceased === true` as gone, so every roster query and `reconcileLostMembers` closes a dead member\'s `member_of` edge without a node removal' },
    { subsystem: 'Factions & Succession', sites: '`phaseFactionSuccession.ts` / `factionNetwork.ts` — the `deceased` read added by THR-1430: a seat-holder marked dead is a vacancy the phase resolves on its next pass by its own rules' },
    { subsystem: 'Ambitions & Undertakings', sites: '`ambitionTick.ts` grievance funnel — reads the `named_death` outcome node and THR-1383\'s seen-rule to decide whether a vendetta is minted' },
    { subsystem: 'Attention, Chronicle & Narrative', sites: 'the existing `agent_death` event and the sheet\'s death header — the cause word, and *by whom* only where a mark or a culprit-provenance hostile edge exists' },
  ],
  'Companies & Group Travel': [
    OMEN_PORTENT_READER,
    { subsystem: 'Companies & Group Travel', sites: '`groups/groupQueries.ts`, `groups/groupMovement.ts`, `groups/groupCohesion.ts`, `groups/phaseGroups.ts`, `groups/groupDissolution.ts`' },
    { subsystem: 'Encounters & Dilemmas', sites: '`groups/bandOpposition.ts`, `encounterSeeding.ts` (`groupStatus`)' },
    { subsystem: 'Strategic Projects & Control', sites: '`strategicActionCandidates.ts`' },
  ],
  'Factions & Succession': [
    OMEN_PORTENT_READER,
    { subsystem: 'Factions & Succession', sites: '`phaseSchismResolution.ts:34` consumes the `schismPendingResolutionTick` stamp destroy × Faction plants; `phaseFactionActions.ts`, `factionAmbitions.ts`, `phaseFactionSuccession.ts` read the founded faction node' },
  ],
  'Attachments, Items & Possessions': [
    OMEN_PORTENT_READER,
    { subsystem: 'Attachments, Items & Possessions', sites: '`attachmentSlotResolver.ts:124-241` (`possesses`, `acquiredTick`), `orchestrator.ts:145 expireCompanions` (phase 6.625b)' },
    { subsystem: 'Spheres & Quintessence', sites: '`phaseQuintessence.ts` consumes the `QuintessenceEvent` that use × Power\'s soul-price leaves on `pendingQuintessenceEvents`, where the threshold gates already bite (THR-1428 R4) — a mortal casting at their own cost moves the cosmology\'s meters. Recorded here by THR-1431: the cell\'s `readBy` said so in prose, but the structured reader was missing, which is why the subsystem read UNTOUCHED.' },
    { subsystem: 'Encounters & Dilemmas', sites: '`domainCapability.ts` (item and companion contributions), `resolutionModifiers.ts` (`owns`), `graphConditions.ts`' },
    { subsystem: 'Effects & Conditions', sites: '`effects/effectPredicates.ts` — the `owns` predicate, and the `condition_inflict` trait use × Power mints' },
    { subsystem: 'Factions & Succession', sites: '`notableAgendas.ts:446` (`owns`)' },
  ],
  'Reputation & Influence': [
    OMEN_PORTENT_READER,
    { subsystem: 'Encounters & Dilemmas', sites: '`socialLeverage.ts` (`reputationLeverageTerm`), `encounterAftermath.ts`, `unifiedActionResolution.ts`' },
    { subsystem: 'Ambitions & Undertakings', sites: '`grievance/grudgeEdge.ts`, `grievance/covetRivalry.ts`, `undertakingMotive.ts` — the `hostile_to` edge destroy × Standing writes is a motive gate on later cells' },
    { subsystem: 'Secrets & Favors', sites: '`secretGeneration.ts`' },
    { subsystem: 'Mortal Economy & Prosperity', sites: '`phases/routeEvents.ts` (`hostile_to`)' },
    { subsystem: 'Attention, Chronicle & Narrative', sites: '`LocationProfileModal.tsx`, `OverviewTab.tsx` — standing on the sheet' },
  ],
  'Secrets & Favors': [
    OMEN_PORTENT_READER,
    { subsystem: 'Secrets & Favors', sites: '`phaseSecretsFavors.ts` (decay; a revealed secret is exempt — `graphOpExecutor.ts:1443`), `secretsFavorsConsequences.ts`, `secretsFromResolution.ts`' },
    { subsystem: 'Encounters & Dilemmas', sites: '`socialLeverage.ts` — a mark is leverage in the encounter' },
    { subsystem: 'Intelligence, Knowledge & Familiarity', sites: '`intelligence.ts` (`knows_secret_of`)' },
    { subsystem: 'Ruins, Clues & Delves', sites: '`ruins/perceiveRelay.ts:381`' },
    { subsystem: 'Attention, Chronicle & Narrative', sites: '`threadDigest.ts`, `agentDetail.ts`' },
  ],
  'Effects & Conditions': [
    OMEN_PORTENT_READER,
    { subsystem: 'Effects & Conditions', sites: '`conditionDecay.ts:63` (walks `has_trait`), `effects/effectQueries.ts`, `effects/effectWalker.ts`, `effects/conditionProxyEvents.ts`, `phaseSlotCaps`' },
    { subsystem: 'Encounters & Dilemmas', sites: '`effects/effectPredicates.ts`, `graphConditions.ts` — a cured condition changes what the mortal is eligible for' },
  ],
};

/** Dispositions for every non-live cell of every kind that has at least one cell. */
export const CELL_DISPOSITIONS: Readonly<Partial<Record<WorldObjectKindId, Partial<Record<UndertakingVerbVariant, CellDisposition>>>>> = {
  area: {
    create: N('Terrain makes areas.'), 'change:raise': N('Geography.'), 'change:lower': N('Geography.'), use: N('Geography.'),
    'control:claim': N('Territory is a Faction\'s controls edges over Locations, never a region claim.'), 'control:seize': N('As claim.'), destroy: N('Geography.'),
  },
  location: {
    use: W('Yield is a verb: the active harvest of a held Location — holding court, taxing a market, drawing a tithe. Op needed: `draw_yield`, moving a lump of the Location\'s stock into the holder\'s wealth at a cost to the Location\'s prosperity or the holder\'s standing there; the Location\'s productive Places (warehouse, counting house, granary) are the multiplier. Ships only once wealth is visible on the sheet (standing rider).', 'The mortal economy: `draw_yield` moves stock into `wealth`, which `phaseEconomicTraits` bands into traits and the sheet renders as the Means word. The stock drop is read by the prosperity pulse.'),
  },
  place: {
    'change:raise': L('Waits for Places to carry a yield grade, and that grade comes out of the yield work (use × Location) — never invented ahead of it.'),
    'change:lower': L('The hostile mirror of raising; waits with it.'),
    use: N('Absorbed into use × Location: a held Location\'s productive Places are the multiplier on its harvest, so a Place is worth building without a use cell of its own.'),
  },
  route: {
    'change:raise': W('A merchant\'s expansion work writing a lump of volume onto the lane. Op needed: `raise_route_volume` on the trades_with edge; the yield trickle makes volume worth raising.', 'The trade phase and the `holding_income` pass: route `volume` is what both read — the toll a seizer collects scales on it, so raising volume raises somebody\'s income the same day.'),
    destroy: N('The blockade is the hostile verb, a lane nobody trades on dies of neglect in the decay phase, and a deletable lane makes the map poorer with no one gaining.'),
  },
  faction: {
    'change:raise': N('Absorbed: a faction\'s strength is derived, not a dial — raise × Standing with it, create × Army for it, claim × Location for it, a ring in its name. A "raise the faction" op would double the faction\'s own ambitions, which do this from the inside. (THR-1397)'),
    'change:lower': N('Absorbed, the mirror: sabotage its holdings (lower × Location), smear its standing, thin its companies, steal its secrets, or plant the live schism. (THR-1397)'),
    use: N('Absorbed into use × Standing: calling on a faction is the same favour cell with the faction as the counterparty.'),
    'control:claim': W('A candidacy, not a coronation: the work hands the succession phase a named candidate weighted by its outcome, and the phase stays the one arbiter, so a mortal\'s bid and the world\'s own succession never race. Op needed: `nominate_successor`, gated on the faction having no living leader.', 'The succession phase, which stays the one arbiter: the work hands it a weighted candidate and the phase reads that alongside the world\' own contenders.'),
    'control:seize': W('Usurping — a forced succession, never a coronation. Motive-gated against the sitting leader (hostility or a grievance); the work ends by running the succession phase early with the usurper as a weighted candidate against the leader\'s own standing with the faction. Three outcomes from what exists: `leads` moves; the usurper loses and takes a quarrel and a standing loss with the faction; or the faction splits through the live schism op with the usurper as the breakaway. The deposed leader is not killed — that is the plot\'s business. Op needed: `force_succession`.', 'The succession phase, run early with the usurper as candidate — the same reader as the claim fork, reached by a hostile path.'),
  },
  company: {
    'change:lower': W('Desertion as work — the mirror of the mutiny, reading the same cohesion number; the cheap hostile verb that thins a band before it ever meets you. Op needed: `thin_group` (reinforce with a negative roster delta), motive-gated.', 'The cohesion system, which already tracks the number `thin_group` moves, and the group-collapse path that reads it.'),
    use: N('A company\'s use is travel and the encounters it walks into — the group travel system.'),
    'control:claim': W('Taking command of a leaderless company — one op shared with claim × Army, `take_command`, writing `commanded_by`, gated on the group having no living commander. Turns a commander\'s death into a succession moment rather than a leak.', 'The group command layer: `commanded_by` is read by group movement, company cohesion and the war readout.'),
    'control:seize': W('A mutiny: motive-gated against the commander (hostility or a grievance), preconditioned on the group\'s cohesion being low — the cohesion system already tracks it — and rewriting `commanded_by`. Op: `take_command` under the seize gate.', 'The same `commanded_by` readers as the claim fork, plus the cohesion system that gates it — a mutiny is only possible where cohesion already reads low.'),
    observe: N('A company is known by its members.'),
  },
  army: {
    'change:lower': N('Armies already bleed through the attrition and supply phases; a hand-driven version would double a system that works.'),
    use: N('Marching, besieging, battle — the war system\'s own phases, not a completion.'),
    'control:claim': W('Taking command of a leaderless army: the same `take_command` op as the company, plus the claimant must belong to the army\'s faction. The warlord\'s tier-one work.', 'The war layer: `commanded_by` on an army is read by army movement, battle resolution and the `war` debug readout.'),
    'control:seize': W('A coup against a commander of one\'s own faction — the usurping fork one rank down, resolved by the faction through `force_succession`\'s shape rather than by the blade; motive-gated.', 'The faction succession path (`force_succession`\'s shape) and the same army `commanded_by` readers as the claim fork — army movement, battle resolution and the war readout.'),
    observe: W('Scouting an army: writes `knows_of` familiarity with the army and its commander (`seedKnowsOf`), so the scout\'s work feeds intelligence and encounters rather than a dead record. The war readout already computes the strength.', 'The intelligence layer and the war readout: `seedKnowsOf` on the army and its commander is the same edge the survey readers write (THR-1428 R1), read by encounter awareness and the agent sheet\' Knows-the-way-to row.'),
  },
  network: {
    'change:lower': L('Turning members of another\'s ring — desertion one kind over; waits until rings live long enough in a run to be worth attacking (the census on cells will show).'),
    'control:claim': N('—'),
    'control:seize': L('Turning a ring — the mutiny one kind over; waits with lower × Network.'),
    observe: N('—'),
  },
  companion: {
    'change:raise': N('A companion\'s bonuses are its template\'s.'), 'change:lower': N('—'), use: N('Always-on; there is nothing to spend.'),
    'control:claim': N('A companion is a face, not a holding.'), 'control:seize': N('As claim.'), observe: N('—'),
  },
  item: {
    'change:raise': L('Enchanting or refining waits until items carry a tier a work can move.'),
    'change:lower': L('Spoiling another\'s item waits with raise × Item.'),
    use: N('Its activated ability is one tick — an action, not a work.'),
    'control:claim': W('Picking up an unowned item: the possesses edge, one line. Op needed: `claim_item`. The payoff of the treasure hunt — observe a ruin → clue → treasure map → delve → this — and the reason a found relic on the ground is reachable at all.', 'The possession lifecycle: `possesses` is read by the attachment surfaces, the trait-while-held grant, and `treasureMapConsumption` — the payoff step of the observe to clue to chart to delve climb that THR-1428 R1 and R2 opened.'),
    observe: L('Appraising what one holds waits until items carry hidden properties. Searching for treasure is not this cell: you cannot observe an item you do not hold — it is observe × Location / observe × Area with the treasure map as the guiding item.'),
  },
  power: {
    // create and destroy shipped in THR-1429 — see the live table above.
    'change:raise': N('Mastery is capability growth, its own system; every completed work already grows the Reach it leaned on (standing rider).'),
    'change:lower': N('Nothing graded to lower.'),
    'control:claim': N('—'), 'control:seize': N('—'),
    observe: N('—'),
  },
  condition: {
    // create shipped in THR-1429 — see the live table above. A plague on a town is
    // lower × Location, not this cell.
    'change:raise': N('—'), 'change:lower': N('—'), use: N('—'), 'control:claim': N('—'), 'control:seize': N('—'), observe: N('—'),
  },
  agreement: {
    'change:raise': N('—'), 'change:lower': N('—'),
    'control:claim': N('An agreement is between two parties; nobody claims it.'),
    'control:seize': W('Stealing a secret — the `knows_secret_of` edge moves from holder to thief (the seize × Item shape), motive-gated against the holder. The holder loses it, never a copy, or theft is free. The spy\'s signature verb; use × Network does it at scale. Op needed: `steal_mark`.', 'The leverage economy: `knows_secret_of` is read by `pressTheMark`, `socialLeverage` and the secrets strand of the agent sheet. The holder losing it is what the theft is for.'),
    observe: N('—'),
  },
  standing: {
    create: N('Standing exists the moment two parties meet.'),
    use: W('Calling in a favour: a work that spends some standing with a person or faction to mint an `owes_favor` edge — the favour class of Agreement, which the secrets system already has and the binder already anchors on. Spending it is use × Agreement, forgiving it destroy × Agreement, both live: the favour class gets its whole life cycle from this one new op. Op needed: `mint_favor`.', 'The agreements layer: `owes_favor` is read by the favour-calling encounters and the binder, and it is the edge `pressTheMark` already mints.'),
    'control:claim': N('—'), 'control:seize': N('—'), observe: N('—'),
  },
  ambition: {
    create: N('Assigned by the world.'), 'change:raise': N('—'), 'change:lower': N('—'), use: N('—'), 'control:claim': N('—'), 'control:seize': N('—'),
    destroy: N('Abandoning an ambition is a decision the ambition tick makes, not a work a mortal spends days on.'),
    observe: N('—'),
  },
  mortal: {
    create: N('Born, never made by work.'),
    'change:raise': N('Training is mentorship — a Standing / Company matter; capability growth is its own system.'),
    'change:lower': N('Wounding is a Condition (create × Condition); ruin is the plot.'),
    use: N('Sovereign (Vision non-negotiable): never used.'),
    'control:claim': N('Sovereign: never claimed or held.'),
    'control:seize': N('Sovereign: never seized.'),
    observe: N('Surveillance is observe on the kinds a mortal acts through, and use × Network.'),
  },
};
