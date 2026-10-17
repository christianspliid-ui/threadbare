import { describe, it, expect } from 'vitest';
import { INSPECTOR_LAB_SUBJECTS } from '../labSubjects';
import { PAGE_KIND_LABELS } from '../../../../../data/detailPageTemplates';
import { buildStressPage, INSPECTOR_LAB_STRESS_NAME_CHARS, INSPECTOR_LAB_STRESS_ROWS, INSPECTOR_LAB_STRESS_SECTIONS } from '../stressFixture';
import { tabsAt, hiddenForWidth } from '../../InspectorPage';

describe('the Inspector lab (THR-1876 § D12)', () => {
  it('every page kind has a lab pick — a kind without one fails here, by name', () => {
    for (const kind of Object.keys(PAGE_KIND_LABELS)) {
      expect(INSPECTOR_LAB_SUBJECTS[kind as keyof typeof INSPECTOR_LAB_SUBJECTS], `no INSPECTOR_LAB_SUBJECTS pick for page kind "${kind}"`).toBeDefined();
    }
    expect(INSPECTOR_LAB_SUBJECTS.missing).toBeDefined();
  });

  it('the stress case is as stressful as the plan says', () => {
    const page = buildStressPage();
    expect(page.header.name.length).toBeGreaterThan(60);
    expect(page.header.name.length).toBeLessThanOrEqual(INSPECTOR_LAB_STRESS_NAME_CHARS);
    expect(page.connections.groups).toHaveLength(1);
    expect(page.connections.groups[0].rows).toHaveLength(INSPECTOR_LAB_STRESS_ROWS);
    expect(page.body).toHaveLength(INSPECTOR_LAB_STRESS_SECTIONS);
    expect(page.inThisLand.rows.map(r => r.id)).toEqual(['people', 'holder']);
  });

  it('docked hides what only wider sizes show, and says so; wide and Full hide nothing', () => {
    const page = buildStressPage();
    expect(tabsAt(page.body, 'docked')[0].sections).toHaveLength(INSPECTOR_LAB_STRESS_SECTIONS - 2);
    expect(hiddenForWidth(page.body, 'docked')).toEqual(['Stress section fourteen', 'Stress section fifteen']);
    expect(hiddenForWidth(page.body, 'wide')).toEqual([]);
    expect(hiddenForWidth(page.body, 'full')).toEqual([]);
  });
});
