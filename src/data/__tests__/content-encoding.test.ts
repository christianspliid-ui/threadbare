/**
 * THR-2217 — content files must not carry double-encoded UTF-8 ("mojibake").
 *
 * A file saved after being decoded as Windows-1252 turns every em-dash into
 * a three-character run starting with U+00E2, every box-drawing rule into another,
 * and every accented letter into a U+00C3/U+00C2 pair. Players read those strings
 * verbatim (THR-2217: a broken em-dash in The Gleaming Vein aftermath).
 * This guard walks every source file under src/data and fails on the telltale
 * sequences, so a re-save cannot bring them back.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DATA_ROOT = join(__dirname, '..');
const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.json', '.md'];

/**
 * U+00E2 followed by U+20AC or U+201D (the lead bytes of U+20xx / U+25xx punctuation),
 * or U+00C3/U+00C2 followed by a Latin-1 continuation character — the shapes UTF-8
 * takes after a Windows-1252 round trip. A leading BOM is the same re-save's
 * other fingerprint.
 */
const MOJIBAKE = /\u00E2[\u20AC\u201D]|[\u00C3\u00C2][\u0080-\u00BF]|^\uFEFF/u;

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else if (SCANNED_EXTENSIONS.some((ext) => name.endsWith(ext))) out.push(full);
  }
  return out;
}

describe('content encoding (THR-2217)', () => {
  it('no file under src/data carries double-encoded UTF-8', () => {
    const offenders: string[] = [];
    for (const file of listFiles(DATA_ROOT)) {
      if (file === __filename) continue;
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (MOJIBAKE.test(line)) {
          offenders.push(`${relative(DATA_ROOT, file)}:${i + 1}: ${line.trim().slice(0, 80)}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('the pattern catches the THR-2217 shapes', () => {
    expect(MOJIBAKE.test('the survey is done \u00E2\u20AC\u201D the knowledge')).toBe(true);
    expect(MOJIBAKE.test('// \u00E2\u201D\u20AC Templates')).toBe(true);
    expect(MOJIBAKE.test('caf\u00C3\u00A9')).toBe(true);
    expect(MOJIBAKE.test('the survey is done — the knowledge')).toBe(false);
    expect(MOJIBAKE.test('café · ─── naïve')).toBe(false);
  });
});
