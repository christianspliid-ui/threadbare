import type { GraphNode } from '../../types/graph';

interface LocationViewProps {
  location: GraphNode;
  agents: GraphNode[];
  hexTerrain: string;
  hexCol: number;
  hexRow: number;
  onAgentClick: (agentId: string) => void;
  onBack: () => void;
}

// Agent color by name hash (same as HexZoomView)
function agentColor(name: string): string {
  const colors = ['#cc3333', '#33cc66', '#6699ff', '#cc99ff', '#ff9933', '#ffcc00', '#8b7355', '#666666'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

export function LocationView({
  location,
  agents,
  hexTerrain,
  hexCol,
  hexRow,
  onAgentClick,
  onBack,
}: LocationViewProps) {
  const terrainLabel = hexTerrain.charAt(0).toUpperCase() + hexTerrain.slice(1).replace(/_/g, ' ');
  const locType = (location.properties as Record<string, unknown>).locationType as string || 'location';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-stone-800/90 border-b border-amber-900/30">
        <button
          onClick={onBack}
          aria-label="back"
          className="text-amber-400 hover:text-amber-200 transition-colors text-lg px-2"
        >
          ←
        </button>

        {/* Location icon placeholder */}
        <div className="w-8 h-8 rounded-full bg-stone-800 border border-amber-900/40 flex-shrink-0" />

        <div>
          <h2
            className="text-amber-100 text-sm font-semibold tracking-wide"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {location.name}
          </h2>
          <p className="text-amber-400/50 text-xs">
            {locType} · in {terrainLabel} Hex ({hexCol}, {hexRow})
          </p>
        </div>
      </div>

      {/* Establishing shot placeholder */}
      <div
        className="mx-4 mt-4 rounded border border-amber-900/20 bg-stone-800/60 flex items-center justify-center"
        style={{ aspectRatio: '16/9', maxHeight: '200px' }}
      >
        <span
          className="text-amber-400/30 text-sm"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          — establishing shot —
        </span>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left: Agents Present */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-2"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Agents Present
          </h3>

          {agents.length === 0 ? (
            <p className="text-amber-400/30 text-xs italic">No agents present</p>
          ) : (
            <div className="space-y-1">
              {agents.map(agent => {
                const props = agent.properties as Record<string, unknown>;
                const actorType = props.actorType as string || 'unknown';

                return (
                  <button
                    key={agent.id}
                    onClick={() => onAgentClick(agent.id)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-amber-900/20 transition-colors group"
                  >
                    {/* Agent square */}
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: agentColor(agent.name) }}
                    >
                      <span className="text-white text-xs font-bold">
                        {agent.name.charAt(0)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-amber-100 text-sm truncate group-hover:text-amber-50">
                        {agent.name}
                      </p>
                      <p className="text-amber-400/40 text-xs">
                        {actorType}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Ordeals placeholder */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-2"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Ordeals
          </h3>
          <p className="text-amber-400/30 text-xs italic">No active Ordeals</p>
        </div>
      </div>
    </div>
  );
}
