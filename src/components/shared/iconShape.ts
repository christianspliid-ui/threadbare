/**
 * iconShape — the one resolver from an icon name to its shape (THR-1885, Law 3).
 *
 * Every surface that draws an icon asks here: `Icon`, and the map's one icon texture builder
 * (`buildMapIconTexture` in `locationIconTextures.ts`, THR-1903), so a castle looks the same on
 * the map and in the panel.
 *
 * A name with no entry (data from content, a stale save) resolves to the designed `fallback`
 * shape and warns once per name — never a blank, never a throw (Law 4, NFP #4).
 */

import {
  FALLBACK_ICON_NAME,
  ICON_REGISTRY,
  type IconEntry,
  type IconName,
  type IconShape,
} from '../../data/icons/iconRegistry';

const warnedNames = new Set<string>();

/** Whether `name` is a registry key. */
export function isIconName(name: string): name is IconName {
  return Object.prototype.hasOwnProperty.call(ICON_REGISTRY, name);
}

/** The registry entry for a name, or the fallback's entry (warning once) when it has none. */
export function resolveIconEntry(name: string): IconEntry {
  if (isIconName(name)) return ICON_REGISTRY[name];
  if (!warnedNames.has(name)) {
    warnedNames.add(name);
    console.warn(`[Icon] no registry entry for "${name}"; drawing the fallback mark`);
  }
  return ICON_REGISTRY[FALLBACK_ICON_NAME];
}

/** The shape to draw for a name. */
export function iconShape(name: string): IconShape {
  return resolveIconEntry(name).shape;
}

/** Test hook: forget which unknown names already warned. */
export function resetIconWarningsForTest(): void {
  warnedNames.clear();
}

// ─── Path-data check ─────────────────────────────────────────────────────────

/** How many numbers each SVG path command takes per repetition. */
const PATH_COMMAND_ARITY: Readonly<Record<string, number>> = {
  m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0,
};

const PATH_TOKEN = /([MmLlHhVvCcSsQqTtAaZz])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)|([\s,]+)|(.)/g;

/**
 * Whether `d` is well-formed SVG path data: it starts with a moveto, uses only path
 * commands, and gives every command a whole number of argument sets. The registry test runs
 * this over every entry, because a malformed path draws nothing in the browser and says
 * nothing about why. (Arc flags written without separators, `a1 1 0 011 1`, are not used by
 * the vendored set and are not accepted here.)
 */
export function isWellFormedPathData(d: string): boolean {
  const commands: { cmd: string; args: number }[] = [];
  for (const match of d.matchAll(PATH_TOKEN)) {
    const [, cmd, num, , junk] = match;
    if (junk !== undefined) return false;
    if (cmd !== undefined) commands.push({ cmd: cmd.toLowerCase(), args: 0 });
    else if (num !== undefined) {
      const current = commands[commands.length - 1];
      if (!current) return false;
      current.args += 1;
    }
  }
  if (commands.length === 0 || commands[0].cmd !== 'm') return false;
  return commands.every(({ cmd, args }) => {
    const arity = PATH_COMMAND_ARITY[cmd];
    return arity === 0 ? args === 0 : args > 0 && args % arity === 0;
  });
}
