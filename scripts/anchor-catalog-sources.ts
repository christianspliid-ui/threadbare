/**
 * Anchor-catalog membership + annotation — THR-1154.
 *
 * Split out of `generate-anchor-catalog.ts` so the guard can be tested without
 * running the generator, mirroring `generated-artifact-sources.ts`. The generator
 * imports everything here and adds only rendering and file IO.
 *
 * ## Membership is derived; annotation is curated; an unannotated member fails
 *
 * Which anchor kinds exist is a fact about the code — the `NodeType`, `ActorType`,
 * `EdgeType` and `AttachmentCategory` unions. *Which player surface shows one* is
 * not machine-derivable: it lives across `openEntity`, the drawers and the detail
 * views. So membership is parsed from source and annotation is curated per member,
 * with {@link assertEveryMemberAnnotated} closing the loop — add a `NodeType` and
 * the build fails by name until someone classifies it.
 *
 * Without that guard a new member would simply be absent from the table, and
 * absence reads exactly like "not an anchor" — a silent default, which is the
 * failure shape this whole catalog exists to remove.
 */

// ─── Anchor status vocabulary ─────────────────────────────────────────────────

/**
 * How far a chip can actually go with this anchor **today**.
 *
 * The distinction between `linked` and `named` is the one authors get wrong, and
 * it is not a quality ranking — both are legal anchors under Law 56's second
 * clause. What separates them is whether `openEntity` has a route for the kind:
 * only `agent`, `faction`, `artifact` and `attachment` are members of the
 * `visualKind` union it switches on, so only those four can carry a click. A
 * `named` anchor is a real graph object the chip may point at and name; the player
 * reads it, and reaches it by the surface named in the row rather than by clicking
 * the chip.
 */
export type AnchorStatus =
  /** The chip can carry a live link straight to the object's own page. */
  | 'linked'
  /** A real resolvable object the chip may name and declare, with no click route yet. */
  | 'named'
  /** Declared in the type union but nothing writes it — never anchor to one. */
  | 'reserved'
  /** Not a player-facing referent. Machinery, not something a chip can be about. */
  | 'not-an-anchor'
  /** The director named it as a legal anchor and the game has no representation. */
  | 'gap';

export type AnchorRow = {
  /** What an author calls it. */
  readonly anchor: string;
  /** How the chip declares it, in `stateNoun` / `concepts` field terms. */
  readonly declare: string;
  /** Where the player sees the thing the chip is about. */
  readonly surface: string;
  readonly status: AnchorStatus;
  readonly note?: string;
};

export const NOT_AN_ANCHOR = (what: string, why: string): AnchorRow => ({
  anchor: '—',
  declare: '—',
  surface: '—',
  status: 'not-an-anchor',
  note: `${what} — ${why}`,
});

// ─── Curated annotations, keyed by derived member ─────────────────────────────

/**
 * `NodeType` → what a chip can do with it.
 *
 * Note `location` covers sublocations too: there is no `sublocation` NodeType, and
 * deliberately so — the three-tier position model (hex → location → sublocation)
 * nests sublocations inside locations as `location` nodes carrying a
 * `parentLocationId`. An author anchoring to "the tavern's back room" is anchoring
 * to a `location`.
 */
