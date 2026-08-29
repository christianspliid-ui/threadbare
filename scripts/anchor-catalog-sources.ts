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
 * Note `location` covers sublocations too: the three-tier position model
 * (hex → location → sublocation) nests sublocations inside locations as `location`
 * nodes carrying a `parentLocationId` (THR-1183 — the single mint shape). A
 * `sublocation` NodeType *does* exist in the union, but only as a reader-accepted
 * legacy shape (THR-1177) with no producer — see its own row below. An author
 * anchoring to "the tavern's back room" is anchoring to a `location`.
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
      'Registered in `NodeType` by THR-1177 so readers stay legal for saved worlds; since ' +
      'THR-1183 no producer writes the bare type — every sublocation is minted as a ' +
      '`location` node carrying `parentLocationId`. Resolve and test the shape through ' +
      '`src/engine/sublocationShape.ts` (`isSublocationNode` / `resolveToParentLocation`); ' +
      'never hand-roll the two-shape check.',
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
 * Pull the inline string union off a single property declaration.
 *
 * Several of the kind vocabularies are not named types at all — they are inline
 * unions on one field (`readonly visualKind?: 'agent' | …`), which is exactly why
 * they drifted apart: an anonymous union has nowhere to hang a comment saying what
 * it must equal.
 *
 * **Requires exactly one declaration.** Two matches is itself the drift this catalog
 * is looking for — the same vocabulary declared twice in one file — so it fails
 * rather than silently reading the first. The leading boundary keeps `entityKind`
 * from matching a longer property that ends in it.
 */
