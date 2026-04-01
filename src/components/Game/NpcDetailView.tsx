import type { GraphNode } from '../../types/graph';

interface NpcDetailViewProps {
  npc: GraphNode;
  traits: string[];
  factionName: string | null;
}

const TIER_LABEL: Record<string, string> = {
  ambient: 'Ambient',
  notable: 'Notable',
};

const TIER_COLOR: Record<string, string> = {
  ambient: 'text-zinc-500',
  notable: 'text-amber-400',
};

export function NpcDetailView({ npc, traits, factionName }: NpcDetailViewProps) {
  const props = (npc.properties ?? {}) as Record<string, unknown>;
  const tier = typeof props.spotlightTier === 'string' ? props.spotlightTier : 'ambient';
  const role = typeof props.npcRole === 'string' ? props.npcRole.replace(/_/g, ' ') : '';
  const sphereAffinity = typeof props.sphereAffinity === 'string' ? props.sphereAffinity : null;

  const tierLabel = TIER_LABEL[tier] ?? tier;
  const tierColor = TIER_COLOR[tier] ?? 'text-zinc-500';

  return (
    <div className="bg-zinc-900 rounded-lg p-4 flex flex-col gap-3">
      {/* Header: name + tier */}
      <div className="flex items-start justify-between gap-2">
        <h2
          className="font-semibold text-zinc-100 tracking-wide"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)' }}
        >
          {npc.name}
        </h2>
        <span
          className={`text-xs font-semibold uppercase tracking-wider mt-0.5 flex-shrink-0 ${tierColor}`}
        >
          {tierLabel}
        </span>
      </div>

      {/* Role */}
      {role && (
        <p className="text-sm text-zinc-400">{role}</p>
      )}

      {/* Sphere affinity */}
      {sphereAffinity && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Sphere</span>
          <span className="text-xs text-zinc-300 font-medium">{sphereAffinity}</span>
        </div>
      )}

      {/* Faction */}
      {factionName && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Affiliation</span>
          <span className="text-xs text-zinc-300 font-medium">{factionName}</span>
        </div>
      )}

      {/* Traits */}
      {traits.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {traits.map(trait => (
            <span
              key={trait}
              className="px-2 py-0.5 rounded text-xs text-zinc-300 bg-zinc-800 border border-zinc-700"
            >
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
