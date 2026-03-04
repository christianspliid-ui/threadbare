import { describe, it, expect } from 'vitest';
import {
  createGreatChronicle,
  createVolume,
  addChapter,
  addInterlude,
  closeVolume,
  addEchoThreadAppearance,
  getVolumeTitle,
} from '../chronicle';
import type { ChronicleChapter, ChronicleInterlude } from '../../types/chronicle';

describe('Great Chronicle', () => {
  it('createGreatChronicle returns empty chronicle', () => {
    const c = createGreatChronicle();
    expect(c.volumes).toHaveLength(0);
    expect(c.echoThreads).toHaveLength(0);
  });

  it('getVolumeTitle generates doom-archetype-based title', () => {
    expect(getVolumeTitle('breach', 1)).toBe('Volume I: The Age of the Breach');
    expect(getVolumeTitle('failing', 3)).toBe('Volume III: The Age of the Failing');
    expect(getVolumeTitle('convergence', 2)).toBe('Volume II: The Age of the Convergence');
  });

  it('createVolume adds a new volume to the chronicle', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    expect(c.volumes).toHaveLength(1);
    expect(c.volumes[0].cycleNumber).toBe(1);
    expect(c.volumes[0].title).toBe('Volume I: The Age of the Breach');
    expect(c.volumes[0].chapters).toHaveLength(0);
  });

  it('addChapter appends a chapter to the latest volume', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    const chapter: ChronicleChapter = {
      id: 'ch_001',
      title: 'The Siege',
      prose: 'Fire rained down...',
      tick: 30,
      significance: 0.88,
      spheres: ['force', 'entropy'],
      actorIds: ['actor_a'],
    };
    c = addChapter(c, chapter);
    expect(c.volumes[0].chapters).toHaveLength(1);
    expect(c.volumes[0].chapters[0].title).toBe('The Siege');
  });

  it('addInterlude appends an interlude to the latest volume', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    const interlude: ChronicleInterlude = {
      id: 'int_001',
      summary: 'Trade routes reopened.',
      tickRange: { start: 10, end: 29 },
      eventCount: 8,
    };
    c = addInterlude(c, interlude);
    expect(c.volumes[0].interludes).toHaveLength(1);
  });

  it('closeVolume sets the harvest summary on the latest volume', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    c = closeVolume(c, 'The breach consumed all, yet seeds of order survived.');
    expect(c.volumes[0].harvestSummary).toBe('The breach consumed all, yet seeds of order survived.');
  });

  it('addEchoThreadAppearance creates a new thread if none exists', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    c = addEchoThreadAppearance(c, 'echo_001', 1, 'vol_001', 'First forged in the Age of the Breach.');
    expect(c.echoThreads).toHaveLength(1);
    expect(c.echoThreads[0].echoId).toBe('echo_001');
    expect(c.echoThreads[0].appearances).toHaveLength(1);
  });

  it('addEchoThreadAppearance appends to existing thread', () => {
    let c = createGreatChronicle();
    c = addEchoThreadAppearance(c, 'echo_001', 1, 'vol_001', 'First appearance.');
    c = addEchoThreadAppearance(c, 'echo_001', 3, 'vol_003', 'Appeared again as a ruin.');
    expect(c.echoThreads).toHaveLength(1);
    expect(c.echoThreads[0].appearances).toHaveLength(2);
  });

  it('supports multiple volumes across cycles', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    c = closeVolume(c, 'End of cycle 1.');
    c = createVolume(c, 2, 'failing');
    c = closeVolume(c, 'End of cycle 2.');
    expect(c.volumes).toHaveLength(2);
    expect(c.volumes[1].title).toBe('Volume II: The Age of the Failing');
  });
});
