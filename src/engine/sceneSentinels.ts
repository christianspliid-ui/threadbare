/**
 * The scene-sentinel vocabulary — one definition, read by both the binder and the gate.
 *
 * THR-1446 extracted this from `encounterAftermath.ts`. The table had grown by four
 * additions (THR-1110, THR-1143, THR-1144, THR-1175), each documenting itself *in the
 * table* while the binder's header kept its own four-name enumeration — and reading the
 * header instead of the table manufactured a false critical finding that took a session
 * to unwind (impediment #725). Adding a *second* consumer with a *second* copy of the
 * field→kind mapping would have reproduced that rot on purpose, so the mapping lives
 * here and both sides import it.
 *
 * **Pure — no graph, no state, no fs, and no template.** This module is data plus one
 * predicate over a single (field, sentinel) pair, so the authoring-time gate can import
 * it without pulling the runtime aftermath dispatcher into a CLI bundle.
 */



// ─── The sentinels ───────────────────────────────────────────────────

/**
 * `$actor` — the acting agent (`action.actorId`).
 *
 * THR-1025: this was the one member of the authored vocabulary the bind pass did not
 * know. `$actor` is the established token everywhere else (`resolveRef` in
 * `src/types/graphOp.ts` maps it for every GraphOp), so content authored it on aftermath
 * effects and reasonably expected it to resolve; the literal string passed through
 * untouched and was consumed downstream as if it were a node id.
 */
export const SENTINEL_ACTOR = '$actor';

/** `$target` — the card's resolved target (`action.targetId`). */
export const SENTINEL_TARGET = '$target';

/** `$cast:<key>` prefix — rebinds via `action.supportBindings`. */
export const SENTINEL_CAST_PREFIX = '$cast:';

/** Legacy alias for the cast sentinel (the `src/data/encounters/examples/` files use `role:`). */
export const SENTINEL_CAST_LEGACY_PREFIX = 'role:';

/**
 * `$ascendant` (THR-1446) — the player's god.
 *
 * The other sentinels all name a *scene participant*. The ascendant is none of them —
 * it is the player, standing outside the scene — which is why it had no sentinel, and
 * why the whole `thread` consequence family was unwirable from authored content: every
 * `thread_*` effect takes a literal `ascendantId`, and the node id is minted per run as
 * `asc.<archetypeId>`, so there was no literal an author could ever write.
 */
export const SENTINEL_ASCENDANT = '$ascendant';

/**
 * `$here` (THR-1446) — the place this encounter is happening at.
 *
 * `$target` binds a location only when the *card* targets one, so a self-targeted
 * encounter — which is most of them — could never wire the `place` family: the kind
 * check correctly refused to bind an agent to `targetLocationId` and the effect no-opped
 * silently. `$here` answers the question the author was actually asking, reading the
 * actor's position rather than the card's target.
 */
export const SENTINEL_HERE = '$here';

/**
 * `$realm` (THR-1155) — the Realm whose political map claims the scene's hex.
 *
 * `$here` names the *place*; this names the *nation that holds it*. The two are
 * different questions with different answers: a town is a Location, and the Realm
 * holding it is a faction node minted per world with a name no author can write —
 * exactly the shape `$faction:<defId>` solves for the committed orders and cannot
 * solve here, because a Realm's definition id is `realm.<cultureId>` and the culture
 * is itself generated.
 *
 * **Binds a Realm or nothing.** The projection contains only `factionClass: 'realm'`
 * factions, so a guild's town outside every Realm leaves the sentinel unbound rather
 * than binding the guild. That refusal is the design (THR-1155 § D): *the realm that
 * holds this town* must never quietly become *whoever holds this town*, or a tithe
 * demanded by a nation would be demanded by a thieves' guild.
 */
export const SENTINEL_REALM = '$realm';

/**
 * `$area` (THR-1155) — the named Area the scene happens in.
 *
 * Registered here so the vocabulary is complete and an author writing it is *told*
 * rather than ignored. **No aftermath effect field takes an Area**, verified across
 * the whole `EncounterAftermathReactionEffect` union: every node-id field on it names
 * an agent, a faction, a location, a sublocation, an ascendant, or a template. So
 * `$area` refuses on every field, and {@link sentinelBindingRefusal} says where it
 * does belong — a chip's anchor, whose `visualKind` gained `'area'` for this.
 *
 * Registering a refusing sentinel is strictly better than leaving it unregistered.
 * Unregistered, `'$area'` is not a sentinel, so the binder passes the literal string
 * through untouched and the effect consumes it as a node id — authored, typed,
 * present, and dead, which is the silent failure THR-1446 built this gate to end.
 */
