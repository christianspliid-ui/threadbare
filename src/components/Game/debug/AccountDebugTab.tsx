/**
 * Account — the designer readout for the account record (THR-1813).
 *
 * The same fields `window.__DEBUG.getAccountRecord()` returns: the runs carried,
 * the next world's seed, the hungers awake and stirring, the sealed cards (THR-1844), the live echoes with
 * their memory, the World-Soul's tilt, and its memories of each age (THR-1381).
 * Raw numbers are correct here: this is the designer view (Law 13 bans them on
 * player surfaces only).
 */
import React from 'react';
import type { AccountRecord } from '../../../types/account';
import { SPHERE_NAMES } from '../../../types/index';
import { echoDisplayName, memoryWord } from '../../../data/account-content';
import { liveEchoes, sealedCardIds } from '../../../engine/accountRecord';
import { godCards } from '../../../engine/godProgression';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

const ROW: React.CSSProperties = { display: 'flex', gap: 8, fontSize: 'var(--text-xs)', padding: '2px 0' };
const KEY: React.CSSProperties = { color: 'var(--text-muted)', minWidth: 120 };

export function AccountDebugTab({ account }: { account?: AccountRecord | null }) {
  if (!account) return <div style={EMPTY_STATE_STYLE}>No account record for this world.</div>;
  const live = liveEchoes(account);
  const even = 1 / SPHERE_NAMES.length;
  const tilt = SPHERE_NAMES
    .map(s => ({ s, d: account.fundament.sphereWeights[s] - even }))
    .filter(x => Math.abs(x.d) > 1e-4)
    .sort((a, b) => b.d - a.d);
  return (
    <div data-testid="debug-account-tab" style={{ padding: 8 }}>
      <div style={ROW}><span style={KEY}>runs carried</span><span>{account.cycleCount}</span></div>
      <div style={ROW}><span style={KEY}>next world seed</span><span>{account.nextWorldSeed}</span></div>
      <div style={ROW}><span style={KEY}>awake hungers</span><span>{account.awakeHungerIds.join(', ') || '—'}</span></div>
      <div style={ROW}><span style={KEY}>stirring</span><span>{account.stirringHungerIds.join(', ') || '—'}</span></div>
      <div style={ROW}><span style={KEY}>second courts</span><span>{account.secondCourtHungerIds.join(', ') || '—'}</span></div>
      {/* THR-1844 — the sealed god cards (computed from the catalog) and what has been unsealed. */}
      <div style={ROW}><span style={KEY}>sealed cards</span><span>{sealedCardIds(account, godCards()).length}</span></div>
      <div style={ROW}><span style={KEY}>unsealed</span><span>{account.unsealedCardIds.join(', ') || '—'}</span></div>
      <div style={ROW}><span style={KEY}>fundament blends</span><span>{account.fundament.cycleCount}</span></div>
      <div style={ROW}><span style={KEY}>tilt</span><span>{tilt.map(t => `${t.s} ${t.d > 0 ? '+' : ''}${t.d.toFixed(3)}`).join(' · ') || 'even'}</span></div>
      {account.lastRun && (
        <div style={ROW}><span style={KEY}>last god</span><span>{account.lastRun.divineName} ({account.lastRun.primary}/{account.lastRun.secondary}, {account.lastRun.hungerId}, {account.lastRun.harvestType})</span></div>
      )}
      <div style={{ ...ROW, marginTop: 6 }}><span style={KEY}>live echoes</span><span>{live.length}</span></div>
      {live.map(({ def, state }) => (
        <div key={def.id} style={{ ...ROW, paddingLeft: 12 }}>
          <span style={KEY}>{def.echoType} · {def.source}</span>
          <span>{echoDisplayName(def)} — {memoryWord(state.degradation) ?? 'faded'} ({state.degradation.toFixed(2)}) · {def.sphereAffinities.join('/')}</span>
        </div>
      ))}
      {/* THR-1381 — the World-Soul's memories, one line per age remembered. */}
      <div style={{ ...ROW, marginTop: 6 }}><span style={KEY}>memories</span><span>{account.resonance.memories.length}</span></div>
      {account.resonance.memories.map(m => (
        <div key={m.id} style={{ ...ROW, paddingLeft: 12 }} data-testid="debug-account-memory">
          <span style={KEY}>{m.memoryType} · age {m.cycleOrigin}</span>
          <span>{m.summary} — {memoryWord(m.degradation) ?? 'faded'} ({m.degradation.toFixed(2)})</span>
        </div>
      ))}
    </div>
  );
}
