/**
 * generate-anchor-catalog — THR-1154.
 *
 * Emits `.claude/skills/encounter-pipeline/reference/anchor-catalog.generated.md`:
 * the authoring-facing table of every **legal anchor** a consequence chip may point
 * at, how the chip declares it, and which player surface shows it.
 *
 * ## Why generated, and not a hand-written table
 *
 * Christian's direction, chat 2026-08-17: *"we need to have a constantly updated
 * list of game objects and relationships that can be referenced by game logic."*
 * The precedent is `Docs/canon/systems-inventory.md` — hand-written canon drifted
 * (it lost a whole subsystem), a generated inventory cannot. A hand-written anchor
 * table would rot the first time someone adds a `NodeType`, and it would rot
 * silently, which is the failure mode Law 56's second clause exists to prevent.
 *
 * ## The shape of the derivation, and why it is half-curated
 *
 * **Membership is derived. Annotation is curated. A member with no annotation is a
 * hard failure.** That split is the whole design:
 *
 * - Which anchor kinds exist is a fact about the code — the `NodeType`,
 *   `ActorType`, `EdgeType` and `AttachmentCategory` unions, read from source.
 *   Deriving it means a new node type appears in this catalog the day it is added.
 * - *Which player surface shows it* is not machine-derivable — it is a claim about
 *   routing that lives across `openEntity`, the drawers, and the detail views. So
 *   it is curated here, per member.
 * - The guard {@link assertEveryMemberAnnotated} closes the loop: add a `NodeType`
 *   and this generator **fails by name** until someone classifies it. Without that,
 *   a new member would silently classify as "not an anchor" — a silent default, the
 *   exact shape of hole `check-generated-freshness` closes for artifacts.
 *
 * The unions are type-level, so they are erased at runtime and cannot be imported.
 * They are parsed from source text; a union whose shape stops parsing fails loudly
 * rather than emitting an empty table (see {@link parseUnionMembers}).
 *
 * ## Fail-loud, deliberately
 *
 * NFP #4's fail-soft rule governs the tick loop, not the build. A generator that
 * shrugged and emitted a partial catalog would publish an authoring reference that
 * silently under-reports the legal anchors — authors would then fold or drop chips
 * that were in fact anchorable. Every failure here throws.
 *
 * Usage:
 *   npm run generate-anchor-catalog          # write the catalog
 *   npm run generate-anchor-catalog:check    # regenerate + diff vs committed
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { REACH_DOMAINS } from '../src/types/traits';
import {
  ACTOR_TYPE_ROWS,
  ATTACHMENT_ROWS,
  EDGE_TYPE_ROWS,
  NODE_TYPE_ROWS,
  assertEveryMemberAnnotated,
  parseUnionMembers,
  parseVisualKinds,
  stripLineComments,
  type AnchorRow,
  type AnchorStatus,
} from './anchor-catalog-sources.ts';

// ─── Tunable constants (NFP #1) ───────────────────────────────────────────────

const OUTPUT_REL = '.claude/skills/encounter-pipeline/reference/anchor-catalog.generated.md';

const GRAPH_TYPES_REL = 'src/types/graph.ts';
const ATTACHMENT_TYPES_REL = 'src/types/attachments.ts';
const AFTERMATH_TYPES_REL = 'src/types/unifiedAction.ts';

/** The Linear issue tracking the promotion of nations + named areas to real objects. */
const BORDERS_GAP_TICKET = 'THR-1155';

/** The ticket whose gate consumes this catalog's declaration forms. */
const GATE_TICKET = 'THR-1153';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

// ─── Rendering ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Readonly<Record<AnchorStatus, string>> = {
  linked: '🔗 linked',
  named: '📍 named',
  reserved: '⛔ reserved',
  'not-an-anchor': '— not an anchor',
  gap: '🕳️ gap',
};

function renderTable(members: readonly string[], rows: Readonly<Record<string, AnchorRow>>): string[] {
  const lines: string[] = [];
  lines.push('| Member | Anchor | Status | How the chip declares it | Where the player sees it |');
  lines.push('|---|---|---|---|---|');
  for (const member of members) {
    const row = rows[member];
    lines.push(
      `| \`${member}\` | ${row.anchor} | ${STATUS_BADGE[row.status]} | ${row.declare} | ${row.surface} |`,
    );
  }

  const noted = members.filter((member) => rows[member].note);
  if (noted.length > 0) {
    lines.push('');
    for (const member of noted) {
      lines.push(`- **\`${member}\`** — ${rows[member].note}`);
    }
  }
  return lines;
}

