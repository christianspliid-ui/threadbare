import React, { useState, useMemo } from 'react';
import type { WorldGraph } from '../../../engine/graph';
import type { CulturePhoneticSignature } from '../../../types/culture';
import type { CultureIdentity } from '../../../types/culture';
import { generatePhoneticName } from '../../../engine/culturePhonetics';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSamples(
  sig: CulturePhoneticSignature,
  rollSeed: number,
): { personal: string[]; settlement: string[] } {
  const rng = mulberry32((sig.seedHash ^ rollSeed) >>> 0);
  const usedNames = new Set<string>();
  const personal: string[] = [];
  const settlement: string[] = [];
  for (let i = 0; i < 5; i++) {
    const n = generatePhoneticName(sig, 'personal', rng, usedNames, 'preview', 0);
    if (n) personal.push(n);
  }
  for (let i = 0; i < 3; i++) {
    const n = generatePhoneticName(sig, 'settlement', rng, usedNames, 'preview', 0);
    if (n) settlement.push(n);
  }
  return { personal, settlement };
}

export function CulturePhoneticsInspector({ graph }: { graph?: WorldGraph }) {
  const [rollSeed, setRollSeed] = useState(0);

  const cultures = useMemo(() => {
    if (!graph) return [];
    return graph.getNodesByType('culture').map(n => ({
      id: n.id,
      name: n.name,
      sig: n.properties.culturePhoneticSignature as CulturePhoneticSignature | undefined,
      identity: n.properties.cultureIdentity as CultureIdentity | undefined,
    })).filter(c => c.sig != null);
  }, [graph]);

  const culturesWithSamples = useMemo(() => (
    cultures.map(c => ({
      ...c,
      samples: buildSamples(c.sig!, rollSeed),
    }))
  ), [cultures, rollSeed]);

  if (!graph || cultures.length === 0) {
    return <div style={EMPTY_STATE_STYLE}>No cultures with phonetic signatures found.</div>;
  }

  return (
    <div style={{ padding: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
          {cultures.length} culture{cultures.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setRollSeed(s => s + 1)}
          style={{
            fontSize: '11px', padding: '2px 8px',
            background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)', borderRadius: '3px', cursor: 'pointer',
          }}
        >
          Re-roll samples
        </button>
      </div>
      {culturesWithSamples.map(c => (
        <CultureCard key={c.id} id={c.id} name={c.name} sig={c.sig!} identity={c.identity} samples={c.samples} />
      ))}
    </div>
  );
}

function CultureCard({
  id, name, sig, identity, samples,
}: {
  id: string;
  name: string;
  sig: CulturePhoneticSignature;
  identity?: CultureIdentity;
  samples: { personal: string[]; settlement: string[] };
}) {
  const [expanded, setExpanded] = useState(false);

  const sH: React.CSSProperties = {
    fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: '3px', marginTop: '8px',
  };
  const pill = (color = 'var(--text-secondary)'): React.CSSProperties => ({
    display: 'inline-block', padding: '1px 5px', borderRadius: '3px',
    marginRight: '3px', marginBottom: '2px',
    background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
    color, fontSize: '11px',
  });

  return (
    <div style={{
      marginBottom: '10px', padding: '8px',
      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
      borderRadius: '4px',
    }}>
      {/* Header row */}
      <div
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{name}</span>
          {identity?.demonym && (
            <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '11px' }}>
              ({identity.demonym})
            </span>
          )}
          {identity?.foundationBias && (
            <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '11px' }}>
              [{identity.foundationBias}]
            </span>
          )}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Sample names — always visible */}
      <div style={{ marginTop: '6px' }}>
        <div style={sH}>Personal</div>
        <div>
          {samples.personal.length > 0
            ? samples.personal.map((n, i) => <span key={i} style={pill('var(--accent-gold)')}>{n}</span>)
            : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' }}>—</span>}
        </div>
        <div style={sH}>Settlements</div>
        <div>
          {samples.settlement.length > 0
            ? samples.settlement.map((n, i) => <span key={i} style={pill('#7eb5c4')}>{n}</span>)
            : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' }}>—</span>}
        </div>
      </div>

      {/* Phoneme details — expanded */}
      {expanded && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={sH}>Seed hash</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            0x{sig.seedHash.toString(16).toUpperCase().padStart(8, '0')}
          </div>

          <div style={sH}>Orthography</div>
          <div><span style={pill()}>{sig.orthography}</span></div>

          <div style={sH}>Templates</div>
          <div>{sig.syllableTemplates.map((t, i) => <span key={i} style={pill()}>{t}</span>)}</div>

          <div style={sH}>Vowels ({sig.vowels.length})</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
            {sig.vowels.join(', ')}
          </div>

          <div style={sH}>Onsets ({sig.onsets.length})</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
            {sig.onsets.join(', ')}
          </div>

          <div style={sH}>
            Codas {sig.codas.length > 0 ? `(${sig.codas.length})` : '— open syllable'}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
            {sig.codas.length > 0
              ? sig.codas.join(', ')
              : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>none</span>}
          </div>

          <div style={sH}>Syllable ranges</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
            Personal {sig.personalSyllableRange.min}–{sig.personalSyllableRange.max}
            {' · '}
            Settlement {sig.settlementSyllableRange.min}–{sig.settlementSyllableRange.max}
          </div>

          {sig.nameSuffixes.length > 0 && (
            <>
              <div style={sH}>Name suffixes</div>
              <div>
                {sig.nameSuffixes.map((s, i) => <span key={i} style={pill()}>{s || '(empty)'}</span>)}
              </div>
            </>
          )}

          {sig.settlementSuffixes.length > 0 && (
            <>
              <div style={sH}>Settlement suffixes</div>
              <div>
                {sig.settlementSuffixes.map((s, i) => <span key={i} style={pill()}>{s}</span>)}
              </div>
            </>
          )}

          <div style={{ marginTop: '8px', color: 'var(--text-tertiary)', fontSize: '10px' }}>
            {id}
          </div>
        </div>
      )}
    </div>
  );
}