export const SENTINEL_AREA = '$area';

// ─── The field table ─────────────────────────────────────────────────

/**
 * Effect fields that may carry a scene sentinel, mapped to the node kind each expects.
 *
 * A sentinel binds only when the node it resolves to matches the field's kind; a
 * mismatch leaves the sentinel in place and the effect no-ops down its existing
 * invalid-target path (fail-soft, NFP #4). A literal node id is not a sentinel and
 * passes through untouched, so registering a field here never changes shipped content.
 */
export const SCENE_SENTINEL_FIELDS = {
  targetAgentId: 'agent',
  withAgentId: 'agent',
  // THR-1110 — an `attachment_grant` agreement names its other party here, and the
  // party is nearly always someone the scene already cast. Registered as 'agent' so
  // `$cast:<key>` binds the person; a literal faction or location id is not a
  // sentinel and passes through untouched, then is validated by the handler.
  counterpartyId: 'agent',
  // THR-1175 — `favor_creation` names who *owes* here. Registered as 'agent' so
  // `$cast:<key>` binds the scene's persistent person and the kind check refuses
  // to bind a location: that refusal is the point, since a place owing a social
  // favour is an edge no consumer can collect.
  debtorAgentId: 'agent',
  targetFactionId: 'faction',
  // THR-1144 — `membership_change` names the faction someone joins or leaves in
  // `factionId`, not `targetFactionId`, because the *person* is the effect's target.
  // Registered here rather than special-cased so `$target` binds "the guild you just
  // impressed" without the author knowing its node id. Widens four other
  // `factionId`-carrying kinds at no behavioural cost.
  factionId: 'faction',
  targetSublocationId: 'sublocation',
  // THR-1143 — a place. `$target` binds when the action targets a location, which is
  // how "the pass you just closed" reaches the condition without the author knowing
  // the node id.
  targetLocationId: 'location',
  // THR-1446 — the mortal end of a `thread_*` effect. `$actor` / `$cast:<key>` bind the
  // person the scene already has, exactly the way `withAgentId` does.
  mortalId: 'mortal',
  // THR-1446 — the divine end of a `thread_*` effect. Only `$ascendant` binds it: the
  // kind check refuses `$actor` / `$target` / `$cast:` here on purpose, since a
  // thread's source end is always the player's god.
  ascendantId: 'ascendant',
} as const;

/** A field that may carry a scene sentinel. */
export type SceneSentinelField = keyof typeof SCENE_SENTINEL_FIELDS;

/** The node kinds a scene sentinel field can demand. */
export type SceneSentinelKind = (typeof SCENE_SENTINEL_FIELDS)[SceneSentinelField];

/** Every sentinel-bearing field, in table order. */
export const SCENE_SENTINEL_FIELD_NAMES = Object.keys(
  SCENE_SENTINEL_FIELDS,
) as readonly SceneSentinelField[];

/** Is `value` any scene sentinel? Literal ids and prose answer `false`. */
export function isSceneSentinel(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return (
    value === SENTINEL_ACTOR
    || value === SENTINEL_TARGET
    || value === SENTINEL_ASCENDANT
    || value === SENTINEL_HERE
    || value === SENTINEL_REALM
    || value === SENTINEL_AREA
    || value.startsWith(SENTINEL_CAST_PREFIX)
    || value.startsWith(SENTINEL_CAST_LEGACY_PREFIX)
  );
}

// ─── Bindability ─────────────────────────────────────────────────────

