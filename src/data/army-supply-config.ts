/**
 * Army Supply Constants — THR-626 (Flow Web P2: army supply rides trade conduits).
 *
 * Armies stop carrying their own larder. Provisions become a **stock** held at
 * faction-controlled settlements and delivered along the **conduits** the trade
 * web already maintains (`road` edges and `trades_with` routes). Sever the
 * conduit and the army starves — which is the whole point: cutting a supply
 * line becomes an economic act with a military consequence, a Shadow/Gold
 * answer to an Iron problem.
 *
 * Nothing is simulated in transit (NFP #7, and the Flow Web's first commitment:
 * "pull-derived, not token-pushed"). There are no wagons. Each tick the phase
 * *derives* a throughput scalar from the topology between the army and its
 * nearest supply host, and the army's larder moves toward that number. The
 * moment someone proposes pathing individual grain carts, the primitive has
 * failed.
 *
 * Reuse note (THR-618 extraction checkpoint): the checkpoint deferred extracting
 * a general Flow Web primitive and named army supply as one of two re-open
 * triggers, requiring that its design "open by comparing against `tradeRoute.ts`
 * + `routeEvents.ts` and either reuse or extract — not green-field a third
 * stocks/flows implementation." This system **reuses**: conduits are the shipped
 * `trades_with` edges (including their `threatened` flag and `CargoManifest`),
 * host stock is read through `readResources`/`readLocationResourceBalance`, and
 * anomalies materialize as `PendingEncounterSeed`s exactly as `routeEvents.ts`
 * does. No second manifest type, no second decay clock, no new node type. The
 * one thing it adds is a per-army scalar, which is a stock on its host — the
 * shape the primitive already sanctions.
 *
 * All tunables named here (NFP #1).
 */

// ─── Cadence ──────────────────────────────────────────────────────────────

/**
 * Ticks between supply recomputations. Deliberately faster than the route-event
 * scan (12) — an army's larder is the thing that should react within a day of a
 * road being cut, while route events are a slower, world-scale drumbeat.
 */
export const ARMY_SUPPLY_SCAN_INTERVAL_TICKS = 4;

// ─── Larder ───────────────────────────────────────────────────────────────

/**
 * Full larder, in abstract provision units. An army at `ARMY_SUPPLY_MAX` is fed;
 * the number is private and never rendered — `ArmySupplyTier` is the read surface.
 */
export const ARMY_SUPPLY_MAX = 100;

/** Larder an army is raised with — most of a full load, so a fresh host has slack. */
export const ARMY_SUPPLY_INITIAL = 80;

/**
 * Provisions consumed per scan, scaled by size. A host eats an order of magnitude
 * more than a warband, which is why big armies cannot stray far from a road.
 */
export const ARMY_SUPPLY_CONSUMPTION: Record<'warband' | 'regiment' | 'host', number> = {
  warband: 4,
  regiment: 9,
  host: 18,
};

// ─── Conduit resolution ───────────────────────────────────────────────────

/**
 * Maximum conduit hops searched outward from the army before it is declared cut
 * off. Bounded so the walk stays O(armies · hops · degree) and never becomes a
 * whole-graph search (NFP #7 — performance budget, not premature optimization).
 */
export const ARMY_SUPPLY_MAX_HOPS = 4;

/**
 * Throughput delivered by a supply line at zero hops (army standing on its own
 * supply host). Every hop multiplies this by `ARMY_SUPPLY_HOP_DECAY`.
 */
export const ARMY_SUPPLY_BASE_THROUGHPUT = 30;

/**
 * Per-hop throughput multiplier. Distance from the granary costs you: at the
 * 4-hop limit a line delivers ~24% of what it does at the source, which is what
 * makes deep campaigns structurally precarious rather than arbitrarily capped.
 */
export const ARMY_SUPPLY_HOP_DECAY = 0.7;

/**
 * Throughput multiplier applied when any hop on the chosen line is a
 * `threatened` trade route (the flag `routeEvents.ts` sets on an ambush).
 * Banditry does not sever a line — it strangles it, which is the more
 * interesting state because the army can still act while it degrades.
 */
export const ARMY_SUPPLY_THREATENED_PENALTY = 0.4;

/**
 * Minimum aggregate resource balance a location must hold to serve as a supply
 * host. A settlement in famine cannot feed an army — reading
 * `readLocationResourceBalance` here is what couples the two webs, so a scarcity
 * arc upstream surfaces as hunger in the field.
 */
export const ARMY_SUPPLY_HOST_MIN_BALANCE = -0.2;

// ─── Tier thresholds ──────────────────────────────────────────────────────

/**
 * Larder fractions bounding the public vocabulary. Above `strained` the army is
 * `supplied` and the system is silent — equilibrium produces no content.
 */
export const ARMY_SUPPLY_TIER_THRESHOLDS = {
  strained: 0.5,
  starving: 0.2,
} as const;

// ─── Attrition coupling ───────────────────────────────────────────────────

/** Extra cohesion loss per tick while `strained`. Stacks with the shipped terms. */
export const STRAINED_SUPPLY_ATTRITION_PENALTY = 0.6;

/** Extra cohesion loss per tick while `starving`. Hunger outweighs bad ground. */
export const STARVING_SUPPLY_ATTRITION_PENALTY = 2.0;

// ─── Anomaly materialization ──────────────────────────────────────────────

/** Chance per scan that a `strained` army plants a forage seed. */
export const ARMY_FORAGE_CHANCE = 0.35;

/** Chance per scan that a `starving` army plants a mutiny seed. */
export const ARMY_MUTINY_CHANCE = 0.3;

/** Chance per scan that a `starving` besieging army plants a siege-lifted seed. */
export const ARMY_SIEGE_LIFTED_CHANCE = 0.4;

/** Ticks a planted army-supply seed waits before it may spawn. */
export const ARMY_SUPPLY_SEED_DELAY_TICKS = 2;

/**
 * Priority carried by army-supply seeds. Above the route-event priority (1.1):
 * a starving army is a louder story than a taxed caravan.
 */
export const ARMY_SUPPLY_SEED_PRIORITY = 1.25;

/** Max army-supply seeds planted per scan, world-wide (attention budget). */
export const ARMY_SUPPLY_MAX_SEEDS_PER_SCAN = 2;

/**
 * Template ids for the three starving-army anomalies named in the ticket.
 * `army.threshold.mutiny` is **shipped content** (THR-104) that until now had no
 * spawn path at all — `THRESHOLD_ENCOUNTER_TEMPLATES` in `armyAttrition.ts` has
 * zero non-test consumers, so cohesion thresholds only ever produced a
 * notification. Seeding it here reuses authored content instead of writing a
 * fifth near-identical mutiny scene.
 */
export const ARMY_FORAGE_TEMPLATE_ID = 'army.supply.forage';
export const ARMY_MUTINY_TEMPLATE_ID = 'army.threshold.mutiny';
export const ARMY_SIEGE_LIFTED_TEMPLATE_ID = 'army.supply.siege_lifted';

// ─── Siege coupling ───────────────────────────────────────────────────────

/**
 * Multiplier on `SIEGE_STARVATION_TICK` for a defender whose supply line is
 * intact. THR-614 shipped starvation as a self-contained clock that fired at a
 * fixed elapsed tick regardless of the world; this is the swap the notables plan
 * named — "THR-626 later swaps the provisions *source* to the trade web". A
 * defender still connected to a fed host holds out proportionally longer, so
 * cutting the roads *before* investing the walls becomes the correct siege.
 */
export const SIEGE_SUPPLIED_DEFENDER_STARVATION_FACTOR = 2;
