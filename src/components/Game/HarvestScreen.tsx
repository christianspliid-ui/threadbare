import type { HarvestResult, HarvestEchoCandidate } from '../../engine/cycleEnd';
import type { HarvestType } from '../../types/worldSoul';

interface HarvestScreenProps {
  harvest: HarvestResult;
  cycle: number;
  onBeginNextCycle: () => void;
}

const HARVEST_STYLES: Record<HarvestType, { title: string; color: string; bg: string }> = {
  triumphant: { title: 'A Triumphant Age', color: '#eab308', bg: 'from-yellow-900/30' },
  bittersweet: { title: 'A Bittersweet Age', color: '#a78bfa', bg: 'from-purple-900/30' },
  somber: { title: 'A Somber Age', color: '#6b7280', bg: 'from-gray-900/30' },
};

function EchoCard({ candidate }: { candidate: HarvestEchoCandidate }) {
  const def = candidate.echoDefinition;
  return (
    <div className="bg-stone-800/60 border border-amber-700/20 rounded-lg p-3 w-56 flex-shrink-0">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-xs font-bold text-amber-100/90 truncate">{def.name}</span>
      </div>
      <p className="text-[10px] text-amber-200/50 leading-relaxed mb-2">{def.summary}</p>
      <div className="flex gap-1">
        {def.sphereAffinities.map(s => (
          <span key={s} className="text-[9px] px-1.5 py-0.5 bg-stone-600/50 rounded text-amber-200/60">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-1 text-[10px] text-amber-200/30">
        Significance: {(candidate.score * 100).toFixed(0)}%
      </div>
    </div>
  );
}

export function HarvestScreen({ harvest, cycle, onBeginNextCycle }: HarvestScreenProps) {
  const style = HARVEST_STYLES[harvest.harvestType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className={`max-w-2xl w-full mx-4 bg-gradient-to-b ${style.bg} to-stone-900 border border-amber-900/30 rounded-xl p-8`}>
        <div className="text-center mb-6">
          <p className="text-xs text-amber-200/40 uppercase tracking-widest mb-1">
            Cycle {cycle} Complete
          </p>
          <h2
            className="text-2xl font-bold tracking-wide"
            style={{ color: style.color, fontFamily: 'Cinzel, serif' }}
          >
            {style.title}
          </h2>
        </div>

        <p className="text-sm text-amber-200/60 text-center italic mb-6 leading-relaxed">
          {harvest.chronicleSummary}
        </p>

        {harvest.cosmicEchoCandidates.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-amber-100/50 uppercase tracking-wider mb-3">
              Echoes Preserved ({harvest.cosmicEchoCandidates.length} cosmic)
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {harvest.cosmicEchoCandidates.map(c => (
                <EchoCard key={c.echoDefinition.id} candidate={c} />
              ))}
            </div>
          </div>
        )}

        {harvest.divineEchoSlots > 0 && (
          <p className="text-xs text-amber-200/40 text-center mb-6">
            {harvest.divineEchoSlots} divine echo slot{harvest.divineEchoSlots > 1 ? 's' : ''} available
            <span className="text-amber-200/20 ml-1">(selection coming in a future update)</span>
          </p>
        )}

        <div className="text-center">
          <button
            onClick={onBeginNextCycle}
            className="px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: style.color,
              color: '#1c1917',
              fontFamily: 'Cinzel, serif',
              boxShadow: `0 0 20px ${style.color}40`,
            }}
          >
            Begin Next Cycle
          </button>
        </div>
      </div>
    </div>
  );
}
