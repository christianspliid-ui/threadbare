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
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-5">
      <h2 className="text-lg font-bold text-gray-100 tracking-wide">✧ Cosmology</h2>
      <div className="space-y-1">
        {FORCE_NAMES.map(force => (
          <ForceSlider key={force} force={force} value={cosmology[force]} onChange={handleForceChange} />
        ))}
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Presets</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(COSMOLOGY_PRESETS).map(name => (
            <button key={name} onClick={() => handlePreset(name)}
              className="px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border border-gray-600">
              {name.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 uppercase tracking-widest">Seed</label>
        <input type="number" value={seed} onChange={(e) => onSeedChange(parseInt(e.target.value) || 0)}
          className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 font-mono" />
        <button onClick={handleRandomSeed}
          className="px-3 py-1.5 text-xs rounded bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600" title="Random seed">
          🎲
        </button>
      </div>
      <button onClick={onGenerate}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
        Generate World
      </button>
    </div>
  );
}