export const NODE_TYPE_ROWS: Readonly<Record<string, AnchorRow>> = {
  actor: {
    anchor: 'Actor (see the Actor table below)',
    declare: '`entityId` = the actor node id, `visualKind` per its `actorType`',
    surface: 'Routed by `actorType` — see the Actor subtype rows',
    status: 'linked',
    note: 'The umbrella row. `actorType` decides the anchor kind and the route.',
  },
  location: {
    anchor: 'Location / sublocation',
    declare: '`entityId` = the location node id, `visualKind: \'location\'`',
    surface: 'The location\'s own profile, opened from the chip; plus the hex detail view from the map',
    status: 'linked',
    note:
      'A real, resolvable object that **does** carry the click, since THR-1172. Declare ' +
      '`visualKind: \'location\'` — the member exists on `EncounterAftermathConceptRef` ' +
      '(`unifiedAction.ts`), `EncounterVeil.openEntity` routes it, and `onSelectEntity` ' +
      'accepts it, so the chip both draws the place\'s tile and opens its sheet. Reach for ' +
      'it through an anchor sentinel rather than a literal id: the instance is minted per ' +
      'world, exactly as a faction\'s is. **Corrected 2026-08-24 (THR-1221):** this row ' +
      'previously read "no `visualKind` member exists" and told authors to name the place ' +
      'without promising a link. That predated THR-1172 and contradicted this same file\'s ' +
      'own preamble, which has always listed `location` among the `visualKind` members. It ' +
      'was not stale output — the sentence is hand-written here, so the generator reported ' +
      'the catalog current while it said the opposite of the type. A package pass followed ' +
      'it and omitted `visualKind` from a shipped chip, leaving two location anchors in one ' +
      'batch rendering at different tiers.',
  },
  trait: {
    anchor: 'Trait',
    declare: '`tooltipId` on the concept; no `entityId`',
    surface: 'The tooltip, and the bearer\'s trait list on their sheet',
    status: 'named',
    note:
      'A trait is a concept, not an entity with art — it takes a tooltip and no tile, ' +
      'rather than a wrong one.',
  },
  artifact: {
    anchor: 'Artifact (common)',
    declare: '`entityId: \'$artifact\'`, `visualKind: \'artifact\'`',
    surface: 'The artifact sheet, and the bearer\'s possessions',
    status: 'linked',
    note:
      'Reach for it through the `$artifact` sentinel, never a literal id (THR-1275). '
      + '`spawn_artifact` keys its node `artifact_spawned_<encounterId>_<reactionId>_<i>_<tick>`, '
      + 'so the id carries the tick and the effect index and no author can write it — this row '
      + 'previously said "`entityId` = the artifact node id", which was an instruction nobody '
      + 'could follow, so every `possession` chip in the corpus anchored the *holder* instead. '
      + 'The sentinel resolves to the artifact this encounter minted, preferring the one the '
      + 'actor now holds. `check:encounter` refuses `$artifact` on a template that authors no '
      + '`spawn_artifact` effect.',
  },
  artifact_legendary: {
    anchor: 'Artifact (legendary)',
    declare: '`entityId: \'$artifact\'`, `visualKind: \'artifact\'`',
    surface: 'The artifact sheet, and the bearer\'s possessions',
    status: 'linked',
    note:
      'Same declaration as a common artifact — `$artifact` finds a legendary mint too, since '
      + 'the tier is chosen by the effect and is not the author\'s to name. Legendary ones '
      + 'carry their own trait graph.',
  },
  resource: {
    anchor: 'Resource',
    declare: '`entityId` = the resource node id; no `visualKind` member',
    surface: 'The controlling faction\'s holdings, and the hex it sits on',
    status: 'named',
  },
  action_template: NOT_AN_ANCHOR(
    'Action template',
    'a definition, not an object in the world the player can be pointed at',
  ),
  event: NOT_AN_ANCHOR(
    'Event',
    'the record of a resolution. A chip *is* a report of one; pointing a chip at its own ' +
      'event record says nothing new',
  ),
  cosmology: {
    anchor: 'Sphere / foundation',
    declare: '`tooltipId` on the concept; no `entityId`',
    surface: 'The tooltip, and the cosmology readouts',
    status: 'named',
  },
  region: {
    anchor: 'Named area (region)',
    declare: '`entityId` = the region node id; **no `visualKind` member exists**',
    surface: 'The hex chronicle names the region a hex belongs to',
    status: 'named',
    note:
      'This is the director\'s "named area", and it is real: `worldSeed` flood-fills ' +
      'regions, then names them from historical culture ownership, so a region has a ' +
      'name a player can read. It has no page and no click route. See the borders gap ' +
      'note below for what is still missing.',
  },
  ambition: {
    anchor: 'Ambition',
    declare: '`entityId` = the ambition node id; no `visualKind` member',
    surface: 'The pursuing actor\'s sheet',
    status: 'named',
  },
  encounter_template: NOT_AN_ANCHOR(
    'Encounter template',
    'the encounter itself. A planted seed anchors through its **carrier** — the agent or ' +
      'location it was planted on — never through the template id',
  ),
  relationship: {
    anchor: 'Bond (reified relationship)',
    declare: '`entityId` = the relationship node id; no `visualKind` member',
    surface: 'The cast tile and both participants\' sheets',
    status: 'named',
    note:
      'The director\'s "bond". Prefer this over the bare `relates_to` edge when the ' +
      'relationship has an arc worth naming — the node carries `arc`, `tension_axis` and ' +
      'a history the player can see change.',
  },
  sublocation: {
    anchor: 'Sublocation',
    declare: '`entityId` = the sublocation node id, `visualKind: \'location\'`',
    surface: 'The location sheet of its parent, and the hex it sits on',
    status: 'linked',
    note:
      'Registered in `NodeType` by THR-1177, having been written and read in production ' +
      'while off-union. Note the two mint shapes: `sublocation.ts` mints these as ' +
      '`location` nodes carrying `locationSubtype`, while `strategicGraphOps` mints ' +
      'the bare `sublocation` type — a chip anchoring one shape will not match the ' +
      'other until THR-1183 unifies them.',
  },
  companion: {
    anchor: 'Companion',
    declare: '`entityId` = the companion node id, `visualKind: \'companion\'`',
    surface: 'The Companions row on the bearer\'s own surface',
    status: 'named',
    note:
      'The one kind that is in the `visualKind` union and still does not click, on ' +
      'purpose: a companion is a person but not an agent node, so both the agent drawer ' +
      'and the stub-modal path would open the wrong sheet. Its tile renders; the click ' +
      'is withheld because non-interactive beats wrong.',
  },
};

