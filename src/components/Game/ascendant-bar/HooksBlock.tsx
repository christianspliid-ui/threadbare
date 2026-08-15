/**
 * HooksBlock — conditions, clues, and vows chips.
 * Reads from the ascendant node's attachments in the world graph.
 * THR-184: Ascendant Bar
 */
import React from 'react';
import type { GameState } from '../../../types/gameState';
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
}

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
function Chip({ chip, onOpen }: { chip: ChipData; onOpen?: (chip: ChipData) => void }) {
  const colors = VALENCE_COLORS[chip.valence] ?? VALENCE_COLORS.neutral;

  return (
    <Tooltip label={chip.label} desc={chip.def || HOOK_DEF_FALLBACK}>
      <div
        className={styles.chip}
        style={{
          background: colors.bg, borderColor: colors.border, color: colors.text,
        }}
        onClick={() => onOpen?.(chip)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.(chip); }}
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
  node: { id: string; properties: Record<string, unknown> },
  bucket: HookBucket,
): string {
  const raw = node.properties.name ?? node.properties.label;
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
}

function extractChips(gameState: GameState): {
  conditions: ChipData[];
  clues: ChipData[];
  vows: ChipData[];
} {
  const ascendantId = gameState.ascendantId;
  const graph = gameState.graph;

  const attachmentEdges = graph.getOutgoingEdges(ascendantId, 'has_attachment');

  const conditions: ChipData[] = [];
  const clues: ChipData[] = [];
  const vows: ChipData[] = [];

  for (const edge of attachmentEdges) {
    const node = graph.getNode(edge.target);
    if (!node) continue;
    const p = node.properties;
    const def = (p.description ?? p.flavorText ?? '') as string;
    const category = (p.category ?? p.attachmentCategory ?? '') as string;
    const valence = (p.valence ?? 'neutral') as string;

    // Bucket first, label second: the label's fallback names the *kind* of thing
    // (THR-1118), so it cannot be resolved before we know which row this lands in.
    // An attachment whose category matches no bucket is dropped, as it always was.
    const bucket: HookBucket | null =
      category === 'condition' || category === 'mark' ? 'condition'
      : category === 'clue' || category === 'lore' ? 'clue'
      : category === 'agreement' || category === 'vow' || category === 'pact' ? 'vow'
      : null;
    if (!bucket) continue;

    const label = resolveChipLabel(node, bucket);
    const chip: ChipData = { id: node.id, label, def, valence };

    if (bucket === 'condition') {
      conditions.push(chip);
    } else if (bucket === 'clue') {
      clues.push({ ...chip, valence: 'clue' });
    } else {
      vows.push({ ...chip, valence: valence === 'neutral' ? 'pact' : valence });
    }
  }

  return { conditions, clues, vows };
}

export function HooksBlock({ gameState }: HooksBlockProps) {
  const { conditions, clues, vows } = extractChips(gameState);

  if (conditions.length === 0 && clues.length === 0 && vows.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-muted)' }}>
        No marks, clues, or vows.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {conditions.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
            Conditions
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {conditions.map((c) => <Chip key={c.id} chip={c} />)}
          </div>
        </div>
      )}
      {clues.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
            Clues
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {clues.map((c) => <Chip key={c.id} chip={c} />)}
          </div>
        </div>
      )}
      {vows.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
            Vows & Bonds
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {vows.map((v) => <Chip key={v.id} chip={v} />)}
          </div>
        </div>
      )}
    </div>
  );
}
