import type { SphereName } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import { getSphereSymbol, getSphereColor } from '../../data/sphereIcons';

const SPHERE_LABELS: Record<SphereName, string> = {
  force: 'Force', matter: 'Matter', energy: 'Energy', life: 'Life',
  mind: 'Mind', spirit: 'Spirit', time: 'Time', entropy: 'Entropy',
};

const REACH_LABELS: Record<string, string> = {
  iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil',
  heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star', flesh: 'Flesh',
};

interface ArchetypeCardProps {
  archetype: AscendantArchetype;
  selected: boolean;
  onClick: () => void;
}

export function ArchetypeCard({ archetype, selected, onClick }: ArchetypeCardProps) {
  const { primary, secondary } = archetype.sphereAlignment;
  const primaryColor = getSphereColor(primary);
  const secondaryColor = getSphereColor(secondary);

  const domains = Object.entries(archetype.startingDomainAffinities)
    .sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <button
      onClick={onClick}
      className="relative group text-left rounded-xl p-5 transition-all duration-300 border-2 w-full"
      style={{
        background: selected
          ? `linear-gradient(135deg, ${primaryColor}22 0%, ${secondaryColor}22 100%)`
          : 'rgba(68, 60, 48, 0.8)',
        borderColor: selected ? primaryColor : 'rgba(120, 100, 70, 0.3)',
        boxShadow: selected
          ? `0 0 20px ${primaryColor}44, 0 0 40px ${primaryColor}22`
          : 'none',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Title */}
      <h3
        className="text-lg font-bold tracking-wide mb-1"
        style={{ fontFamily: 'Cinzel, serif', color: primaryColor }}
      >
        {archetype.title}
      </h3>

      {/* Sphere alignment */}
      <div className="flex items-center gap-3 mb-3">
        <span className="flex items-center gap-1.5 text-sm">
          <span className="text-base" style={{ color: primaryColor }}>{getSphereSymbol(primary)}</span>
          <span style={{ color: primaryColor }} className="font-semibold">
            {SPHERE_LABELS[primary]}
          </span>
        </span>
        <span className="text-amber-600 text-xs">+</span>
        <span className="flex items-center gap-1.5 text-sm">
          <span className="text-base" style={{ color: secondaryColor }}>{getSphereSymbol(secondary)}</span>
          <span style={{ color: secondaryColor }} className="font-medium">
            {SPHERE_LABELS[secondary]}
          </span>
        </span>
      </div>

      {/* Flavor text */}
      <p className="text-sm text-amber-300/80 italic mb-4 leading-relaxed">
        {archetype.flavorText}
      </p>

      {/* Domain affinities */}
      <div className="space-y-1.5">
        <p className="text-xs text-amber-400/60 uppercase tracking-widest">Domain Affinities</p>
        <div className="flex flex-wrap gap-1.5">
          {domains.map(([domain, score]) => (
            <span
              key={domain}
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: `${primaryColor}25`,
                color: primaryColor,
                border: `1px solid ${primaryColor}40`,
              }}
            >
              {REACH_LABELS[domain] ?? domain} {score}
            </span>
          ))}
        </div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <div
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: primaryColor, color: '#1a1510' }}
        >
          ✓
        </div>
      )}
    </button>
  );
}