/** `ActorType` → the anchor kind and route for an `actor` node. */
export const ACTOR_TYPE_ROWS: Readonly<Record<string, AnchorRow>> = {
  god: {
    anchor: 'God',
    declare: '`entityId` = the actor node id, `visualKind: \'agent\'`',
    surface: 'The agent drawer',
    status: 'linked',
  },
  ascendant: {
    anchor: 'Ascendant',
    declare: '`entityId` = the actor node id, `visualKind: \'agent\'`',
    surface: 'The agent drawer',
    status: 'linked',
    note: 'Includes the player\'s own ascendant — the cast actor a player-facing aftermath resolves to.',
  },
  faction: {
    anchor: 'Faction',
    declare: '`entityId` = the actor node id, `visualKind: \'faction\'`',
    surface: 'The faction sheet',
    status: 'linked',
    note:
      'Anchor to the faction **node** id, not its `factionDefId` — chapters of one ' +
      'faction share a def id, so a def id does not identify the body the player dealt with.',
  },
  culture: {
    anchor: 'Culture',
    declare: '`entityId` = the actor node id; no `visualKind` member',
    surface: 'The culture\'s own readouts, and the members\' sheets',
    status: 'named',
  },
  group: {
    anchor: 'Group',
    declare: '`entityId` = the actor node id; no `visualKind` member',
    surface: 'The members\' sheets',
    status: 'named',
  },
  individual: {
    anchor: 'Agent (individual)',
    declare: '`entityId` = the actor node id, `visualKind: \'agent\'`',
    surface: 'The agent drawer',
    status: 'linked',
    note: 'The workhorse anchor. Most chips that name a person mean this one.',
  },
  place_spirit: {
    anchor: 'Place spirit',
    declare: '`entityId` = the actor node id, `visualKind: \'agent\'`',
    surface: 'The agent drawer',
    status: 'linked',
    note: 'An actor node, so the agent route carries it; it embodies a location via `embodies_spirit_of`.',
  },
};

/**
 * `AttachmentCategory` → how a chip anchors a grant.
 *
 * All seven non-companion categories share one declaration form, and the `entityId`
 * is the **template** node id rather than a granted instance: the grant is written
 * by the reaction's effects, which apply after the player picks — at which point
 * the veil has closed. What a chip can honestly link is the thing being granted.
 */