export function parsePropertyUnionMembers(
  source: string,
  propertyName: string,
  sourceRel: string,
): string[] {
  const declaration = new RegExp(
    `(?:^|[^A-Za-z0-9_$])${propertyName}\\??\\s*:([^;]*);`,
    'gm',
  );
  const matches = [...stripLineComments(source).matchAll(declaration)];

  if (matches.length === 0) {
    throw new Error(
      `generate-anchor-catalog: could not find property \`${propertyName}\` in ${sourceRel}. ` +
        `The field moved or was renamed — fix the parser rather than shipping a catalog that ` +
        `silently stops checking one of the kind vocabularies.`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `generate-anchor-catalog: property \`${propertyName}\` is declared ${matches.length} times ` +
        `in ${sourceRel}. One vocabulary declared twice in one file is the drift this catalog ` +
        `exists to catch — reconcile them, or register the second as its own consumer union.`,
    );
  }

  const members = [...matches[0][1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (members.length === 0) {
    throw new Error(
      `generate-anchor-catalog: \`${propertyName}\` in ${sourceRel} parsed to zero members. ` +
        `Refusing to report a vocabulary as empty.`,
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
  return parsePropertyUnionMembers(source, 'visualKind', sourceRel);
}

/**
 * Pull the `kind` discriminants out of a union of object arms.
 *
 * `NavigationTarget` cannot be read by {@link parseUnionMembers}: its arms carry
 * semicolons *inside* the braces (`{ kind: 'agent'; agentId: string }`), so a
 * `[^;]*` body match stops partway through the first arm and silently reports a
 * one-member union. Brace depth is tracked instead, and the declaration ends at the
 * first `;` at depth zero.
 */
export function parseDiscriminatedUnionKinds(
  source: string,
  typeName: string,
  sourceRel: string,
): string[] {
  const stripped = stripLineComments(source);
  const start = new RegExp(`export type ${typeName}\\s*=`).exec(stripped);
  if (!start) {
    throw new Error(
      `generate-anchor-catalog: could not find \`export type ${typeName}\` in ${sourceRel}. ` +
        `The union moved or changed shape — fix the parser rather than shipping a partial catalog.`,
    );
  }

  const bodyStart = start.index + start[0].length;
  let depth = 0;
  let end = -1;
  for (let i = bodyStart; i < stripped.length; i += 1) {
    const ch = stripped[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (ch === ';' && depth === 0) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    throw new Error(
      `generate-anchor-catalog: \`export type ${typeName}\` in ${sourceRel} has no terminating ` +
        `\`;\` at brace depth zero. Refusing to guess where the union ends.`,
    );
  }

  const kinds = [...stripped.slice(bodyStart, end).matchAll(/kind:\s*'([^']+)'/g)].map((m) => m[1]);
  if (kinds.length === 0) {
    throw new Error(
      `generate-anchor-catalog: \`${typeName}\` in ${sourceRel} parsed to zero \`kind\` ` +
        `discriminants. Refusing to emit an empty section.`,
    );
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

// ─── The kind vocabulary: `WorldRefKind` and its projections (THR-1212) ───────

/**
 * The membership spine's source. Kept here rather than in the generator so the
 * coverage lint can be tested without running file IO through `main()`.
 */
export const WORLD_REF_TYPES_REL = 'src/types/worldRef.ts';

/** The codex-surface deferral cited by every `codex` absence row below. */
export const CODEX_SURFACE_TICKET = 'THR-1315';

/** The ticket that made `attachment`'s absence from `EntityVisualKind` deliberate. */
const ATTACHMENT_VISUAL_TICKET = 'THR-1120';

/**
 * What each `WorldRefKind` names, in one line — the membership spine's annotation.
 *
 * Same split as everywhere else in this file: which kinds exist is derived from
 * `src/types/worldRef.ts`; what each one *means to an author* is curated, and a kind
 * with no row fails the build ({@link assertEveryKindDescribed}).
 *
 * This is a different axis from `NodeType` and not a duplicate of it. `agent` is a
 * kind and `actor` is the node type behind it; `hex` is a kind with no node at all.
 * The spine is the vocabulary a *reference* speaks — the graph's own words are one
 * table down.
 */
export const WORLD_REF_KIND_DESCRIPTIONS: Readonly<Record<string, string>> = {
  agent: 'A person — an `actor` node with a person-like `actorType`. The UI word wins over the graph\'s `actor`.',
  faction: 'An organisation — an `actor` node with `actorType: \'faction\'`. Authored form is `$faction:<defId>`.',
  location: 'A place-tier location node: a settlement, a ruin, a place of power.',
  sublocation: 'A place inside a place — a `location` node carrying `parentLocationId` (THR-1183).',
  hex: 'A map tile, identified by its coordinates (`<col>,<row>`) rather than by a node id.',
  artifact: 'An `artifact` or `artifact_legendary` node.',
  attachment: 'An attachment **template** node id — committed content, never a granted instance.',
  companion: 'A companion — a bonded traveller with a node of their own.',
  army: 'A fielded force, read on the war readout.',
  encounter: 'A live encounter or action, by its runtime id.',
  journey: 'A journey a traveller is on.',
  receipt: 'A divine receipt — the record of one intervention.',
  codex: `A codex entry. Reserved: nothing can route here yet (${CODEX_SURFACE_TICKET}).`,
};

/**
 * The spine's half of the derived/curated contract.
 *
 * Separate from {@link assertEveryMemberAnnotated} only because the spine's annotation
 * is one sentence rather than an {@link AnchorRow} — `anchor`/`declare`/`surface` are
 * questions about a *graph* member, and the spine's members are not all graph members.
 */
export function assertEveryKindDescribed(
  kinds: readonly string[],
  descriptions: Readonly<Record<string, string>> = WORLD_REF_KIND_DESCRIPTIONS,
): void {
  const missing = kinds.filter((kind) => descriptions[kind] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `generate-anchor-catalog: ${missing.length} \`WorldRefKind\`(s) have no spine ` +
        `description: ${missing.map((k) => `'${k}'`).join(', ')}. Add one line per kind to ` +
        `WORLD_REF_KIND_DESCRIPTIONS in scripts/anchor-catalog-sources.ts saying what an ` +
        `author is naming when they use it.`,
    );
  }

  const stale = Object.keys(descriptions).filter((kind) => !kinds.includes(kind));
  if (stale.length > 0) {
    throw new Error(
      `generate-anchor-catalog: ${stale.length} spine description(s) name a \`WorldRefKind\` ` +
        `that no longer exists: ${stale.map((k) => `'${k}'`).join(', ')}. Remove them.`,
    );
  }
}

/**
 * One place the entity-kind vocabulary is spelled, besides `WorldRefKind` itself.
 *
 * `WorldRefKind` is the hub; these are the spokes. The lint below asks two questions
 * of each, and both directions matter:
 *
 * 1. **Does the spoke speak a kind the hub does not have?** That is the direction
 *    that would falsify the normal form — a consumer naming something `WorldRefKind`
 *    cannot express means the hub is not actually the vocabulary.
 * 2. **Is a hub kind missing from the spoke, and is that on purpose?** A projection
 *    admitting fewer kinds is the healthy shape, not a defect — but the *reason* has
 *    to be written down, because an absence with no reason is indistinguishable from
 *    an oversight. That is the same silent-default hole {@link assertEveryMemberAnnotated}
 *    closes for the four membership unions.
 */
export interface ConsumerUnionSpec {
  /** How the union is named in source, for failure messages and the catalog table. */
  readonly label: string;
  readonly sourceRel: string;
  /** One line on what this union is for, rendered into the catalog. */
  readonly what: string;
  /**
   * How to read its members out of the source.
   *
   * Carried on the spec rather than dispatched by label in the generator: the shape
   * a union is written in is a fact about that union, and splitting it from the row
   * is how a registry acquires a second place to update.
   */
  readonly read:
    | { readonly via: 'named-union'; readonly typeName: string }
    | { readonly via: 'property'; readonly propertyName: string }
    | { readonly via: 'discriminated-union'; readonly typeName: string };
  /**
   * Members this union has that are **not** `WorldRefKind`s, each with its reason.
   *
   * Every row here is a claim that the member is not a referenceable kind at all —
   * a render-time refinement, a fallback, machinery. A row whose member later joins
   * `WorldRefKind` is stale and fails.
   */
  readonly extraMembers: Readonly<Record<string, string>>;
  /**
   * `WorldRefKind`s this union deliberately lacks, each with its reason.
   *
   * A row whose kind later appears in the union is stale and fails — which is what
   * makes these rows self-correcting rather than a comment that rots. Adding a
   * `codex` arm to `NavigationTarget` breaks the build by name.
   */
  readonly absentKinds: Readonly<Record<string, string>>;
}

/**
 * The four chip/segment unions are the *same* six-member union, spelled four times.
 *
 * `EncounterAftermathConceptRef.visualKind`, the narrative segment's `entityKind`,
 * `ChangeItem.nounEntityKind` and `NarrativeSegmentRefLike.entityKind` are pinned
 * mirrors of one another — three of the four say so in a doc comment, and until now
 * nothing checked it. {@link assertMirroredUnionsAgree} does.
 *
 * Their shared absences are declared once here so the four rows cannot drift apart
 * by being edited independently — which is the identical failure, one level up.
 */
const CHIP_UNION_ABSENT_KINDS: Readonly<Record<string, string>> = {
  sublocation:
    'A sublocation **is** a `location` node carrying `parentLocationId` (THR-1183), so ' +
    'the narrower word buys an author nothing here — "the tavern\'s back room" declares ' +
    '`location` and resolves to the back room\'s own node.',
  hex:
    'A hex is mutable map state, not a node, and a chip that names terrain is the Unsafe ' +
    'Bridge defect this catalog exists to prevent. Bind the encounter\'s spawn to hexes ' +
    'carrying the feature, or fold the sentence into band prose.',
  army:
    'No authored chip has yet named an army. Legal to add when one does — the kind is real ' +
    'and `EntityVisualKind` already draws it.',
  encounter:
    'A chip is *inside* an encounter\'s aftermath, so naming that encounter is self-reference. ' +
    'The seed clause covers the useful case: a seed chip anchors through its carrier — the ' +
    'agent or location the seed was planted on.',
  journey:
    'An engine report, not a claim authored content makes. A journey is summarised on the ' +
    'traveller\'s sheet; a chip names the traveller.',
  receipt:
    'A divine receipt is the record *of* an intervention, written after the veil closes. ' +
    'Authored content cannot name one that does not exist yet.',
  codex: `Reserved — no in-game codex destination exists (${CODEX_SURFACE_TICKET}).`,
};

/** The six-member chip/segment union, as every one of its four spellings must read. */
const CHIP_UNION_MEMBERS: readonly string[] = [
  'agent',
  'faction',
  'artifact',
  'companion',
  'attachment',
  'location',
];

/**
 * Every consumer union, with its curated dispositions.
 *
 * Seven, and the count is not a target — it is what a sweep for kind-shaped unions
 * found. Adding an eighth means adding a row here; the generator does not discover
 * them, because a union nobody registered is exactly the drift that would go unseen.
 */
export const CONSUMER_UNION_SPECS: readonly ConsumerUnionSpec[] = [
  {
    label: 'EntityVisualKind',
    read: { via: 'named-union', typeName: 'EntityVisualKind' },
    sourceRel: 'src/data/entity-visual-fallbacks.ts',
    what: 'What the entity-visual resolver can draw a tile for.',
    extraMembers: {
      avatar:
        'A render-time refinement of `agent` — the player\'s own vessel, drawn with its own ' +
        'tile. A reference names the agent; the resolver decides it is the avatar.',
      'npc-role':
        'A render-time refinement — an unnamed role-holder (*the smith*) drawn from a role ' +
        'tile. Nothing can reference one, because it has no node of its own.',
      unknown:
        'The resolver\'s fallback tile, not a kind anything can name. Reaching it means ' +
        'resolution failed — which is the drop `__DEBUG.getWorldRefDrops()` records.',
    },
    absentKinds: {
      attachment:
        `Deliberate (${ATTACHMENT_VISUAL_TICKET}). An attachment's art lives on its template ` +
        'node and `AttachmentDetailView` draws it; `resolveIcon` skips the kind rather than ' +
        'resolving a wrong tile. Adding it here would *create* the bug the union prevents at ' +
        'compile time.',
      hex: 'Drawn by the map, not by a tile.',
      journey: 'An event, not an entity with a portrait.',
      receipt: 'A document, not an entity with a portrait.',
      codex: `Reserved — no in-game codex destination exists (${CODEX_SURFACE_TICKET}).`,
    },
  },
  {
    label: 'EncounterAftermathConceptRef.visualKind',
    read: { via: 'property', propertyName: 'visualKind' },
    sourceRel: 'src/types/unifiedAction.ts',
    what: 'What an aftermath chip may claim its referent is. The declaration vocabulary.',
    extraMembers: {},
    absentKinds: CHIP_UNION_ABSENT_KINDS,
  },
  {
    label: 'EncounterStageNarrativeSegment.entityKind',
    read: { via: 'property', propertyName: 'entityKind' },
    sourceRel: 'src/components/Game/encounter-stage/types.ts',
    what: 'What a linked noun inside encounter prose points at.',
    extraMembers: {},
    absentKinds: CHIP_UNION_ABSENT_KINDS,
  },
  {
    label: 'ChangeItem.nounEntityKind',
    read: { via: 'property', propertyName: 'nounEntityKind' },
    sourceRel: 'src/components/Game/encounter-stage/types.ts',
    what: 'What a consequence row\'s subject noun points at (THR-1153).',
    extraMembers: {},
    absentKinds: CHIP_UNION_ABSENT_KINDS,
  },
  {
    label: 'NarrativeSegmentRefLike.entityKind',
    read: { via: 'property', propertyName: 'entityKind' },
    sourceRel: 'src/types/worldRefAdapters.ts',
    what: 'The adapter\'s structural mirror of the segment union, so `src/types/` need not ' +
      'import a component tree.',
    extraMembers: {},
    absentKinds: CHIP_UNION_ABSENT_KINDS,
  },
  {
    label: 'NavigationTarget',
    read: { via: 'discriminated-union', typeName: 'NavigationTarget' },
    sourceRel: 'src/types/notification.ts',
    what: 'Where `openEntity` can actually route. The arms are discriminated by `kind`.',
    extraMembers: {},
    absentKinds: {
      sublocation:
        'Routes through the `location` arm — same node id, and the location sheet is the ' +
        'surface that draws a sublocation.',
      artifact: 'No sheet of its own yet; an artifact is read on its holder\'s sheet.',
      attachment: '`AttachmentDetailView` opens from the bearer, not from a navigation target.',
      companion: 'Read on the company readout, which opens from a member.',
      army: 'Read on the war readout, which opens from the map rather than by reference.',
      codex:
        `Reserved (${CODEX_SURFACE_TICKET}). \`?view=codex\` is a full-page swap that tears ` +
        'down the running simulation, so there is no destination a link may open. ' +
        '`toNavigationTarget` returns `undefined`, which is the fail-soft every unroutable ' +
        'kind takes (NFP #4, Law 21).',
    },
  },
  {
    label: 'EntityNoticeAnchorKind',
    read: { via: 'named-union', typeName: 'EntityNoticeAnchorKind' },
    sourceRel: 'src/types/notification.ts',
    what: 'Whose row in the Threads panel a notice waits on (THR-666, THR-667).',
    extraMembers: {},
    absentKinds: {
      // One reason, eleven times: a notice needs a *row to wait on*, and the Threads
      // panel has rows for threaded agents and factions only. Spelled per kind rather
      // than as a blanket rule so that giving some other kind a row fails here by name.
      location: 'No row in the Threads panel to wait on.',
      sublocation: 'No row in the Threads panel to wait on.',
      hex: 'No row in the Threads panel to wait on.',
      artifact: 'No row in the Threads panel to wait on.',
      attachment: 'No row in the Threads panel to wait on.',
      companion: 'No row in the Threads panel to wait on.',
      army: 'No row in the Threads panel to wait on.',
      encounter:
        'Encounters surface as their own notifications and tug badges, not as a notice ' +
        'waiting on a row.',
      journey: 'Surfaces on the traveller\'s row, so the notice anchors to the `agent`.',
      receipt: 'Divine receipts have their own surface; a notice would double-report them.',
      codex: `Reserved — no in-game codex destination exists (${CODEX_SURFACE_TICKET}).`,
    },
  },
];

/** What {@link assertKindUnionCoverage} resolved for one consumer union. */
export interface KindUnionCoverage {
  readonly spec: ConsumerUnionSpec;
  readonly members: readonly string[];
  /** Members that are `WorldRefKind`s — the hub-and-spoke agreement. */
  readonly mapped: readonly string[];
  /** Members that are not, each carrying a curated reason. */
  readonly extra: readonly string[];
  /** `WorldRefKind`s this union lacks, each carrying a curated reason. */
  readonly absent: readonly string[];
}

/**
 * The kind-union coverage lint — the guard that keeps `WorldRefKind` the vocabulary
 * rather than a fourteenth opinion about entity kinds.
 *
 * Fails by name on four drifts, two of them the *stale-row* direction that makes the
 * dispositions self-correcting instead of comments that rot:
 *
 * 1. a member that is not a `WorldRefKind` and has no `extraMembers` row;
 * 2. a `WorldRefKind` absent from the union with no `absentKinds` row;
 * 3. an `extraMembers` row for something that is now a `WorldRefKind`, or is not in
 *    the union at all;
 * 4. an `absentKinds` row for a kind the union now *has* — the one that fires when
 *    someone closes ${@link CODEX_SURFACE_TICKET} and the reserved rows start lying.
 */
export function assertKindUnionCoverage(
  spec: ConsumerUnionSpec,
  members: readonly string[],
  worldRefKinds: readonly string[],
): KindUnionCoverage {
  const where = `\`${spec.label}\` (${spec.sourceRel})`;

  const mapped = members.filter((member) => worldRefKinds.includes(member));
  const extra = members.filter((member) => !worldRefKinds.includes(member));
  const absent = worldRefKinds.filter((kind) => !members.includes(kind));

  const undocumentedExtra = extra.filter((member) => spec.extraMembers[member] === undefined);
  if (undocumentedExtra.length > 0) {
    throw new Error(
      `generate-anchor-catalog: ${where} has ${undocumentedExtra.length} member(s) that are ` +
        `not \`WorldRefKind\`s and have no disposition: ` +
        `${undocumentedExtra.map((m) => `'${m}'`).join(', ')}.\n` +
        `Either add the kind to \`WorldRefKind\` in ${WORLD_REF_TYPES_REL}, or add an ` +
        `\`extraMembers\` row in scripts/anchor-catalog-sources.ts saying why it is a ` +
        `render-time refinement rather than something a reference can name.`,
    );
  }

  const undocumentedAbsence = absent.filter((kind) => spec.absentKinds[kind] === undefined);
  if (undocumentedAbsence.length > 0) {
    throw new Error(
      `generate-anchor-catalog: ${where} lacks ${undocumentedAbsence.length} \`WorldRefKind\`(s) ` +
        `with no disposition: ${undocumentedAbsence.map((m) => `'${m}'`).join(', ')}.\n` +
        `A projection admitting fewer kinds is fine — an unexplained one is not, because ` +
        `absence reads exactly like an oversight. Add an \`absentKinds\` row saying why, or ` +
        `add the member to the union.`,
    );
  }

  const staleExtra = Object.keys(spec.extraMembers).filter(
    (member) => !extra.includes(member),
  );
  if (staleExtra.length > 0) {
    throw new Error(
      `generate-anchor-catalog: ${where} has ${staleExtra.length} stale \`extraMembers\` ` +
        `row(s): ${staleExtra.map((m) => `'${m}'`).join(', ')}. Each either joined ` +
        `\`WorldRefKind\` or left the union, so the row now describes something that is not ` +
        `the case. Remove it.`,
    );
  }

  const staleAbsence = Object.keys(spec.absentKinds).filter((kind) => !absent.includes(kind));
  if (staleAbsence.length > 0) {
    throw new Error(
      `generate-anchor-catalog: ${where} has ${staleAbsence.length} stale \`absentKinds\` ` +
        `row(s): ${staleAbsence.map((m) => `'${m}'`).join(', ')}. The union now carries ` +
        `them (or they are no longer \`WorldRefKind\`s), so the catalog would keep publishing ` +
        `an absence that is no longer true. Update the row — and if this is the ` +
        `${CODEX_SURFACE_TICKET} codex arm landing, the catalog's reserved badge goes with it.`,
    );
  }

  return { spec, members, mapped, extra, absent };
}

/**
 * The four chip/segment unions must be spelled identically, and {@link CHIP_UNION_MEMBERS}
 * must say what that spelling is.
 *
 * **What this adds over the coverage lint, precisely.** Because all four specs share one
 * {@link CHIP_UNION_ABSENT_KINDS} record, {@link assertKindUnionCoverage} already fails
 * when one mirror diverges from the others: the odd one out either carries a kind the
 * shared record calls absent (stale-absence) or drops one the record does not mention
 * (undocumented-absence). Verified by controlled arm — adding `army` to the adapter
 * mirror alone fails in the coverage lint, before this function is reached.
 *
 * So this guard is **not** the net that catches one copy falling behind; the shared
 * record is. What it uniquely catches is the case where all four move *together* and
 * `CHIP_UNION_MEMBERS` — the constant that records what "pinned" means — is left behind.
 * That constant is the only written statement of the canonical spelling, so a stale one
 * would leave the four agreeing with each other and with nothing else.
 *
 * Stated at this length because the three doc comments in `src/` that claim these unions
 * are pinned were, until now, checked by nothing at all; a guard that overstated its own
 * reach would repeat that failure one level up.
 */
export function assertMirroredUnionsAgree(
  coverages: readonly KindUnionCoverage[],
  expected: readonly string[] = CHIP_UNION_MEMBERS,
): void {
  const mirrors = coverages.filter((c) => c.spec.absentKinds === CHIP_UNION_ABSENT_KINDS);

  const canonical = [...expected].sort().join(' | ');
  const disagreeing = mirrors.filter(
    (c) => [...c.members].sort().join(' | ') !== canonical,
  );

  if (disagreeing.length > 0) {
    throw new Error(
      `generate-anchor-catalog: ${disagreeing.length} of the ${mirrors.length} pinned chip/` +
        `segment kind unions disagree with the others:\n` +
        disagreeing
          .map((c) => `  ${c.spec.label} (${c.spec.sourceRel}) = ${c.members.join(' | ')}`)
          .join('\n') +
        `\n  expected: ${expected.join(' | ')}\n` +
        `These four are one union spelled four times and three of them say so in a doc ` +
        `comment. Change all four together, and update CHIP_UNION_MEMBERS in ` +
        `scripts/anchor-catalog-sources.ts.`,
    );
  }
}
