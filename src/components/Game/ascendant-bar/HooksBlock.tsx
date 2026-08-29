/**
 * HooksBlock — conditions, clues, and vows chips.
 * Reads from the ascendant node's attachments in the world graph.
 * THR-184: Ascendant Bar
 *
 * ─── THR-1307: the carrier, and why it changed ───────────────────────────────
 *
 * This block used to read `graph.getOutgoingEdges(ascendantId, 'has_attachment')`.
 * `has_attachment` is not an `EdgeType`, has no `EDGE_SCHEMA` row, and has never had
 * a single writer anywhere in the repo — `src/data/__tests__/graphOp-patterns.test.ts`
 * has documented that gap since the graph-op migration ("wounds must use `has_trait`,
 * not `has_attachment`") and still pins the absence. So the loop below iterated an
 * array that was empty in every world, and all three rows were unreachable code: the
 * bucketing ternary, the Law-14 label fallbacks, the valence handling, and the count
 * beside the section header.
 *
 * The verdict was **repoint, not retire** — the producer exists and always did. In a
 * seeded world `devSeedAscendantTestPackage` writes exactly these three rows onto the
 * ascendant node (`src/engine/gameInit.ts`): four `has_trait` edges to
 * `subcategory: 'condition'` traits, three to `subcategory: 'clue'` traits, and four
 * `relates_to` edges carrying `agreement` properties. Those are the same three families
 * `getAgentAttachments` reads for the character sheet, so the bar and the sheet now
 * agree on what the player holds instead of disagreeing silently.
 *
 * The authored `category` vocabulary is still honoured alongside `subcategory`, because
 * content may write either and dropping one would retire live content to fix a reader.
 *
 * ─── THR-1330: the chip's link half, and why it carries no tile ──────────────
 *
 * Making the rows reachable exposed the chips to Law 1 for the first time: they had a
 * tooltip and neither an image nor a link. Both halves are answered here.
 *
 * **Link — probed, never assumed.** A chip links when, and only when, the concept it
 * names resolves to a sheet: `attachmentDetailFromNode`, the same classifier
 * `resolveAttachmentTemplateDetail` runs for the aftermath chip (THR-1120), decides.
 * That keeps Law 21 honest in both directions — a condition reaches
 * `AttachmentDetailView`, and a clue, whose `clue` subcategory is deliberately outside
 * `ATTACHMENT_TRAIT_SUBCATEGORIES`, stays plain styled text rather than acquiring a
 * link into a blank sheet. Nothing is special-cased per row; the three rows differ in
 * where they land only because the probe answers differently for what they hold. An
 * agreement is edge state with no node at all, so it fails open by the same rule.
 *
 * **Image — none, by the standing ruling.** `EntityVisualKind` excludes `attachment` on
 * purpose (THR-1120: *"an attachment has a page but no entity-visual family … it takes
 * the link tier and no tile, which is the documented fail-open path rather than a wrong
 * glyph"*), and `buildUnifiedEncounterStageModel`'s `resolveIcon` skips the kind for
 * that reason. An attachment's art lives on its own template node as `props.image` and
 * `AttachmentDetailView` draws it; measured at the time of writing, 0 of 214 attachment
 * templates carry one, so a tile here would be a fallback glyph on every chip. Passing
 * `resolveEntityVisual` a borrowed kind to get one is the hand-plumbed second lookup
 * Law 3 forbids. Same representation class, same verdict as the aftermath chip.
 */
import React from 'react';
import type { GameState } from '../../../types/gameState';
import { attachmentDetailFromNode } from '../../../engine/attachmentTemplateDetail';
import { Tooltip } from '../../shared/Tooltip';
import {
  HOOK_LABEL_FALLBACK,
  HOOK_DEF_FALLBACK,
  type HookBucket,
} from '../../../data/ascendant-bar-content';
import styles from './styles.module.css';

// ── Chip valence colors ──────────────────────────────────────────────────────
const VALENCE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  blessing: { bg: 'rgba(180,140,60,0.15)',  border: 'rgba(180,140,60,0.5)',  text: 'var(--accent-gold)' },
  curse:    { bg: 'rgba(150,60,60,0.15)',    border: 'rgba(150,60,60,0.5)',   text: 'var(--negative, #c04040)' },
  neutral:  { bg: 'rgba(80,80,100,0.12)',    border: 'rgba(100,100,120,0.4)', text: 'var(--text-secondary)' },
  clue:     { bg: 'rgba(60,100,140,0.15)',   border: 'rgba(80,130,180,0.45)', text: 'var(--text-secondary)' },
  pact:     { bg: 'rgba(80,60,100,0.15)',    border: 'rgba(120,80,150,0.45)', text: 'var(--text-secondary)' },
  oath:     { bg: 'rgba(80,60,100,0.15)',    border: 'rgba(120,80,150,0.45)', text: 'var(--text-secondary)' },
  debt:     { bg: 'rgba(100,70,50,0.15)',    border: 'rgba(140,90,60,0.45)',  text: 'var(--text-secondary)' },
  attachment: { bg: 'rgba(60,80,60,0.15)',   border: 'rgba(80,110,80,0.45)', text: 'var(--text-secondary)' },
};