export const ATTACHMENT_ROWS: Readonly<Record<string, AnchorRow>> = {
  possession: {
    anchor: 'Attachment · possession',
    declare: '`entityId` = the **template** node id, `visualKind: \'attachment\'`',
    surface: '`AttachmentDetailView`, also reached from the bearer\'s Attachments tab',
    status: 'linked',
  },
  condition: {
    anchor: 'Attachment · condition',
    declare: '`entityId` = the **template** node id, `visualKind: \'attachment\'`',
    surface: '`AttachmentDetailView`, also reached from the bearer\'s Attachments tab',
    status: 'linked',
    note: 'An injury is a condition with a duration edge and a negative reach modifier.',
  },
  blessing: {
    anchor: 'Attachment · blessing',
    declare: '`entityId` = the **template** node id, `visualKind: \'attachment\'`',
    surface: '`AttachmentDetailView`, also reached from the bearer\'s Attachments tab',
    status: 'linked',
  },
  curse: {
    anchor: 'Attachment · curse',
    declare: '`entityId` = the **template** node id, `visualKind: \'attachment\'`',
    surface: '`AttachmentDetailView`, also reached from the bearer\'s Attachments tab',
    status: 'linked',
  },
  bestowed_power: {
    anchor: 'Attachment · bestowed power',
    declare: '`entityId` = the **template** node id, `visualKind: \'attachment\'`',
    surface: '`AttachmentDetailView`, also reached from the bearer\'s Attachments tab',
    status: 'linked',
  },
  agreement: {
    anchor: 'Attachment · agreement',
    declare: '`entityId` = the **template** node id, `visualKind: \'attachment\'`',
    surface: '`AttachmentDetailView`, also reached from the bearer\'s Attachments tab',
    status: 'linked',
    note: 'The director\'s "agreement" anchor — a pact the simulation holds both sides to.',
  },
  spell: {
    anchor: 'Attachment · spell',
    declare: '`entityId` = the **template** node id, `visualKind: \'attachment\'`',
    surface: '`AttachmentDetailView`, also reached from the bearer\'s Attachments tab',
    status: 'linked',
  },
  companion: {
    anchor: 'Attachment · companion',
    declare: '`entityId` = the companion node id, `visualKind: \'companion\'`',
    surface: 'The Companions row on the bearer\'s own surface',
    status: 'named',
    note: 'Declared as a companion, not an attachment — see the `companion` node row.',
  },
  holding: {
    anchor: 'Attachment · holding',
    declare: '`entityId` = the **owned place\'s** node id (a location or resource), '
      + '`visualKind: \'location\'`',
    surface: 'The Holdings section of the bearer\'s Attachments tab',
    status: 'named',
    note: 'Anchor the PLACE, never the bearer-side face node (THR-1297): the face is '
      + 'bookkeeping that mirrors the `owns` edge, and a chip pointing at it would open a '
      + 'sheet for a record rather than for the mill the player just took. A holding chip '
      + 'is always backed by a real `owns` write (Law 56) — holdings are earned through '
      + 'undertakings and never drawn from a reward pool.',
  },
};

/**
 * `EdgeType` → whether a chip may be *about* this relationship.
 *
 * The director named "a particular relationship (edge) between objects" as a legal
 * anchor, so every edge is classified rather than lumped. An edge anchor is declared
 * by naming **both endpoints** — the edge itself has no page — so its row's surface
 * is where the relationship becomes visible.
 */
export const RELATIONAL = (surface: string, note?: string): AnchorRow => ({
  anchor: 'Relationship (edge)',
  declare: 'Anchor **both endpoint nodes** by `entityId`; the edge itself has no page',
  surface,
  status: 'named',
  ...(note ? { note } : {}),
});

export const STRUCTURAL = (why: string): AnchorRow =>
  NOT_AN_ANCHOR('Structural edge', why);

export const RESERVED_EDGE: AnchorRow = {
  anchor: '—',
  declare: '—',
  surface: '—',
  status: 'reserved',
  note:
    'Declared in `EdgeType` and marked RESERVED — not yet implemented, so nothing ever ' +
    'writes one. Anchoring a chip here would claim state that cannot exist.',
};

