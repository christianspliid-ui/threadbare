/**
 * OmenDetail — flyout modal showing the current omen tracks and their history.
 * Opened by clicking the OmenIndicator in the top-bar.
 * THR-19
 */

import { Modal } from '../shared/Modal';
import type { OmenState, ActiveOmen } from '../../types/omen';
import { getOmenTemplateById } from '../../data/omenTemplates';
import { getSphereColor } from '../../data/sphereIcons';

const OMEN_CATEGORY_GLYPHS: Record<string, string> = {
  doom_echo: '⊘',
  sphere_surge: '◈',
  cultural: '⬡',
  seasonal: '◇',
};

const OMEN_CATEGORY_LABELS: Record<string, string> = {
  doom_echo: 'Doom Echo',
  sphere_surge: 'Sphere Surge',
  cultural: 'Cultural',
  seasonal: 'Seasonal',
};

function intensityLabel(omen: ActiveOmen, currentTick: number): string {
  const pct = (currentTick - omen.startTick) / omen.duration;
  if (pct < 0.25) return 'Freshly risen';
  if (pct < 0.7) return 'Strong';
  return 'Fading';
}

function OmenCard({ omen, currentTick, isPrimary }: { omen: ActiveOmen; currentTick: number; isPrimary: boolean }) {
  const template = getOmenTemplateById(omen.templateId);
  if (!template) return null;

  const glyph = OMEN_CATEGORY_GLYPHS[omen.category] ?? '◇';
  const color = omen.sphere ? getSphereColor(omen.sphere) : 'var(--accent-gold)';
  const intensity = intensityLabel(omen, currentTick);
  const ticksLeft = omen.startTick + omen.duration - currentTick;

  const biasParts: string[] = [];
  for (const [type, val] of Object.entries(template.encounterBias)) {
    if (val > 0) biasParts.push(`${type} +${Math.round(val * 100)}%`);
    else if (val < 0) biasParts.push(`${type} ${Math.round(val * 100)}%`);
  }

  return (
    <div
      style={{
        background: isPrimary ? 'rgba(160,149,107,0.06)' : 'rgba(160,149,107,0.03)',
        border: `1px solid ${isPrimary ? 'rgba(160,149,107,0.2)' : 'rgba(160,149,107,0.1)'}`,
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ color, fontSize: '16px' }}>{glyph}</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {omen.name}
            <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>
              {isPrimary ? 'Primary' : 'Secondary'} · {OMEN_CATEGORY_LABELS[omen.category] ?? omen.category}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {template.tagline}
          </div>
        </div>
      </div>

      {/* Atmosphere */}
      {template.vocabulary.atmosphere.length > 0 && (
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '6px 0', lineHeight: 1.5 }}>
          "{template.vocabulary.atmosphere[0]}"
        </p>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
        <span>{intensity} · {ticksLeft} ticks remaining</span>
        {biasParts.length > 0 && <span>{biasParts.join(', ')}</span>}
      </div>
    </div>
  );
}

interface OmenDetailProps {
  omenState: OmenState;
  currentTick: number;
  onClose: () => void;
}

export function OmenDetail({ omenState, currentTick, onClose }: OmenDetailProps) {
  const recentHistory = [...omenState.history].reverse().slice(0, 5);

  return (
    <Modal open onClose={onClose} maxWidth={480} aria-label="World omen details">
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
            World Omens
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            The world's current atmospheric pressure — atmospheric beats that bias events, color prose, and make the world's current mood legible.
          </p>
        </div>

        {/* Active omens */}
        {omenState.primary ? (
          <OmenCard omen={omenState.primary} currentTick={currentTick} isPrimary />
        ) : (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '8px' }}>
            No primary omen active.
          </p>
        )}
        {omenState.secondary && (
          <OmenCard omen={omenState.secondary} currentTick={currentTick} isPrimary={false} />
        )}

        {/* Recent history */}
        {recentHistory.length > 0 && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Recent Omens
            </div>
            {recentHistory.map((h, i) => {
              const t = getOmenTemplateById(h.templateId);
              return (
                <div key={i} style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: '60px' }}>
                    t{h.startTick}–{h.endTick}
                  </span>
                  <span>{t?.name ?? h.templateId}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