interface ChipData {
  id: string;
  label: string;
  def: string;
  valence: string;
  /**
   * The attachment-template node whose sheet this chip opens, when one resolves
   * (THR-1330). Absent means the concept has no page — the chip stays plain
   * styled text and carries no control affordance (Law 21's fail-open, Law 25).
   *
   * Always equal to `id` when present, but kept as its own field so the *decision*
   * is data on the chip rather than a re-derivation at every render site: a reader
   * asking "does this chip link?" must not have to re-run the classifier to find out.
   */
  sheetId?: string;
}

/**
 * Law 14 — an agreement's `type` is an internal enum and never reaches the surface.
 *
 * Only consulted when an agreement edge carries no authored `agreementName`; the dev
 * seed always writes one, so this is the unnamed-content path. Without it the fallback
 * label read `debt with The Grey Seer` — a `snake_case`-family key printed verbatim,
 * which is the exact shape Law 14 forbids. An unrecognised type takes the bucket's
 * plain-English stand-in rather than inventing a word for it.
 */
const AGREEMENT_TYPE_WORD: Record<string, string> = {
  pact: 'A pact',
  oath: 'An oath',
  debt: 'A debt',
  favour: 'A favour',
};

/**
 * Chip hover explanation (THR-1118).
 *
 * Routed through the shared `Tooltip` rather than the bespoke `styles.chipTooltip` div
 * this replaced — Law 17: any hover *explanation* goes through `Tooltip`. Content comes
 * in as an explicit label/desc rather than a registry id because it is instance data off
 * the attachment node (this mark's own name and description), not a concept the registry
 * could hold: the set of attachments is open and authored per-template.
 *
 * The primitive also brings viewport-aware placement, `aria-describedby`, escape-to-close
 * and its own unmount timer cleanup — the last of which is the THR-1108 guarantee, now
 * held by the primitive instead of a copy of it living here.
 */
function Chip({ chip, onOpen }: { chip: ChipData; onOpen?: (sheetId: string) => void }) {
  const colors = VALENCE_COLORS[chip.valence] ?? VALENCE_COLORS.neutral;

  // Law 25 — a control that does nothing does not render as a control (THR-1307).
  // The button affordances were unconditional: `role="button"`, `tabIndex={0}` and an
  // Enter handler advertised a click target on every chip, while `HooksBlock` passes
  // no `onOpen` at all. That was invisible only because the block's carrier was
  // writerless and no chip ever rendered; making the chips reachable would have
  // shipped a keyboard-focusable control that silently does nothing. The hover
  // explanation is the chip's real Tier-1 affordance and is unaffected.
  //
  // THR-1330 — two conditions now, not one. A handler is not enough: the chip must also
  // have somewhere to go. A clue in a bar wired with `onOpenAttachment` would otherwise
  // regain the affordance and open nothing, which is the same released defect with a
  // longer fuse.
  const open = onOpen && chip.sheetId ? () => onOpen(chip.sheetId!) : undefined;

  return (
    <Tooltip label={chip.label} desc={chip.def || HOOK_DEF_FALLBACK}>
      <div
        className={styles.chip}
        style={{
          background: colors.bg, borderColor: colors.border, color: colors.text,
          // The cursor is part of the advertisement (THR-1330). `.chip` set
          // `cursor: pointer` unconditionally, so every inert chip claimed to be
          // clickable in the one channel Law 25 cares about most — the one the player
          // reads before committing to a click. `default` is the honest rest state for
          // a chip whose only affordance is its hover explanation.
          cursor: open ? 'pointer' : 'default',
        }}
        {...(open
          ? {
              onClick: open,
              role: 'button',
              tabIndex: 0,
              // Enter *and* Space: `role="button"` promises both to a screen-reader
              // user, and the pre-THR-1307 handler answered only Enter. Space is also
              // page-scroll by default, so it is prevented once the chip claims it.
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  open();
                }
              },
            }
          : {})}
      >
        {chip.label}
      </div>
    </Tooltip>
  );
}