export const EDGE_TYPE_ROWS: Readonly<Record<string, AnchorRow>> = {
  // Structural
  contains: STRUCTURAL('containment is map plumbing; anchor the location itself'),
  adjacent: STRUCTURAL('adjacency is geometry, not a relationship the player has with anything'),
  // Trait
  has_trait: RELATIONAL('The bearer\'s trait list', 'Anchor the trait and its bearer, not the edge.'),
  // Possession
  possesses: RELATIONAL('The bearer\'s possessions, and the artifact sheet'),
  bonded_to: RELATIONAL('The bearer\'s possessions, and the legendary artifact\'s own page'),
  accompanies: RELATIONAL('The Companions row on the bearer\'s surface'),
  controls: RELATIONAL('The controlling faction\'s holdings'),
  owns: RELATIONAL(
    'The Holdings section of the owner\'s Attachments tab, and the owned place\'s own page',
    'Anchor the PLACE, not the edge — "Greywater Mill" is what the player recognises. '
    + '`owns` is title, `controls` is jurisdiction; a chip about taking a place from '
    + 'someone is this edge (THR-1297).',
  ),
  // Social
  relates_to: RELATIONAL(
    'The cast tile, and both actors\' sheets',
    'Prefer the reified `relationship` node when the bond has an arc worth naming.',
  ),
  hostile_to: RELATIONAL('Both actors\' sheets'),
  member_of: RELATIONAL(
    'The faction sheet\'s roster, and the member\'s own sheet',
    '`rank` is a 0–1 scale and `role` is derived from reputation — never integer-compare either.',
  ),
  belongs_to: RELATIONAL('The culture\'s readouts, and the member\'s sheet'),
  // Faction work orders + pilgrimage routes (THR-1177) — registered after the audit
  // found live writers with no registry entry at all.
  commissions: RELATIONAL(
    'The faction sheet posted-work list, and the quest itself',
    'Anchor the faction and the quest event node; the edge carries only `expiryTick`.',
  ),
  issues: RELATIONAL(
    'The faction sheet posted-work list, and the bounty itself',
    'Anchor the faction and the bounty event node; the edge carries only `expiryTick`.',
  ),
  sacred_route: RELATIONAL(
    'The consecrating actor sheet, and the destination location',
    'KNOWN GAP: nothing consumes this edge yet (THR-1184), so a chip naming it would ' +
    'report a write that changes nothing — do not anchor one until a consumer exists.',
  ),
  // Reputation (THR-1206) — the pairwise social score. Unlike `sacred_route` above,
  // this ships with its consumers in the same change (eligibility gate, social-scene
  // opening leverage, the Location Profile standing row, the Overview standings), so
  // a chip naming it reports a write that something reads.
  reputation_with: RELATIONAL(
    'The counterparty profile — the Location Profile standing row, or the agent Standings section',
    'Anchor the *counterparty*, not the edge: the chip says "reputation with X", so X is what the player clicks through to.',
  ),
  thread: RELATIONAL('The thread row, and the thread detail view'),
  aspect_of: RELATIONAL('The thread detail view'),
  mentors: RELATIONAL('Both parties\' sheets', 'Carries domain, progress and phase a player can watch move.'),
  // Enchantment — RESERVED
  enchanted: RESERVED_EDGE,
  warded: RESERVED_EDGE,
  cursed: RESERVED_EDGE,
  blessed: RESERVED_EDGE,
  // Location
  located_at: RELATIONAL(
    'The map, and the actor\'s current-position readout',
    'Where someone *is* — the anchor for a chip about arrival or displacement.',
  ),
  avatar_of: RELATIONAL('The avatar and ascendant surfaces'),
  // Action
  performing: STRUCTURAL('in-progress bookkeeping, resolved within the tick'),
  // Cosmology
  aligned_with: RELATIONAL('The alignment readouts'),
  sphere_influence: RELATIONAL('The sphere influence readouts'),
  // Ambition
  pursues: RELATIONAL('The actor\'s sheet'),
  // Infrastructure
  road: RELATIONAL('The map\'s road layer'),
  // Encounter
  encounter_at: STRUCTURAL('availability wiring, invisible to the player'),
  gates_to: STRUCTURAL('template graph wiring; the player sees the unlocked encounter, not the edge'),
  spawns_from: STRUCTURAL('sourcing wiring, invisible to the player'),
  enables: STRUCTURAL('soft-prereq scoring, invisible to the player'),
  // Economic
  trades_with: RELATIONAL('Both actors\' sheets, and the trade readouts'),
  // Encounter history
  participated_in: STRUCTURAL('the history record of a resolution; the chip is already that report'),
  occurred_at: STRUCTURAL('the history record\'s location stamp'),
  // Construction
  constructed_by: RELATIONAL('The structure\'s own page'),
  // Military
  commanded_by: RELATIONAL('The war readout, and the commander\'s sheet'),
  participates_in: RELATIONAL('The war readout'),
  // Spell system
  knows_spell: RELATIONAL('The knower\'s spell list'),
  // Causation
  caused_by: STRUCTURAL(
    'the causal trail between events. Real and inspectable, but it links two records ' +
      'rather than naming a thing the chip is about',
  ),
  // Social leverage
  knows_secret_of: RELATIONAL('The knower\'s sheet', 'A concealed anchor — see the hidden-mark note below.'),
  owes_favor: RELATIONAL('Both parties\' sheets'),
  // Ruins layer
  knows_clue_of: RELATIONAL('The knower\'s sheet'),
  knows_of: RELATIONAL('The knower\'s sheet', 'Familiarity, created when a clue is consumed at convergence.'),
  holds_place_of_power: RELATIONAL('The place-of-power inspector'),
  // Place spirit
  embodies_spirit_of: RELATIONAL('The location, and the spirit\'s own sheet'),
  // Faction succession
  will_succeed: RELATIONAL('The faction sheet'),
  leads: RELATIONAL('The faction sheet', 'Authoritative for the seated leader when present.'),
  // Rival schemes
  sponsors_scheme: RELATIONAL('The target location, and the sponsor\'s sheet'),
};

