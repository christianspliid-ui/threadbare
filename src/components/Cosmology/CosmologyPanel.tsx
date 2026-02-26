import { FORCE_NAMES, type CosmologyProfile, type ForceName } from '../../types';
import { COSMOLOGY_PRESETS, adjustForce } from '../../engine/cosmology';
import { ForceSlider } from './ForceSlider';

interface CosmologyPanelProps {
  cosmology: CosmologyProfile;
  seed: number;
  onCosmologyChange: (cosmology: CosmologyProfile) => void;
  onSeedChange: (seed: number) => void;
  onGenerate: () => void;
}

export function CosmologyPanel({ cosmology, seed, onCosmologyChange, onSeedChange, onGenerate }: CosmologyPanelProps) {
  const handleForceChange = (force: ForceName, value: number) => {
    onCosmologyChange(adjustForce(cosmology, force, value));
  };
  const handlePreset = (presetName: string) => { onCosmologyChange(COSMOLOGY_PRESETS[presetName]); };
  const handleRandomSeed = () => { onSeedChange(Math.floor(Math.random() * 999999)); };

  return (
    <div className="bg-stone-700 border border-amber-700 rounded-xl p-5 space-y-5">
      <h2 className="text-lg font-bold text-amber-100 tracking-wide">✧ Cosmology</h2>
      <div className="space-y-1">
        {FORCE_NAMES.map(force => (
          <ForceSlider key={force} force={force} value={cosmology[force]} onChange={handleForceChange} />
        ))}
      </div>
      <div>
        <p className="text-xs text-amber-200 uppercase tracking-widest mb-2">Presets</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(COSMOLOGY_PRESETS).map(name => (
            <button key={name} onClick={() => handlePreset(name)}
              className="px-3 py-1 text-xs rounded-full bg-stone-600 text-amber-200 hover:bg-stone-500 hover:text-amber-100 transition-colors border border-stone-500">
              {name.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-amber-200 uppercase tracking-widest">Seed</label>
        <input type="number" value={seed} onChange={(e) => onSeedChange(parseInt(e.target.value) || 0)}
          className="flex-1 bg-stone-600 border border-stone-500 rounded px-3 py-1.5 text-sm text-amber-50 font-mono" />
        <button onClick={handleRandomSeed}
          className="px-3 py-1.5 text-xs rounded bg-stone-600 text-amber-200 hover:bg-stone-500 border border-stone-500" title="Random seed">
          🎲
        </button>
      </div>
      <button onClick={onGenerate}
        className="w-full py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-amber-50 font-semibold text-sm transition-colors">
        Generate World
      </button>
    </div>
  );
}