// ─── Law 14 — a missing name never renders as a node id ───────────────────────

/** Ids already warned about, so an unnamed attachment warns once, not once per render. */
const warnedMissingLabel = new Set<string>();

/**
 * The chip's visible label, or a plain-English stand-in when the node has no name.
 *
 * Law 14: "a key the vocabulary cannot resolve renders as its best plain-English
 * fallback and warns once, never as the key". The previous fall-through ended at
 * `node.id`, so an attachment authored without a `name` put `mark.hollow_touched.7f3a`
 * on the bar as its label — fail-open straight to a raw key, warning nowhere.
 *
 * The warn is what makes this a fallback rather than a cover-up: the chip stays
 * readable for the player (NFP #4) while the missing name stays findable for us.
 */
function resolveChipLabel(
  node: { id: string; name?: string; properties: Record<string, unknown> },
  bucket: HookBucket,
): string {
  // THR-1307: `node.name` FIRST, because that is where a `GraphNode` keeps its name —
  // `properties.name` is the authored-content spelling and a real trait node has none.
  // Reading only the property meant every seeded condition and clue resolved to the
  // Law-14 fallback and warned; the warn never fired in practice only because the
  // block's carrier was writerless, so no node ever reached this function.
  const raw = node.name ?? node.properties.name ?? node.properties.label;
  if (typeof raw === 'string' && raw.trim()) return raw;

  if (!warnedMissingLabel.has(node.id)) {
    warnedMissingLabel.add(node.id);
    console.warn(
      `[HooksBlock] attachment '${node.id}' has no name or label — ` +
      `rendering the '${bucket}' fallback instead of the node id.`,
    );
  }
  return HOOK_LABEL_FALLBACK[bucket];
}

/** Test seam: the warn-once set is module state and would leak between cases. */
export function __resetHookLabelWarnings(): void {
  warnedMissingLabel.clear();
}

interface HooksBlockProps {
  gameState: GameState;
  /**
   * Open the attachment sheet for a template node (THR-1330). Optional: without it
   * every chip stays inert, which is what the block did before and what the styleguide
   * and any graph-free render still get. `GameView` passes the same
   * `setAttachmentSheetId` the aftermath consequence chip uses, so the bar and the
   * ending open one sheet, not two that could drift (Law 3).
   */
  onOpenAttachment?: (templateNodeId: string) => void;
}

/**
 * The bar's three rows, extracted from the ascendant's live graph edges.
 *
 * Exported so `AscendantBar`'s hook count is derived from the same walk that renders
 * the chips (THR-1307). The count used to run its own `getOutgoingEdges(…).length`,
 * which counted *edges* while the block rendered *bucketed chips* — a header reading
 * "4" above three chips was reachable the moment either side started working. One
 * producer, one number.
 */
