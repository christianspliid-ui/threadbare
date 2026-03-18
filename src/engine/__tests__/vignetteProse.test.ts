import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  classifyForecast,
  generateVignette,
} from '../vignetteProse';
import type { ForecastTier, VignetteContent } from '../vignetteProse';

// --- Helpers ---

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'agent.1', type: 'actor', name: 'Kira', properties: {} });
  return g;
}

// --- Tests ---

describe('classifyForecast', () => {
  it('classifies doomed for very low probability', () => {
    expect(classifyForecast(0.0)).toBe('doomed');
    expect(classifyForecast(0.14)).toBe('doomed');
  });

  it('classifies perilous for low probability', () => {
    expect(classifyForecast(0.15)).toBe('perilous');
    expect(classifyForecast(0.34)).toBe('perilous');
  });

  it('classifies uncertain for mid probability', () => {
    expect(classifyForecast(0.35)).toBe('uncertain');
    expect(classifyForecast(0.50)).toBe('uncertain');
    expect(classifyForecast(0.64)).toBe('uncertain');
  });

  it('classifies favorable for high probability', () => {
    expect(classifyForecast(0.65)).toBe('favorable');
    expect(classifyForecast(0.84)).toBe('favorable');
  });

  it('classifies fated for very high probability', () => {
    expect(classifyForecast(0.85)).toBe('fated');
    expect(classifyForecast(1.0)).toBe('fated');
  });
});

describe('generateVignette', () => {
  it('returns all four parts of vignette content', () => {
    const g = makeGraph();
    const result = generateVignette(g, 'agent.1', 'enc.1', 'step.1', 'life', 0.5);
    expect(result.scene).toBeTruthy();
    expect(result.lens).toBeTruthy();
    expect(result.stakes).toBeTruthy();
    expect(result.forecast).toBeTruthy();
  });

  it('uses agent name in generated content', () => {
    const g = makeGraph();
    const result = generateVignette(g, 'agent.1', 'enc.1', 'step.1', 'life', 0.5);
    // At least one part should contain the agent name
    const allText = `${result.scene} ${result.lens} ${result.stakes} ${result.forecast}`;
    expect(allText).toContain('Kira');
  });

  it('produces deterministic output for same inputs', () => {
    const g = makeGraph();
    const r1 = generateVignette(g, 'agent.1', 'enc.1', 'step.1', 'entropy', 0.3);
    const r2 = generateVignette(g, 'agent.1', 'enc.1', 'step.1', 'entropy', 0.3);
    expect(r1).toEqual(r2);
  });

  it('produces different output for different encounter IDs', () => {
    const g = makeGraph();
    const r1 = generateVignette(g, 'agent.1', 'enc.1', 'step.1', 'mind', 0.5);
    const r2 = generateVignette(g, 'agent.1', 'enc.2', 'step.1', 'mind', 0.5);
    // Different seeds should usually produce different content (not guaranteed for all pairs, but highly likely)
    const same = r1.scene === r2.scene && r1.lens === r2.lens && r1.forecast === r2.forecast;
    // This is probabilistic but with different hash seeds it should differ
    // We don't require it to differ in ALL parts, just at least one
    expect(r1.scene !== r2.scene || r1.lens !== r2.lens || r1.forecast !== r2.forecast).toBeTruthy();
  });

  it('uses sphere-specific lens content for known spheres', () => {
    const g = makeGraph();
    // Force sphere should produce force-specific lens
    const result = generateVignette(g, 'agent.1', 'enc.1', 'step.1', 'force', 0.5);
    expect(result.lens).toBeTruthy();
    // The lens should not be empty
    expect(result.lens.length).toBeGreaterThan(10);
  });

  it('falls back to default content for unknown sphere', () => {
    const g = makeGraph();
    // 'spirit' is not in our initial content tables, should use default
    const result = generateVignette(g, 'agent.1', 'enc.1', 'step.1', 'spirit', 0.5);
    expect(result.lens).toBeTruthy();
    expect(result.forecast).toBeTruthy();
  });

  it('uses placeholder name when agent not found', () => {
    const g = makeGraph();
    const result = generateVignette(g, 'nonexistent', 'enc.1', 'step.1', 'life', 0.5);
    const allText = `${result.scene} ${result.lens} ${result.stakes} ${result.forecast}`;
    expect(allText).toContain('the agent');
  });

  it('matches forecast to probability', () => {
    const g = makeGraph();
    const doomed = generateVignette(g, 'agent.1', 'enc.1', 'step.1', 'entropy', 0.05);
    const fated = generateVignette(g, 'agent.1', 'enc.1', 'step.1', 'entropy', 0.95);
    // They should have different forecasts (very likely given the content tables)
    expect(doomed.forecast).not.toBe(fated.forecast);
  });
});