/**
 * Tally statuses over already-resolved rows.
 *
 * Takes rows rather than member names on purpose: `companion` is a member of both
 * `NodeType` and `AttachmentCategory`, so a merged name→row lookup would collapse
 * the two into one entry and undercount.
 */
function countByStatus(rows: readonly AnchorRow[]): Record<AnchorStatus, number> {
  const counts: Record<AnchorStatus, number> = {
    linked: 0,
    named: 0,
    reserved: 0,
    'not-an-anchor': 0,
    gap: 0,
  };
  for (const row of rows) counts[row.status] += 1;
  return counts;
}

/** Every classified row, in table order. Shared by the renderer and the summary line. */
function allRows(input: {
  nodeTypes: readonly string[];
  actorTypes: readonly string[];
  edgeTypes: readonly string[];
  attachmentCategories: readonly string[];
}): AnchorRow[] {
  return [
    ...input.nodeTypes.map((m) => NODE_TYPE_ROWS[m]),
    ...input.actorTypes.map((m) => ACTOR_TYPE_ROWS[m]),
    ...input.edgeTypes.map((m) => EDGE_TYPE_ROWS[m]),
    ...input.attachmentCategories.map((m) => ATTACHMENT_ROWS[m]),
  ];
}

function render(input: {
  nodeTypes: string[];
  actorTypes: string[];
  edgeTypes: string[];
  attachmentCategories: string[];
  visualKinds: string[];
}): string {
  const { nodeTypes, actorTypes, edgeTypes, attachmentCategories, visualKinds } = input;

  const rows = allRows({ nodeTypes, actorTypes, edgeTypes, attachmentCategories });
  const anchorable = rows.filter((r) => r.status === 'linked' || r.status === 'named').length;

  const lines: string[] = [];

  lines.push('<!-- GENERATED by scripts/generate-anchor-catalog.ts — do not edit by hand. -->');
  lines.push('<!-- Refresh with `npm run generate-anchor-catalog` (also runs in `prebuild`). -->');
  lines.push('');
  lines.push('# The anchor catalog — what a consequence chip may point at');
  lines.push('');
  lines.push(
    '**Generated.** Membership is derived from the live type unions (`NodeType`, `ActorType`, ' +
      '`EdgeType`, `AttachmentCategory`) so this table cannot drift the way a hand-written one ' +
      'did. Add a node type and it appears here; the generator fails by name until it is ' +
      'classified.',
  );
  lines.push('');
  lines.push(
    `**What this is for.** Law 56's second clause requires a chip's referent to be an existing ` +
      `graph object, resolvable in the live world the player is in, and requires the chip's prose ` +
      `to name *that particular object*. This catalog is the list of objects that sentence can be ` +
      `about. ${GATE_TICKET}'s anchor-resolution gate checks the declaration forms in the fourth ` +
      `column.`,
  );
  lines.push('');
  lines.push(`**Totals.** ${anchorable} anchorable members across ${rows.length} classified.`);
  lines.push('');

  lines.push('## How to read the status column');
  lines.push('');
  lines.push('| Status | Meaning |');
  lines.push('|---|---|');
  lines.push(
    '| 🔗 linked | The chip can carry a live click straight to the object\'s own page. |',
  );
  lines.push(
    '| 📍 named | A real, resolvable object. **Legal to anchor to** — name it in the sentence; ' +
      'the player reaches it by the surface in the last column rather than by clicking the chip. |',
  );
  lines.push(
    '| ⛔ reserved | In the type union, but nothing writes it. Anchoring here claims state that ' +
      'cannot exist. |',
  );
  lines.push('| — not an anchor | Machinery. Not a thing a chip can be *about*. |');
  lines.push('| 🕳️ gap | The director named it as legal and the game has no representation yet. |');
  lines.push('');
  lines.push(
    '**`named` is not second-class.** Both `linked` and `named` satisfy Law 56. The only ' +
      'difference is whether `openEntity` has a route for the kind — it switches on `visualKind`, ' +
      `whose members are exactly \`${visualKinds.join('`, `')}\`. Do not fold a chip merely ` +
      'because its anchor cannot click; fold it when the referent is not a real object at all.',
  );
  lines.push('');

  lines.push('## Nodes');
  lines.push('');
  lines.push(...renderTable(nodeTypes, NODE_TYPE_ROWS));
  lines.push('');

  lines.push('## Actors, by `actorType`');
  lines.push('');
  lines.push(
    'An `actor` node\'s anchor kind comes from `properties.actorType`. This is where the ' +
      'director\'s *agent*, *faction* and *culture* anchors live.',
  );
  lines.push('');
  lines.push(...renderTable(actorTypes, ACTOR_TYPE_ROWS));
  lines.push('');

  lines.push('## Attachments');
  lines.push('');
  lines.push(
    'The director\'s *attachment* anchor — condition, item, artifact, spell, and the rest. All ' +
      'seven non-companion categories share one declaration form, and `entityId` is the ' +
      '**template** node id, never a granted instance: the grant is written by the reaction\'s ' +
      'effects, which apply after the player picks, by which time the veil has closed.',
  );
  lines.push('');
  lines.push(...renderTable(attachmentCategories, ATTACHMENT_ROWS));
  lines.push('');

  lines.push('## Relationships (edges)');
  lines.push('');
  lines.push(
    'The director\'s *"a particular relationship (edge) between objects"*. An edge has no page ' +
      'of its own, so an edge anchor is declared by naming **both endpoints**; the row says where ' +
      'the relationship becomes visible.',
  );
  lines.push('');
  lines.push(...renderTable(edgeTypes, EDGE_TYPE_ROWS));
  lines.push('');

  lines.push('## Stats');
  lines.push('');
  lines.push(
    'The director\'s *"a particular stat on any of these"*. A stat anchor names the bearer **and** ' +
      'the stat: the bearer by `entityId`, the stat by `tooltipId`. A stat sentence with no bearer ' +
      'is not anchored — "confidence spent" names nobody.',
  );
  lines.push('');
  lines.push('| Stat family | How the chip declares it | Where the player sees it |');
  lines.push('|---|---|---|');
  lines.push(
    `| Reach (${REACH_DOMAINS.join(', ')}) | \`tooltipId: 'reach.<domain>'\` on the concept, ` +
      'plus the bearer\'s `entityId` | The bearer\'s reach signature |',
  );
  lines.push(
    '| Standing / reputation | `tooltipId: \'ui.standing\'`, plus the faction\'s `entityId` | ' +
      'The faction sheet, and the actor\'s standing readout |',
  );
  lines.push(
    '| Quintessence | `tooltipId` for the sphere, plus the bearer\'s `entityId` | The bearer\'s ' +
      'quintessence readout |',
  );
  lines.push(
    '| Attachment stat | `tooltipId: \'attachment.<templateId>\'` — derived automatically from ' +
      '`entityId` when `visualKind` is `attachment` | `AttachmentDetailView` |',
  );
  lines.push('');

  lines.push('## Gaps — anchors the director named that the game does not model');
  lines.push('');
  lines.push(
    `Recorded rather than invented, per the ticket's instruction and CLAUDE.md's rule against ` +
      `inventing node types. Tracked by ${BORDERS_GAP_TICKET}.`,
  );
  lines.push('');
  lines.push('| Named anchor | What exists today | Verdict |');
  lines.push('|---|---|---|');
  lines.push(
    '| **Nation** | Nothing. There is no `nation` node type, no nation property, and no ' +
      'border model. Territory is expressed as faction control edges over locations. | ' +
      `🕳️ **gap** — do not anchor to a nation. Anchor the **faction** that holds the ground, ` +
      `which is real and linked. |`,
  );
  lines.push(
    '| **Named area** | `region` nodes are real: flood-filled at worldgen, then named from ' +
      'historical culture ownership, and surfaced in the hex chronicle. | ' +
      '📍 **partial** — anchorable and nameable today; no page and no click route. |',
  );
  lines.push('');
  lines.push(
    `**Why this matters to an author right now.** The Unsafe Bridge is the motivating defect: its ` +
      `\`PATH · THE RIVER CROSSING\` chip named "the river crossing" and "the ford upstream" — ` +
      `landscape fiction, not graph objects — and no pointer could have repaired it. A river is ` +
      `hex state (\`hasRiver\`), not a node, and the encounter can spawn on hexes that have none. ` +
      `When the referent is not in this catalog, the fix is to fold the chip into band prose or ` +
      `bind the encounter's spawn to hexes that carry the feature — never to dress the fiction in ` +
      `a pointer.`,
  );
  lines.push('');

  lines.push('## Two clarifications ratified with the rule');
  lines.push('');
  lines.push(
    '1. **An object the encounter itself creates counts as existing.** A spawned item, a granted ' +
      'condition, a minted relationship — all are legal anchors the moment the encounter writes ' +
      'them. "Existing" means resolvable in the live world after this ending resolves, not ' +
      'pre-existing before it.',
  );
  lines.push(
    '2. **A seed chip anchors through its carrier.** An `encounter_seed` has no page and is not ' +
      'itself a referent. The anchor is the agent or location the seed was planted on, which must ' +
      'be real and must be named in the sentence.',
  );
  lines.push('');
  lines.push(
    '**A concealed anchor is still an anchor.** A `hidden_mark` targeting a declared cast actor ' +
      'is correctly *not* chipped — it is concealed by design, and Law 56 governs what a chip ' +
      'claims, not what the world records.',
  );
  lines.push('');

  return lines.join('\n') + '\n';
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function main(): void {
  const checkOnly = process.argv.includes('--check');

  const readSource = (rel: string): string =>
    fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8');

  const graphSource = stripLineComments(readSource(GRAPH_TYPES_REL));
  const attachmentSource = stripLineComments(readSource(ATTACHMENT_TYPES_REL));
  const aftermathSource = readSource(AFTERMATH_TYPES_REL);

  const nodeTypes = parseUnionMembers(graphSource, 'NodeType', GRAPH_TYPES_REL);
  const actorTypes = parseUnionMembers(graphSource, 'ActorType', GRAPH_TYPES_REL);
  const edgeTypes = parseUnionMembers(graphSource, 'EdgeType', GRAPH_TYPES_REL);
  const attachmentCategories = parseUnionMembers(
    attachmentSource,
    'AttachmentCategory',
    ATTACHMENT_TYPES_REL,
  );
  const visualKinds = parseVisualKinds(aftermathSource, AFTERMATH_TYPES_REL);

  assertEveryMemberAnnotated(nodeTypes, NODE_TYPE_ROWS, 'NodeType');
  assertEveryMemberAnnotated(actorTypes, ACTOR_TYPE_ROWS, 'ActorType');
  assertEveryMemberAnnotated(edgeTypes, EDGE_TYPE_ROWS, 'EdgeType');
  assertEveryMemberAnnotated(attachmentCategories, ATTACHMENT_ROWS, 'AttachmentCategory');

  const rendered = render({
    nodeTypes,
    actorTypes,
    edgeTypes,
    attachmentCategories,
    visualKinds,
  });

  const outPath = path.join(REPO_ROOT, OUTPUT_REL);
  const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf-8') : '';

  if (checkOnly) {
    if (existing !== rendered) {
      console.error(
        `anchor-catalog: STALE — ${OUTPUT_REL} differs from a fresh render. ` +
          `Run \`npm run generate-anchor-catalog\` and commit the result.`,
      );
      process.exit(1);
    }
    console.log(`anchor-catalog: OK — ${OUTPUT_REL} is current.`);
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, rendered, 'utf-8');

  const counts = countByStatus(
    allRows({ nodeTypes, actorTypes, edgeTypes, attachmentCategories }),
  );

  // `nation` is deliberately absent from the counts: it is not a union member, which
  // is precisely the finding. Reporting it as a tallied row would imply the type
  // system knows about it.
  console.log(
    `anchor-catalog: wrote ${OUTPUT_REL} — ` +
      `${counts.linked} linked, ${counts.named} named, ${counts.reserved} reserved, ` +
      `${counts['not-an-anchor']} not-an-anchor. Nation recorded as a gap ` +
      `(no union member exists), tracked by ${BORDERS_GAP_TICKET}.`,
  );
}

main();