export function extractChips(gameState: GameState): {
  conditions: ChipData[];
  clues: ChipData[];
  vows: ChipData[];
} {
  const ascendantId = gameState.ascendantId;
  const graph = gameState.graph;

  const conditions: ChipData[] = [];
  const clues: ChipData[] = [];
  const vows: ChipData[] = [];

  // ─── Conditions and clues: `has_trait` → trait node ───────────────────────
  //
  // The same edge family and the same property pair `getAgentAttachments` reads
  // (`subcategory ?? category`), so a trait the character sheet files under
  // Conditions cannot silently fail to reach the bar.
  for (const edge of graph.getOutgoingEdges(ascendantId, 'has_trait')) {
    const node = graph.getNode(edge.target);
    if (!node) continue;
    const p = node.properties;
    const def = (p.description ?? p.flavorText ?? p.mechanicalSummary ?? '') as string;
    const category = (p.subcategory ?? p.category ?? p.attachmentCategory ?? '') as string;
    const valence = (p.valence ?? 'neutral') as string;

    // Bucket first, label second: the label's fallback names the *kind* of thing
    // (THR-1118), so it cannot be resolved before we know which row this lands in.
    // A trait whose category matches no bucket is dropped, as it always was — that
    // is how `bestowed` powers stay off a bar about what pulls on the player, and
    // how a `blessing`/`curse` reaches Conditions only when content tags it one.
    const bucket: HookBucket | null =
      category === 'condition' || category === 'mark' ? 'condition'
      : category === 'clue' || category === 'lore' ? 'clue'
      : category === 'agreement' || category === 'vow' || category === 'pact' ? 'vow'
      : null;
    if (!bucket) continue;

    const label = resolveChipLabel(node, bucket);
    // THR-1330 — the link probe. Asking the sheet's own classifier whether this node
    // *is* an attachment is what stops the three rows from needing three hand-written
    // rules that could disagree with the sheet: a `condition` resolves and links, a
    // `clue` does not and stays plain, and an authored `mark` follows whichever answer
    // the classifier gives rather than whichever this file guessed.
    const sheetId = attachmentDetailFromNode(node) ? node.id : undefined;
    const chip: ChipData = { id: node.id, label, def, valence, sheetId };

    if (bucket === 'condition') {
      conditions.push(chip);
    } else if (bucket === 'clue') {
      clues.push({ ...chip, valence: 'clue' });
    } else {
      vows.push({ ...chip, valence: valence === 'neutral' ? 'pact' : valence });
    }
  }

  // ─── Vows: `relates_to` edges carrying `agreement` properties ─────────────
  //
  // An agreement is edge state, not a node — its terms, tier and type live on the
  // edge and the target is the *counterparty*, so this cannot ride the loop above:
  // reading the counterparty's properties would put a person's name and description
  // on the chip instead of the pact's. Both directions are walked for parity with
  // `getAgentAttachments`, since either party may have authored the edge.
  //
  // THR-1297: holdings are deliberately absent from all three rows. A holding rides
  // `possesses`, which this block does not read at all — a holding is a possession of
  // the world, not a hook pulling on the player, and this bar shows what is tugging at
  // them. Stated rather than left to a silence, so a later author wondering why
  // holdings never appear here finds an answer. They render on the character sheet
  // (`AttachmentsTab`); a holdings row on the bar, if ever wanted, is THR-1299.
  const agreementEdges = [
    ...graph.getOutgoingEdges(ascendantId, 'relates_to'),
    ...graph.getIncomingEdges(ascendantId, 'relates_to'),
  ];
  for (const edge of agreementEdges) {
    const edgeProps = edge.properties as Record<string, unknown>;
    const agreement = edgeProps.agreement as
      | { type?: string; terms?: string }
      | undefined;
    if (!agreement) continue;

    const counterpartyId = edge.source === ascendantId ? edge.target : edge.source;
    const counterpartyName = graph.getNode(counterpartyId)?.name;
    const authored = edgeProps.agreementName;
    const typeWord = agreement.type ? AGREEMENT_TYPE_WORD[agreement.type] : undefined;
    const label =
      typeof authored === 'string' && authored.trim()
        ? authored
        : typeWord && counterpartyName
          ? `${typeWord} with ${counterpartyName}`
          : HOOK_LABEL_FALLBACK.vow;

    // `oath`, `pact` and `debt` each have their own swatch in VALENCE_COLORS; anything
    // else (a `favour`, a type authored later) reads as a pact rather than falling
    // through to the neutral grey, which on this row would look like a missing value.
    const valence =
      agreement.type && agreement.type in VALENCE_COLORS ? agreement.type : 'pact';

    // No `sheetId` (THR-1330). An agreement is edge state — `edge.id` is not a node id,
    // so there is nothing for `AttachmentDetailView` to draw, and its terms are already
    // on the chip's tooltip. Law 21's fail-open: plain styled text, no control. If an
    // agreement ever becomes a node with a page, this is the one line that changes.
    vows.push({ id: edge.id, label, def: agreement.terms ?? '', valence });
  }

  return { conditions, clues, vows };
}

/** Chips actually rendered on the bar — the number the section header shows. */
export function countHooks(gameState: GameState): number {
  const { conditions, clues, vows } = extractChips(gameState);
  return conditions.length + clues.length + vows.length;
}

export function HooksBlock({ gameState, onOpenAttachment }: HooksBlockProps) {
  const { conditions, clues, vows } = extractChips(gameState);

  if (conditions.length === 0 && clues.length === 0 && vows.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-muted)' }}>
        No marks, clues, or vows.
      </div>
    );
  }

  return (
    <div data-testid="ascendant-hooks" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {conditions.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
            Conditions
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {conditions.map((c) => <Chip key={c.id} chip={c} onOpen={onOpenAttachment} />)}
          </div>
        </div>
      )}
      {clues.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
            Clues
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {clues.map((c) => <Chip key={c.id} chip={c} onOpen={onOpenAttachment} />)}
          </div>
        </div>
      )}
      {vows.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
            Vows & Bonds
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {vows.map((v) => <Chip key={v.id} chip={v} onOpen={onOpenAttachment} />)}
          </div>
        </div>
      )}
    </div>
  );
}
