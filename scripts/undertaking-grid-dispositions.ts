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
 *     a cell cannot be added without being named on the map;
 *   - every cell that is NOT live carries a disposition: `open` (the model admits it, no
 *     operation exists yet — a sentence a designer can answer with yes, no or later) or
 *     `no` (not an object of undertakings, with the reason);
 *   - a disposition on a cell the registry now declares is stale and fails — the map
 *     cannot say "open" about something that shipped.
 *
 * A kind listed in `NOT_AN_OBJECT` needs no per-verb row: every verb is `no` for the
 * one stated reason. Adding a world-object kind (THR-1394's one-PR rule) therefore
 * means either a `NOT_AN_OBJECT` reason or a full row here — the generator fails by
 * name either way, which is the mechanism that keeps the map from drifting.
 */
import type { WorldObjectKindId } from '../src/data/world-objects';
import type { UndertakingVerbVariant } from '../src/types/strategicAction';

export interface CellDisposition {
  readonly status: 'open' | 'no';
  readonly note: string;
}

export interface LiveCellNote {
  /** The graph operation(s) the cell rides, by name. */
  readonly op: string;
  readonly note: string;
  /** Old authored templates this cell absorbs or retires (informational). */
  readonly retires?: readonly string[];
}

const O = (note: string): CellDisposition => ({ status: 'open', note });
const N = (note: string): CellDisposition => ({ status: 'no', note });

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
  mortal: 'Sovereign (Vision non-negotiable): never claimed, seized or held. Training (mentorship), assassination and surveillance are named below as open cells on the kinds they act through — a trained mortal is a Standing/Company matter, a killed mortal is the one design fork left to Christian.',
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

/** What each LIVE cell does — required for every semantic the registry declares. */
export const LIVE_CELL_NOTES: Readonly<Partial<Record<WorldObjectKindId, Partial<Record<UndertakingVerbVariant, LiveCellNote>>>>> = {
  area: {
    observe: { op: 'record_intelligence', note: 'Walk the unmapped: the old exploration templates become one observe cell whose object is the area.', retires: ['walk_the_unmapped', 'mount_expedition'] },
  },
  location: {
    create: { op: 'create_location', note: 'A settlement-class Location at the site\'s hex with founding prosperity; the subtype is the parameter (a hamlet, a camp).', retires: ['found_settlement'] },
    'change:raise': { op: 'modify_location_property (+)', note: 'Prosperity by default; the old property changes are this cell with the property as a parameter. Reaches every class.', retires: ['grow_settlement', 'fortify_defenses', 'fortify_position', 'organize_festival', 'consecrate_site', 'preach_masses'] },
    'change:lower': { op: 'modify_location_property (−)', note: 'Sabotage: the same op with a negative delta, motive-gated against another\'s Location.' },
    'control:claim': { op: 'claim_control (mode)', note: 'Establishing control is the sustained claim_control mode — upkeep, degradation, collapse — never a one-tick completion. Any class.' },
    'control:seize': { op: 'transfer_holding', note: 'Another\'s Location changes hands; motive-gated, holding_seized harm.' },
    destroy: { op: 'ruin_settlement', note: 'The prosperity floor plus the ruins subtype the battle aftermath already reads — not a deletion. Settlement and stronghold classes; ruining a wonder or a deposit is refused.' },
    observe: { op: 'record_intelligence', note: 'Learn a Location: its holders, its stocks, its Places.', retires: ['scout_settlement'] },
  },
  place: {
    create: { op: 'create_sublocation', note: 'A Place inside a Location; the type is the parameter the ambition supplies — a merchant founds a warehouse, a zealot a shrine.', retires: ['build_granary', 'build_warehouse', 'civic_construction', 'consecrate_holy_site', 'establish_dynasty_seat', 'establish_garrison', 'establish_research_circle', 'found_guild_chapter', 'found_shrine', 'organize_patronage'] },
    'control:claim': { op: 'grant_holding', note: 'A freehold on an unheld Place.' },
    'control:seize': { op: 'transfer_holding', note: 'Another\'s Place changes hands; motive-gated.' },
    destroy: { op: 'raze_holding', note: 'The Place is razed: its holding face and the node go.' },
    observe: { op: 'record_intelligence', note: 'What a Place holds and who keeps it.' },
  },
  route: {
    create: { op: 'create_trade_route', note: 'A trade lane between the durable origin and the far end; both must stand.', retires: ['establish_trade_route'] },
    'change:lower': { op: 'blockade_route', note: 'A blockade: the route suspended, not deleted — the trade phases already honour it.', retires: ['disrupt_trade_route'] },
    use: { op: 'conduct_trade', note: 'Trading along one\'s own route — the catalog op, anchored at the near end.', retires: ['conduct_trade'] },
    'control:claim': { op: 'grant_holding', note: 'A freehold on an unheld route\'s identity node.' },
    'control:seize': { op: 'transfer_holding + tax_trade_route', note: 'Another\'s route changes hands and the seizer starts tolling it; motive-gated.', retires: ['tax_trade_route'] },
    observe: { op: 'record_intelligence', note: 'Charting a route: its ends, its traffic, who taxes it.' },
  },
  faction: {
    create: { op: 'found_faction', note: 'A mortal founds an order — a chapter, a cult, a company of arms — with the default seed unless an override names one.', retires: ['found_faction'] },
    destroy: { op: 'plant_schism', note: 'A schism the world resolves in its own phase.', retires: ['plant_schism'] },
    observe: { op: 'record_intelligence', note: 'Intelligence on a faction: its leader, its holdings, its rivals.' },
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
    destroy: { op: 'disband_group', note: 'Roll up the ring.' },
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
    use: { op: 'activate_spell', note: 'Casting: the spell op, its costs and its backlash. A bestowed power that names no spell template is refused — this cell measures how often one can be cast at all (the Power kind is dormant).' },
  },
  condition: {
    destroy: { op: 'cure_condition', note: 'Curing: the removal funnel the expiry phase uses, taken as work — a healer\'s undertaking.' },
  },
  agreement: {
    create: { op: 'mint_leverage_mark', note: 'Digging up a secret: a mark on the mortal the work was done about.' },
    use: { op: 'press_the_mark', note: 'Pressing a mark is the self-spend the kind row called a use. Calling in a favour is the favor class\'s use — open.', retires: ['press_the_mark'] },
    destroy: { op: 'expose_mark', note: 'Exposing a mark: the edge stays, revealed, and loses its leverage. Forgiving a favour is the favor class\'s destroy — open.' },
  },
  standing: {
    'change:raise': { op: 'apply_reputation_with_delta (+)', note: 'Cultivating one\'s own standing with a person, a faction or a place.' },
    'change:lower': { op: 'apply_reputation_with_delta (−)', note: 'Smearing another\'s standing — the same op, signed — motive-gated.' },
    destroy: { op: 'create_relation_edge hostile_to', note: 'A quarrel: the standing broken and a hostile_to edge standing in its place — motive-gated.' },
  },
};

/** Dispositions for every non-live cell of every kind that has at least one cell. */
export const CELL_DISPOSITIONS: Readonly<Partial<Record<WorldObjectKindId, Partial<Record<UndertakingVerbVariant, CellDisposition>>>>> = {
  area: {
    create: N('Terrain makes areas.'), 'change:raise': N('Geography.'), 'change:lower': N('Geography.'), use: N('Geography.'),
    'control:claim': N('Territory is a Faction\'s controls edges over Locations, never a region claim.'), 'control:seize': N('As claim.'), destroy: N('Geography.'),
  },
  location: {
    use: O('Holding court, taxing a market, drawing a tithe — the yield of a held Location. No op today; the economy\'s stocks are the natural read. Decide whether yield is a verb or the holding\'s upkeep.'),
  },
  place: {
    'change:raise': O('A Place has no graded property today (a granary is a granary). Open until Places carry a stock or a quality.'),
    'change:lower': O('The hostile mirror of raising it; open with it.'),
    use: O('Working a Place is what agents do there in idle behaviour, not an undertaking, unless a Place yields something a work can bank.'),
  },
  route: {
    'change:raise': O('Raising a route\'s volume. The trades_with edge carries volume; no op writes it as work.'),
    destroy: O('Tearing up a road or breaking a trade lane for good — no op; a blockade lifts. Open whether a route can be destroyed at all.'),
  },
  faction: {
    'change:raise': O('Strengthening a faction — recruiting members, raising its rank — is joinOrUpdateMembership from the joiner\'s side; as a work aimed at the faction it needs an op that raises the faction.'),
    'change:lower': O('Weakening a faction short of a schism — no op.'),
    use: O('Calling on a faction\'s strength (a levy, a favour) — no op; overlaps with Standing use.'),
    'control:claim': O('Taking leadership of a leaderless faction — the leads edge exists; no op writes it as work.'),
    'control:seize': O('Usurping a leader — the succession system has its own phase; a seize cell would hand it a candidate. Decide whether succession is an undertaking or stays emergent.'),
  },
  company: {
    'change:lower': O('Thinning another\'s company — desertion as work; no op.'),
    use: N('A company\'s use is travel and the encounters it walks into — the group travel system.'),
    'control:claim': O('Taking command of a leaderless company — commanded_by exists; no op as work.'),
    'control:seize': O('Taking another\'s company — a mutiny. Overlaps with the group cohesion system\'s own dissolution.'),
    observe: N('A company is known by its members.'),
  },
  army: {
    'change:lower': O('Bleeding another\'s army short of battle — no op.'),
    use: N('Marching, besieging, battle — the war system\'s own phases, not a completion.'),
    'control:claim': O('Taking command of a leaderless army.'),
    'control:seize': O('Usurping a commander.'),
    observe: O('Scouting an army\'s strength — the war readout exists; as intelligence work it needs the op.'),
  },
  network: {
    create: O('A spy ring or a cabal founded as work — the kind is dormant: strategicGraphOps can mint one, nothing asks it to. This is the cell that would wake it.'),
    'change:raise': O('Recruiting into the ring.'), 'change:lower': O('Turning members of another\'s ring.'),
    use: O('Running the ring — intelligence gathering; overlaps observe × Faction.'),
    'control:claim': N('—'), 'control:seize': O('Turning a ring.'), observe: N('—'),
  },
  companion: {
    'change:raise': N('A companion\'s bonuses are its template\'s.'), 'change:lower': N('—'), use: N('Always-on; there is nothing to spend.'),
    'control:claim': N('A companion is a face, not a holding.'), 'control:seize': N('As claim.'), observe: N('—'),
  },
  item: {
    'change:raise': O('Enchanting or refining an item — no op raises an item\'s tier.'),
    'change:lower': O('Spoiling another\'s item short of destroying it — no op.'),
    use: O('Spending what an item gives — its activated ability is one tick, an action rather than a work. Probably stays an action.'),
    'control:claim': O('Picking up an unowned item: the possesses edge, one line. Worth declaring — a found relic on the ground is unowned today and unreachable.'),
    observe: O('Appraising an item — learning its tier and hidden properties.'),
  },
  power: {
    create: O('Learning a spell — knows_spell has no writer. The cell that gives Power a shape.'),
    'change:raise': O('Mastering a power.'), 'change:lower': O('Weakening another\'s power — no op.'),
    'control:claim': N('—'), 'control:seize': N('—'),
    destroy: O('Unlearning, or stripping another\'s power — motive-gated.'), observe: N('—'),
  },
  condition: {
    create: O('Inflicting a condition on another — a curse, a plague — is an attack: motive-gated create × Condition with the target as the site. The reward-pool mint exists; declaring it is a design call because it is the first cell whose object is made against someone.'),
    'change:raise': N('—'), 'change:lower': N('—'), use: N('—'), 'control:claim': N('—'), 'control:seize': N('—'), observe: N('—'),
  },
  agreement: {
    'change:raise': N('—'), 'change:lower': N('—'),
    'control:claim': N('An agreement is between two parties; nobody claims it.'),
    'control:seize': O('Stealing a secret — taking another\'s mark. The secrets system has a reveal but no theft.'),
    observe: N('—'),
  },
  standing: {
    create: N('Standing exists the moment two parties meet.'),
    use: O('Calling on standing — leverage. reputationLeverageTerm reads it in encounters; as a work it would spend standing for a concession.'),
    'control:claim': N('—'), 'control:seize': N('—'), observe: N('—'),
  },
  ambition: {
    create: N('Assigned by the world.'), 'change:raise': N('—'), 'change:lower': N('—'), use: N('—'), 'control:claim': N('—'), 'control:seize': N('—'),
    destroy: O('Abandoning one\'s own ambition — undertaking_abandoned harm exists. Open whether it is a work or a decision.'),
    observe: N('—'),
  },
};
