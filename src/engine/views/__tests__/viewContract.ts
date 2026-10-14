/**
 * The checks every view-model family shares (THR-1822 § D17). Test-only.
 *
 * - `assertSerialisable(vm)`: only plain data — `structuredClone` and a JSON round
 *   trip both deep-equal the view model, and no Map, Set, function or class
 *   instance hides inside.
 */
import { expect } from 'vitest';

function findNonPlain(value: unknown, path: string): string | null {
  if (value === null) return null;
  const t = typeof value;
  if (t === 'string' || t === 'boolean' || t === 'undefined') return null;
  if (t === 'number') return Number.isFinite(value as number) ? null : `${path}: non-finite number`;
  if (t === 'function' || t === 'symbol' || t === 'bigint') return `${path}: ${t}`;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findNonPlain(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return `${path}: ${(value as object).constructor?.name ?? 'class instance'}`;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const hit = findNonPlain(v, `${path}.${k}`);
    if (hit) return hit;
  }
  return null;
}

/** JSON writes -0 as 0; a world coordinate of -0 is still plain data, so compare with zeros signless. */
function signlessZeros(value: unknown): unknown {
  if (typeof value === 'number') return value === 0 ? 0 : value;
  if (Array.isArray(value)) return value.map(signlessZeros);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, signlessZeros(v)]));
  }
  return value;
}

export function assertSerialisable(vm: unknown, label = 'view model'): void {
  const hit = findNonPlain(vm, label);
  expect(hit, `${label} is not plain data`).toBeNull();
  expect(structuredClone(vm), `${label} survives structuredClone`).toEqual(vm);
  expect(JSON.parse(JSON.stringify(vm ?? null)), `${label} survives a JSON round trip`).toEqual(signlessZeros(vm ?? null));
}
