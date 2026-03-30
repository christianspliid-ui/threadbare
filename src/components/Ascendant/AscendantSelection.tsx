import { useState, useMemo } from 'react';
import { generateArchetypes } from '../../engine/ascendant';
import type { AscendantArchetype } from '../../types/influence';
import { ArchetypeCard } from './ArchetypeCard';

interface AscendantSelectionProps {
  seed: number;
  onSelect: (archetype: AscendantArchetype, avatarName: string) => void;
}

const AVATAR_NAMES = [
  'The Wandering Sage',
  'The Veiled Prophet',
  'The Hollow King',
  'The Last Shepherd',
  'The Ashen Oracle',
  'The Thornbearer',
];

export function AscendantSelection({ seed, onSelect }: AscendantSelectionProps) {
  const archetypes = useMemo(() => generateArchetypes(4, seed), [seed]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [avatarName, setAvatarName] = useState('');

  const handleBegin = () => {
    if (selectedIdx === null) return;
    const name = avatarName.trim() || AVATAR_NAMES[Math.floor(Math.random() * AVATAR_NAMES.length)];
    onSelect(archetypes[selectedIdx], name);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center overflow-hidden grain" style={{ backgroundColor: 'var(--bg-abyss)', padding: 'var(--space-8)' }}>
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(212, 160, 64, 0.06) 0%, transparent 70%)',
        }}
      />

      {/* Title */}
      <div className="text-center relative" style={{ marginBottom: 'var(--space-8)' }}>
        <p className="uppercase" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', letterSpacing: '0.4em', marginBottom: 'var(--space-3)' }}>
          The cosmos stirs. A new divinity awakens.
        </p>
        <h1
          className="font-bold tracking-wide"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}
        >
          Choose Your Ascendant
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)', maxWidth: '36rem', marginLeft: 'auto', marginRight: 'auto' }}>
          Each archetype shapes your divine nature — the spheres you command,
          the domains you influence, and the personality of your mortal avatar.
        </p>
      </div>

      {/* Archetype grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full relative" style={{ marginBottom: 'var(--space-8)' }}>
        {archetypes.map((arch, i) => (
          <ArchetypeCard
            key={arch.id}
            archetype={arch}
            selected={selectedIdx === i}
            onClick={() => setSelectedIdx(i)}
          />
        ))}
      </div>

      {/* Avatar name + confirm */}
      <div
        className="max-w-md w-full transition-all duration-500 relative"
        style={{
          display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
          opacity: selectedIdx !== null ? 1 : 0.3,
          pointerEvents: selectedIdx !== null ? 'auto' : 'none',
        }}
      >
        <div>
          <label className="block uppercase" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 'var(--space-2)' }}>
            Name your avatar (or leave blank for a random name)
          </label>
          <input
            type="text"
            value={avatarName}
            onChange={(e) => setAvatarName(e.target.value)}
            placeholder={AVATAR_NAMES[0]}
            className="w-full rounded-lg px-4 py-3 transition-colors focus:outline-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-base)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <button
          onClick={handleBegin}
          disabled={selectedIdx === null}
          className="w-full py-3.5 rounded-lg font-semibold transition-all duration-300 disabled:opacity-30"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
            letterSpacing: '0.05em',
            background: selectedIdx !== null
              ? 'linear-gradient(135deg, var(--accent-gold) 0%, #8b6914 100%)'
              : 'var(--bg-raised)',
            color: selectedIdx !== null ? 'var(--bg-abyss)' : 'var(--text-muted)',
            boxShadow: selectedIdx !== null
              ? '0 4px 15px rgba(212, 160, 64, 0.25)'
              : 'none',
          }}
        >
          Ascend
        </button>
      </div>
    </div>
  );
}
