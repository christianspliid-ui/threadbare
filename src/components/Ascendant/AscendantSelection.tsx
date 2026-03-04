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
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-8">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(180, 130, 60, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Title */}
      <div className="text-center mb-10 relative">
        <p className="text-amber-600/60 text-xs uppercase tracking-[0.4em] mb-3">
          The cosmos stirs. A new divinity awakens.
        </p>
        <h1
          className="text-4xl font-bold text-amber-100 tracking-wide"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          Choose Your Ascendant
        </h1>
        <p className="text-amber-400/50 text-sm mt-3 max-w-xl mx-auto">
          Each archetype shapes your divine nature — the spheres you command,
          the domains you influence, and the personality of your mortal avatar.
        </p>
      </div>

      {/* Archetype grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mb-8 relative">
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
        className="max-w-md w-full space-y-4 transition-all duration-500 relative"
        style={{
          opacity: selectedIdx !== null ? 1 : 0.3,
          pointerEvents: selectedIdx !== null ? 'auto' : 'none',
        }}
      >
        <div>
          <label className="block text-xs text-amber-400/60 uppercase tracking-widest mb-2">
            Name your avatar (or leave blank for a random name)
          </label>
          <input
            type="text"
            value={avatarName}
            onChange={(e) => setAvatarName(e.target.value)}
            placeholder={AVATAR_NAMES[0]}
            className="w-full bg-stone-800 border border-amber-700/30 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-800/50 focus:outline-none focus:border-amber-600/60 transition-colors"
            style={{ fontFamily: 'Cinzel, serif' }}
          />
        </div>
        <button
          onClick={handleBegin}
          disabled={selectedIdx === null}
          className="w-full py-3.5 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-30"
          style={{
            fontFamily: 'Cinzel, serif',
            background: selectedIdx !== null
              ? 'linear-gradient(135deg, #b8860b 0%, #8b6914 100%)'
              : '#3a3020',
            color: '#fef3c7',
            boxShadow: selectedIdx !== null
              ? '0 4px 15px rgba(184, 134, 11, 0.3)'
              : 'none',
          }}
        >
          ✧ Ascend ✧
        </button>
      </div>
    </div>
  );
}
