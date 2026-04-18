/**
 * HooksBlock — conditions, clues, and vows chips.
 * Reads from the ascendant node's attachments in the world graph.
 * THR-184: Ascendant Bar
 */
import React, { useRef, useState } from 'react';
import type { GameState } from '../../../types/gameState';
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

const TOOLTIP_DELAY_MS = 600;

function Chip({ chip, onOpen }: { chip: ChipData; onOpen?: (chip: ChipData) => void }) {
  const colors = VALENCE_COLORS[chip.valence] ?? VALENCE_COLORS.neutral;
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = () => {
    timerRef.current = setTimeout(() => setShow(true), TOOLTIP_DELAY_MS);
  };
  const onMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  };

  return (
    <div
      className={styles.chip}
      style={{
        background: colors.bg, borderColor: colors.border, color: colors.text,
      }}
      onClick={() => onOpen?.(chip)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.(chip); }}
    >
      {chip.label}
      {show && chip.def && (
        <div className={styles.chipTooltip} style={{ borderLeftColor: colors.border }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>{chip.label}</div>
          <div style={{
            fontFamily: 'var(--font-body)', fontStyle: 'italic',
            fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)',
          }}>{chip.def}</div>
        </div>
      )}
    </div>
  );
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
    const label = (p.name ?? p.label ?? node.id) as string;
    const def = (p.description ?? p.flavorText ?? '') as string;
    const category = (p.category ?? p.attachmentCategory ?? '') as string;
    const valence = (p.valence ?? 'neutral') as string;

    const chip: ChipData = { id: node.id, label, def, valence };

    if (category === 'condition' || category === 'mark') {
      conditions.push(chip);
    } else if (category === 'clue' || category === 'lore') {
      clues.push({ ...chip, valence: 'clue' });
    } else if (category === 'agreement' || category === 'vow' || category === 'pact') {
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