/**
 * Why a sentinel cannot bind on this field, or `null` when it can.
 *
 * This is the machine-readable half of THR-1446's finding: a sentinel pointed at a
 * field whose kind it can never satisfy binds nothing, and the effect then no-ops
 * **silently** — authored, typed, present, and dead. Surfacing it at authoring time is
 * what turns the binder's runtime refusal into something an author is told.
 *
 * ## What this deliberately does NOT check, and why
 *
 * **`$target` is not checked against the template's declared `targetCategories`.** The
 * first cut of this gate did exactly that, on the reasoning that
 * `targetLocationId: '$target'` cannot bind on a template that targets actors — which
 * is the shape batch 2 hit on `sharpen_blades`, verified dead in the CLI. It reported 8
 * violations across the shipped corpus and **at least one was false**:
 * `encounter.slice.the_table_that_holds` declares no `targetCategories` (so the field
 * defaults to `['actor']`) and is nevertheless resolved against a **town** at runtime —
 * `tableThatHolds-seedChain.test.ts` asserts the resulting `reputation_with` edge lands
 * on that town, and it went red.
 *
 * The lesson is about the signal, not the arithmetic: `targetCategories` filters which
 * cards a *player* may aim at a node. It does not describe what an encounter's target
 * resolves to when the world spawns it. Whether `$target` is a place is therefore a
 * **runtime fact no template declares**, and a gate that ruled on it would emit false
 * positives — which trains authors to ignore the gate, the one outcome strictly worse
 * than not having it.
 *
 * So `$target` is accepted on every field it could plausibly satisfy. The
 * `sharpen_blades` class is now an authoring choice rather than a trap: `$here` exists,
 * always resolves, and says what those authors meant.
 *
 * `$cast:<key>` is likewise unchecked here — `castTargetViolations` (THR-1165) knows the
 * support bundle and checks it far more strictly; a second opinion would double-report.
 */
export function sentinelBindingRefusal(
  field: SceneSentinelField,
  sentinel: string,
): string | null {
  const kind = SCENE_SENTINEL_FIELDS[field];

  if (sentinel === SENTINEL_ASCENDANT) {
    return kind === 'ascendant'
      ? null
      : `'${SENTINEL_ASCENDANT}' names the player's god, which is not a ${kind}`;
  }
  if (kind === 'ascendant') {
    return (
      `${field} is the divine end of a thread — only '${SENTINEL_ASCENDANT}' binds it, `
      + `and '${sentinel}' resolves to nothing, so the effect no-ops silently`
    );
  }

  if (sentinel === SENTINEL_HERE) {
    return kind === 'location' || kind === 'sublocation'
      ? null
      : `'${SENTINEL_HERE}' names the place the scene happens at, which is not a ${kind}`;
  }

  // THR-1155 — `$realm` resolves a faction and only a faction. Decidable from the
  // field alone; whether *this* scene's hex is claimed by a Realm is a runtime fact,
  // and the binder's projection lookup is the honest place for that half.
  if (sentinel === SENTINEL_REALM) {
    return kind === 'faction'
      ? null
      : `'${SENTINEL_REALM}' names the Realm that holds this ground, which is not a ${kind}`
        + `${kind === 'location' || kind === 'sublocation' ? `; use '${SENTINEL_HERE}' for the place itself` : ''}`;
  }

  // THR-1155 — `$area` refuses everywhere, because no effect field takes an Area.
  // The message names the surface that does, so the gate redirects rather than only
  // forbidding: an author reaching for the Area wants to *name* it, and a chip anchor
  // (`visualKind: 'area'`) is where naming it reaches a page.
  if (sentinel === SENTINEL_AREA) {
    return (
      `no aftermath effect field takes an Area, so '${SENTINEL_AREA}' on ${field} `
      + `(a ${kind}) binds nothing — name the Area on a chip anchor instead, or use `
      + `'${SENTINEL_HERE}' for the place the scene happens at`
    );
  }

  if (sentinel === SENTINEL_ACTOR) {
    // The actor is an agent by construction, so this is decidable from the field alone.
    // Whether *this* card's actor is the god (which a `mortal` field refuses) is a
    // runtime fact — the binder's kind check is the honest place for that half.
    return kind === 'agent' || kind === 'mortal'
      ? null
      : `'${SENTINEL_ACTOR}' names the acting agent, which is not a ${kind}`
        + `${kind === 'location' || kind === 'sublocation' ? `; use '${SENTINEL_HERE}' for the place the scene happens at` : ''}`;
  }

  // `$target` and `$cast:<key>` — see the doc comment above.
  return null;
}
