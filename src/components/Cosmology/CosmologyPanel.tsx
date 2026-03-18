import { SPHERE_NAMES, type CosmologyProfile, type SphereName } from '../../types';
import { COSMOLOGY_PRESETS, adjustSphere } from '../../engine/cosmology';
import { SphereSlider } from './SphereSlider';

interface CosmologyPanelProps {
  cosmology: CosmologyProfile;
  seed: number;
  onCosmologyChange: (cosmology: CosmologyProfile) => void;
  onSeedChange: (seed: number) => void;
  onGenerate: () => void;
}

export function CosmologyPanel({ cosmology, seed, onCosmologyChange, onSeedChange, onGenerate }: CosmologyPanelProps) {
  const handleSphereChange = (sphere: SphereName, value: number) => {
    onCosmologyChange(adjustSphere(cosmology, sphere, value));
  };
  const handlePreset = (presetName: string) => { onCosmologyChange(COSMOLOGY_PRESETS[presetName]); };
  const handleRandomSeed = () => { onSeedChange(Math.floor(Math.random() * 999999)); };

  return (
    <div className="panel-glass-raised" style={{ padding: 'var(--panel-padding)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <h2 className="section-heading">Creation Spheres</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {SPHERE_NAMES.map(sphere => (
          <SphereSlider key={sphere} sphere={sphere} value={cosmology[sphere]} onChange={handleSphereChange} />
        ))}
      </div>
      <div>
        <p className="section-heading" style={{ marginBottom: 'var(--space-2)' }}>Presets</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(COSMOLOGY_PRESETS).map(name => (
            <button key={name} onClick={() => handlePreset(name)}
              className="px-3 py-1 rounded-full transition-colors"
              style={{
                fontSize: 'var(--text-xs)',
                backgroundColor: 'var(--bg-raised)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-raised)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              {name.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="section-heading">Seed</label>
        <input type="number" value={seed} onChange={(e) => onSeedChange(parseInt(e.target.value) || 0)}
          className="flex-1 rounded px-3 py-1.5 font-mono"
          style={{
            fontSize: 'var(--text-sm)',
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }} />
        <button onClick={handleRandomSeed}
          className="px-3 py-1.5 rounded transition-colors"
          style={{
            fontSize: 'var(--text-xs)',
            backgroundColor: 'var(--bg-raised)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
          title="Random seed">
          🎲
        </button>
      </div>
      <button onClick={onGenerate}
        className="w-full py-2.5 rounded-lg font-semibold transition-colors"
        style={{
          fontSize: 'var(--text-sm)',
          backgroundColor: 'var(--bg-hover)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-medium)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-gold-dim)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; }}
      >
        Generate World
      </button>
    </div>
  );
}