// ─── Source parsing ───────────────────────────────────────────────────────────

/** Strip `//` line comments so their text cannot contribute quoted members. */
export function stripLineComments(source: string): string {
  return source.replace(/\/\/[^\n]*/g, '');
}

/**
 * Pull the quoted members out of `export type <name> = 'a' | 'b' | …;`.
 *
 * Throws when the union is absent or empty. An empty catalog section is worse than
 * a failed build: it would read as "there are no legal anchors of this kind".
 */
export function parseUnionMembers(source: string, typeName: string, sourceRel: string): string[] {
  const declaration = new RegExp(`export type ${typeName}\\s*=([^;]*);`);
  const match = declaration.exec(source);
  if (!match) {
    throw new Error(
      `generate-anchor-catalog: could not find \`export type ${typeName}\` in ${sourceRel}. ` +
        `The union moved or changed shape — fix the parser rather than shipping a partial catalog.`,
    );
  }

  const members = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (members.length === 0) {
    throw new Error(
      `generate-anchor-catalog: \`${typeName}\` in ${sourceRel} parsed to zero members. ` +
        `Refusing to emit an empty section.`,
    );
  }
  return members;
}

/**
 * Pull the `visualKind` union off `EncounterAftermathConceptRef`.
 *
 * This is the **declaration** vocabulary — the set of kinds a chip may claim — and
 * it is deliberately narrower than the anchor set. It is read so the catalog's
 * "linked" column cannot drift from the field that actually routes.
 */
export function parseVisualKinds(source: string, sourceRel: string): string[] {
  const match = /readonly visualKind\?:([^;]*);/.exec(stripLineComments(source));
  if (!match) {
    throw new Error(
      `generate-anchor-catalog: could not find \`visualKind\` on EncounterAftermathConceptRef in ${sourceRel}.`,
    );
  }
  const kinds = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (kinds.length === 0) {
    throw new Error(`generate-anchor-catalog: \`visualKind\` in ${sourceRel} parsed to zero members.`);
  }
  return kinds;
}

/**
 * The guard that makes this catalog self-maintaining.
 *
 * A derived member with no curated row fails the build **by name**. Without this a
 * new `NodeType` would simply be absent from the table, and absence reads exactly
 * like "not an anchor" — the silent default this whole ticket exists to remove.
 */
export function assertEveryMemberAnnotated(
  members: readonly string[],
  rows: Readonly<Record<string, AnchorRow>>,
  unionName: string,
): void {
  const missing = members.filter((member) => rows[member] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `generate-anchor-catalog: ${missing.length} \`${unionName}\` member(s) have no curated ` +
        `anchor row: ${missing.map((m) => `'${m}'`).join(', ')}.\n` +
        `Classify each one in scripts/generate-anchor-catalog.ts — is it something a chip can ` +
        `be about, and if so where does the player see it? An unclassified member would ` +
        `silently read as "not an anchor".`,
    );
  }

  const stale = Object.keys(rows).filter((key) => !members.includes(key));
  if (stale.length > 0) {
    throw new Error(
      `generate-anchor-catalog: ${stale.length} curated row(s) name a \`${unionName}\` member ` +
        `that no longer exists: ${stale.map((m) => `'${m}'`).join(', ')}. Remove them.`,
    );
  }
}
