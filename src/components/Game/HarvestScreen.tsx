import type { HarvestResult, HarvestEchoCandidate } from '../../engine/cycleEnd';
import type { HarvestType } from '../../types/worldSoul';
import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';

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
      <p className="text-xs text-amber-200/70 leading-relaxed mb-2">{def.summary}</p>
      <div className="flex gap-1">
        {def.sphereAffinities.map(s => (
          <span key={s} className="text-xs px-1.5 py-0.5 bg-stone-600/50 rounded text-amber-200/70">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-1 text-xs text-amber-200/60">
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
          <Tooltip id="ui.harvest_cycle">
            <p className="text-xs text-amber-200/70 uppercase tracking-widest mb-1 cursor-help">
              Cycle {cycle} Complete
            </p>
          </Tooltip>
          <Tooltip id="ui.harvest_type">
            <h2
              className="text-2xl font-bold tracking-wide cursor-help"
              style={{ color: style.color, fontFamily: 'var(--font-display)' }}
            >
              {style.title}
            </h2>
          </Tooltip>
        </div>

        <p className="text-sm text-amber-200/80 text-center italic mb-6 leading-relaxed">
          {harvest.chronicleSummary}
        </p>

        {harvest.cosmicEchoCandidates.length > 0 && (
          <div className="mb-6">
            <Tooltip id="ui.harvest_echo">
              <h3 className="text-xs font-bold text-amber-100/80 uppercase tracking-wider mb-3 cursor-help">
                Echoes Preserved ({harvest.cosmicEchoCandidates.length} cosmic)
              </h3>
            </Tooltip>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {harvest.cosmicEchoCandidates.map(c => (
                <EchoCard key={c.echoDefinition.id} candidate={c} />
              ))}
            </div>
          </div>
        )}

        {harvest.divineEchoSlots > 0 && (
          <p className="text-xs text-amber-200/70 text-center mb-6">
            {harvest.divineEchoSlots} divine echo slot{harvest.divineEchoSlots > 1 ? 's' : ''} available
            <span className="text-amber-200/50 ml-1">(selection coming in a future update)</span>
          </p>
        )}

        <div className="text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={onBeginNextCycle}
            style={{
              backgroundColor: style.color,
              color: '#1c1917',
              fontFamily: 'var(--font-display)',
              boxShadow: `0 0 20px ${style.color}40`,
            }}
          >
            Begin Next Cycle
          </Button>
        </div>
      </div>
    </div>
  );
}
