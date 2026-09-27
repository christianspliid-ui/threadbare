/**
 * `generateItem` — grow one item around an authored trope core, dressed by the world
 * (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Systems design,
 * § Resolution logic, § PRNG callouts. Ported from the THR-1236 prototype
 * (`generator.mjs` §10–§12) — the tables and the world are the live ones now.
 *
 * Pure: reads a request and returns an item or `null`. Never touches the graph and never
 * throws on missing world data — a line that names a missing thing is simply ineligible.
 *
 * **Determinism (NFP #3).** No `Math.random()`. Every table is its own stream off the
 * item's seed key through `drawFromTable` / `rollTableUnit`, so cutting a core or a
 * material never reshuffles another table, and the lifecycle's own `rng` is never
 * consumed — a world with the generator switched off differs only in its masterworks.
 * Every world table is drawn eagerly, whether the prose ends up naming it or not (the
 * `generateGroupName` discipline, THR-1235 §4).
 */

import { drawFromTable, rollTableUnit } from '../../lib/drawTable';
import { possessive } from '../naming/workNames';
import type { ReachDomain } from '../../types/traits';
import type { SphereName } from '../../types/index';
import type { AttachmentEffect } from '../../types/effects';
import {
  ITEM_GEN_BEAST_NAMES, ITEM_GEN_BEAST_NAME_COAT, ITEM_GEN_CORE_REPEAT_DECAY, ITEM_GEN_CRAFT_BY_KIND,
  ITEM_GEN_FACTION_REACH_LEAN, ITEM_GEN_FIXED_BY_BAND, ITEM_GEN_FORMS, ITEM_GEN_FORM_REPEAT_DECAY,
  ITEM_GEN_GRAMMAR_BY_BAND, ITEM_GEN_HERO_REPEAT_DECAY, ITEM_GEN_KIND_REACH_BIAS, ITEM_GEN_MAGNITUDE_BY_BAND,
  ITEM_GEN_MATERIALS, ITEM_GEN_PROVENANCE_REPEAT_DECAY, ITEM_GEN_REACHES, ITEM_GEN_SIGNATURE_REPEAT_DECAY,
  ITEM_GEN_SOFT_FITS, ITEM_GEN_SPHERES, ITEM_GEN_SPHERE_ADJ, ITEM_GEN_SPHERE_LOOK, ITEM_GEN_SPHERE_ROOTS,
} from '../../data/item-generator-tables';
import type { ItemGenFixedKind, ItemGenForm, ItemGenFormId, ItemGenMagnitudeKind, ItemGenMaterial, ItemGenNameGrammar } from '../../data/item-generator-tables';
import { ITEM_GEN_CORES } from '../../data/item-generator-cores';
import type { ItemGenBuildCtx, ItemGenCore, ItemGenEntityUse, ItemGenProvenanceLine } from '../../data/item-generator-cores';
import type {
  GeneratedItem, ItemGenConcept, ItemGenCulture, ItemGenEvent, ItemGenFaction, ItemGenHero, ItemGenHistory,
  ItemGenMaker, ItemGenMonster, ItemGenPart, ItemGenPlace, ItemGenRequest, ItemWorldContext, Pronoun,
} from './types';

// ─── The seeded roller ───────────────────────────────────────────────

const round = (v: number, dp = 2) => Math.round(v * 10 ** dp) / 10 ** dp;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const nonEmpty = (o: object | undefined | null): boolean => !!o && Object.keys(o).length > 0;

/** One item's rolls: every table its own stream off the seed key; the fired trail for inspection. */
class Roller {
  readonly fired: string[] = [];
  private readonly seedKey: string;
  constructor(seedKey: string) { this.seedKey = seedKey; }
  unit(tableId: string): number { return rollTableUnit(tableId, this.seedKey); }
  draw<K extends string>(tableId: string, weights: Partial<Record<K, number>>): K | undefined {
    const pick = drawFromTable<K>(tableId, weights, this.seedKey, 1)[0];
    if (pick !== undefined) this.fired.push(`${tableId}=${pick}`);
    return pick;
  }
  pick<T>(tableId: string, arr: readonly T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.min(arr.length - 1, Math.floor(this.unit(tableId) * arr.length))];
  }
  range(tableId: string, [lo, hi]: readonly [number, number], dp = 2): number { return round(lo + (hi - lo) * this.unit(tableId), dp); }
}

export function emptyItemGenHistory(): ItemGenHistory {
  return { core: {}, signature: {}, form: {}, hero: {}, provenance: {}, names: new Set(), looks: new Set() };
}

// ─── Pools ───────────────────────────────────────────────────────────

/**
 * A core's pool, restricted to what this world actually has; the whole world evenly when
 * the core names nothing the world has; empty when the world has nothing of the kind.
 */
function poolOf(corePool: Readonly<Record<string, number>> | undefined, world: Readonly<Record<string, unknown>>): Record<string, number> {
  const inWorld = Object.entries(corePool ?? {}).filter(([k, w]) => k in world && w > 0);
  if (inWorld.length > 0) return Object.fromEntries(inWorld);
  return Object.fromEntries(Object.keys(world).map(k => [k, 1]));
}

function addWeights(acc: Record<string, number>, obj: Readonly<Record<string, number | undefined>> | undefined, k = 1): Record<string, number> {
  for (const [key, w] of Object.entries(obj ?? {})) acc[key] = (acc[key] ?? 0) + (w ?? 0) * k;
  return acc;
}

/** The entities a line may name, as far as this world and origin can supply them. */
interface Availability {
  readonly maker: boolean; readonly hero: boolean; readonly faction: boolean; readonly event: boolean;
  readonly culture: boolean; readonly monster: boolean; readonly place: boolean;
}

function availability(req: ItemGenRequest): Availability {
  const w = req.world;
  if (req.origin === 'masterwork') {
    const m = w.maker;
    return {
      maker: !!m,
      hero: false, event: false, monster: false,
      faction: !!(m?.factionId && w.factions[m.factionId]),
      culture: !!(m?.cultureId && w.cultures[m.cultureId]),
      place: !!(m?.placeId && w.places[m.placeId]),
    };
  }
  return {
    maker: false,
    hero: nonEmpty(w.heroes), faction: nonEmpty(w.factions), event: nonEmpty(w.events),
    culture: nonEmpty(w.cultures), monster: nonEmpty(w.monsters), place: nonEmpty(w.places),
  };
}

function lineEligible(line: ItemGenProvenanceLine, req: ItemGenRequest, avail: Availability): boolean {
  if ((req.origin === 'masterwork') !== !!line.made) return false;
  return line.uses.every((u: ItemGenEntityUse) => avail[u]);
}

/** A trophy core needs a monster whose sphere yields a trophy that fits one of its forms. */
function trophyMonsters(core: ItemGenCore, world: ItemWorldContext): ItemGenMonster[] {
  return Object.values(world.monsters).filter(m =>
    Object.values(ITEM_GEN_MATERIALS).some(mat => mat.monsterSphere === m.sphere && (mat.fitsForms ?? []).some(f => (core.forms[f] ?? 0) > 0)));
}

/** Can this core make an item here at all? */
export function coreEligible(core: ItemGenCore, req: ItemGenRequest): boolean {
  if (!core.bands.includes(req.band) || !core.origins.includes(req.origin)) return false;
  if (!core.signatures.some(s => (s.bands ?? core.bands).includes(req.band))) return false;
  if (core.trophy && trophyMonsters(core, req.world).length === 0) return false;
  if (core.id === 'disaster_salvage' && !nonEmpty(req.world.events)) return false;
  const avail = availability(req);
  return core.provenance.some(l => lineEligible(l, req, avail));
}

/** The maker's faction leans core choice by reach: a Free Company smith leans to Iron cores. */
function reachLean(core: ItemGenCore, faction: ItemGenFaction | null): number {
  if (!faction) return 0;
  const total = Object.values(core.reaches).reduce((s, v) => s + (v ?? 0), 0);
  if (total <= 0) return 0;
  let lean = 0;
  for (const [r, v] of Object.entries(core.reaches)) lean += ((v ?? 0) / total) * (faction.reachWeights[r as ReachDomain] ?? 0);
  return lean * ITEM_GEN_FACTION_REACH_LEAN;
}

// ─── Generation ──────────────────────────────────────────────────────

export type GenerateItemRefusal = 'no_eligible_core' | 'no_eligible_signature' | 'no_eligible_line';

/** Grow one item. `null` (with the reason on `lastRefusal`) when nothing eligible fits this world. */
export function generateItem(req: ItemGenRequest): GeneratedItem | null {
  const r = tryGenerate(req);
  return typeof r === 'string' ? null : r;
}

/** As {@link generateItem}, but returns the refusal reason instead of `null`. */
export function tryGenerate(req: ItemGenRequest): GeneratedItem | GenerateItemRefusal {
  const R = new Roller(req.seedKey);
  const history = req.history ?? emptyItemGenHistory();
  const world = req.world;
  const band = req.band;
  const maker = req.origin === 'masterwork' ? world.maker : null;
  const makerFaction = maker?.factionId ? world.factions[maker.factionId] ?? null : null;

  // 1. Core — the authored idea.
  const coreW: Record<string, number> = {};
  for (const core of ITEM_GEN_CORES) {
    if (req.coreId && core.id !== req.coreId) continue;
    if (!coreEligible(core, req)) continue;
    const n = history.core[core.id] ?? 0;
    coreW[core.id] = core.weight * (1 + reachLean(core, makerFaction)) * Math.pow(ITEM_GEN_CORE_REPEAT_DECAY, n);
  }
  const coreId = R.draw('core', coreW);
  const core = ITEM_GEN_CORES.find(c => c.id === coreId);
  if (!core) return 'no_eligible_core';

  // 2. Signature — which of the core's ideas this one carries.
  const sigW: Record<string, number> = {};
  for (const s of core.signatures) {
    if (req.signatureId && s.id !== req.signatureId) continue;
    if (!(s.bands ?? core.bands).includes(band)) continue;
    sigW[s.id] = Math.pow(ITEM_GEN_SIGNATURE_REPEAT_DECAY, history.signature[`${core.id}:${s.id}`] ?? 0);
  }
  const signature = core.signatures.find(s => s.id === R.draw(`signature.${core.id}`, sigW));
  if (!signature) return 'no_eligible_signature';

  // 3. World entities — every table drawn eagerly, so which ones the prose ends up naming
  //    never shifts another roll. Masterworks name their maker's own people and place.
  const heroW = poolOf(core.heroes, world.heroes);
  for (const h of Object.keys(heroW)) heroW[h] *= Math.pow(ITEM_GEN_HERO_REPEAT_DECAY, history.hero[h] ?? 0);
  let hero: ItemGenHero | null = world.heroes[R.draw('hero', heroW) ?? ''] ?? null;
  const eventW = poolOf(core.events, world.events);
  if (hero?.eventId && nonEmpty(core.heroes) && !nonEmpty(core.events) && world.events[hero.eventId]) eventW[hero.eventId] = (eventW[hero.eventId] ?? 0) + 3;
  let event: ItemGenEvent | null = world.events[R.draw('event', eventW) ?? ''] ?? null;
  const drawnFactionId = R.draw('faction', poolOf(core.factions, world.factions));
  let faction: ItemGenFaction | null = req.origin === 'masterwork' ? makerFaction : world.factions[drawnFactionId ?? ''] ?? null;
  const monsterPool = core.trophy ? trophyMonsters(core, world) : Object.values(world.monsters);
  const monsterW: Record<string, number> = {};
  for (const m of monsterPool) monsterW[m.id] = nonEmpty(core.monsterSpheres) ? (core.monsterSpheres?.[m.sphere] ?? 0) : 1;
  if (!Object.values(monsterW).some(w => w > 0)) for (const m of monsterPool) monsterW[m.id] = 1;
  const monster: ItemGenMonster | null = world.monsters[R.draw('monster', monsterW) ?? ''] ?? null;
  const drawnCulture = world.cultures[R.draw('culture', poolOf(undefined, world.cultures)) ?? ''] ?? null;
  const culture: ItemGenCulture | null = req.origin === 'masterwork'
    ? (maker?.cultureId ? world.cultures[maker.cultureId] ?? null : null)
    : drawnCulture;
  let place: ItemGenPlace | null;
  if (req.origin === 'masterwork') {
    place = maker?.placeId ? world.places[maker.placeId] ?? null : null;
  } else {
    const placeW = addWeights(poolOf(undefined, world.places), {
      ...(event && world.places[event.placeId] ? { [event.placeId]: 2 } : {}),
      ...(culture?.homePlaceId && world.places[culture.homePlaceId] ? { [culture.homePlaceId]: 1 } : {}),
    });
    place = world.places[R.draw('place', placeW) ?? ''] ?? null;
  }

  // 4. Form (variety decays across the batch or world).
  let formW: Partial<Record<ItemGenFormId, number>> = { ...core.forms };
  if (event && core.formsByEvent?.[event.kind]) formW = { ...core.formsByEvent[event.kind] };
  if (core.trophy && monster) {
    formW = Object.fromEntries(Object.entries(formW).filter(([f]) =>
      Object.values(ITEM_GEN_MATERIALS).some(m => m.monsterSphere === monster.sphere && (m.fitsForms ?? []).includes(f as ItemGenFormId)))) as Partial<Record<ItemGenFormId, number>>;
  }
  if (!nonEmpty(formW)) formW = { charm: 1 };
  for (const f of Object.keys(formW) as ItemGenFormId[]) formW[f] = (formW[f] ?? 0) * Math.pow(ITEM_GEN_FORM_REPEAT_DECAY, history.form[f] ?? 0);
  const formId = R.draw('form', formW) ?? (Object.keys(formW)[0] as ItemGenFormId);
  const form: ItemGenForm = ITEM_GEN_FORMS[formId];

  // 5. Provenance line (tone table), then coherence: a line naming a person and a
  //    faction names the person's own faction; one naming a person and an event names
  //    the person's own event.
  const avail = availability(req);
  const lines = core.provenance.filter(l => lineEligible(l, req, avail));
  const lineW = Object.fromEntries(lines.map((l, i) => [String(i), Math.pow(ITEM_GEN_PROVENANCE_REPEAT_DECAY, history.provenance[l.text] ?? 0)]));
  let line = lines[Number(R.draw('provenance', lineW) ?? '-1')];
  if (!line) return 'no_eligible_line';
  if (line.needsFactionHero) {
    const fh = Object.values(world.heroes).find(h => h.factionId === faction?.id && h.dead && !h.oathbreaker);
    if (fh) hero = fh;
    else {
      const other = lines.find(l => !l.needsFactionHero);
      if (!other) return 'no_eligible_line';
      line = other;
    }
  }
  if (line.uses.includes('hero') && line.uses.includes('faction') && hero?.factionId && world.factions[hero.factionId]) faction = world.factions[hero.factionId];
  if (line.uses.includes('hero') && line.uses.includes('event') && hero?.eventId && world.events[hero.eventId]) event = world.events[hero.eventId];

  // 6. Sphere — the core decides which spheres are possible; the world decides which of those.
  const eligibleSpheres = nonEmpty(core.spheres) ? (Object.keys(core.spheres) as SphereName[]) : [...ITEM_GEN_SPHERES];
  const sw: Record<string, number> = Object.fromEntries(eligibleSpheres.map(s => [s, core.spheres[s] ?? 1]));
  const bump = (obj: Partial<Record<SphereName, number>> | undefined, k: number) => {
    for (const [s, w] of Object.entries(obj ?? {})) if (s in sw) sw[s] += (w ?? 0) * k;
  };
  const uses = new Set(line.uses);
  if ((uses.has('event') || core.id === 'disaster_salvage') && event) bump(event.spheres, core.id === 'disaster_salvage' ? 3 : 1);
  if ((uses.has('faction') || req.origin === 'masterwork') && faction) bump(faction.spheres, uses.has('faction') ? 1 : 0.5);
  if ((uses.has('culture') || req.origin === 'masterwork') && culture) bump(culture.spheres, uses.has('culture') ? 1 : 0.5);
  if (uses.has('hero') && hero?.factionId) bump(world.factions[hero.factionId]?.spheres, 0.5);
  if ((core.trophy || uses.has('monster')) && monster) bump({ [monster.sphere]: core.trophy ? 8 : 2 }, 1);
  if (place) bump(place.spheres, 0.5);
  const sphere = (R.draw('sphere', sw) ?? eligibleSpheres[0]) as SphereName;

  // 7. Reach — the core's reaches, leaned by the faction's reach weights and by what the thing is.
  let rw: Record<string, number> = nonEmpty(core.reaches)
    ? { ...(core.reaches as Record<string, number>) }
    : Object.fromEntries(ITEM_GEN_REACHES.map(rr => [rr, 0.5]));
  if (core.trophy && monster && nonEmpty(monster.reachWeights)) rw = addWeights({}, monster.reachWeights);
  for (const rr of Object.keys(rw)) rw[rr] *= (1 + (faction?.reachWeights[rr as ReachDomain] ?? 0)) * (ITEM_GEN_KIND_REACH_BIAS[form.kind]?.[rr as ReachDomain] ?? 1);
  const drawnReach = (R.draw('reach', rw) ?? 'iron') as ReachDomain;

  // 8. Material — fits the form, leans to the sphere and the place's terrain.
  const matW: Record<string, number> = {};
  for (const [mid, m] of Object.entries(ITEM_GEN_MATERIALS)) {
    if (core.trophy) { if (monster && m.monsterSphere === monster.sphere && (m.fitsForms ?? []).includes(formId)) matW[mid] = 1; continue; }
    if (m.monsterSphere) continue;
    if (!m.fits.some(f => form.fits.includes(f))) continue;
    if (m.notFor?.includes(form.kind)) continue;
    let w = 1 + 2 * (m.spheres[sphere] ?? 0);
    if (place?.terrain && m.terrains?.includes(place.terrain)) w += 2;
    w *= core.materials?.[mid] ?? 1;
    w *= form.prefer?.[mid] ?? 1;
    w *= m.scarce ?? 1;
    w += (event && core.materialsByEvent?.[event.kind]?.[mid]) ?? 0;
    matW[mid] = w;
  }
  const materialId = R.draw('material', nonEmpty(matW) ? matW : { bronze: 1 }) ?? 'bronze';
  const material: ItemGenMaterial & { id: string } = { ...ITEM_GEN_MATERIALS[materialId], id: materialId };

  // 9. Effects — the signature's idea.
  let magCount = 0;
  const catchNotes: string[] = [];
  const ctx: ItemGenBuildCtx = {
    band, origin: req.origin, formId, formKind: form.kind, sphere, reach: drawnReach,
    faction, hero, event, monster, virtue: null, stampCursed: false, lossCondition: null, catchNotes,
    draw: (id, w) => R.draw(`build.${core.id}.${signature.id}.${id}`, w),
    mag(kind: ItemGenMagnitudeKind, stepDown = 0) {
      const b = Math.min(4, Math.max(1, band - stepDown)) as 1 | 2 | 3 | 4;
      magCount += 1;
      return R.range(`mag.${kind}.${magCount}`, ITEM_GEN_MAGNITUDE_BY_BAND[kind][b], kind === 'drift' ? 4 : 2);
    },
    fixed(kind: ItemGenFixedKind, stepDown = 0) {
      const b = Math.min(4, Math.max(1, band - stepDown)) as 1 | 2 | 3 | 4;
      return ITEM_GEN_FIXED_BY_BAND[kind][b];
    },
  };
  const parts: ItemGenPart[] = signature.build(ctx);
  const effects: AttachmentEffect[] = [];
  const catchIndexes: number[] = [];
  for (const p of parts) {
    if (p.effect.type === '_note') { catchNotes.push((p.effect as { text: string }).text); continue; }
    if (p.role === 'catch') catchIndexes.push(effects.length);
    effects.push(p.effect as AttachmentEffect);
  }

  // 10. Loss condition — must be backed by the effect that enforces it. A masterwork is
  //     a thing the world fights over, so it is never pinned `permanent`.
  const cursed = ctx.stampCursed;
  const lossCondition = ctx.lossCondition ?? (cursed ? 'cursed' : req.origin === 'found' && band >= 3 ? 'permanent' : 'stealable');

  // 11. Tags. Every generated item is born Storied (the UL ruling), so `#storied` always.
  const tags = new Set<string>([...form.tags, `#${sphere}`, `#${ctx.reach}`, ...core.family, ...(material.tags ?? []), '#storied']);
  if (cursed) tags.add('#cursed');

  // 12. Names — every grammar rendered eagerly, then one chosen by core × band weights.
  //     A name already used in this world (or batch) is struck before the draw.
  const story = { hero: uses.has('hero') ? hero : null, maker: uses.has('maker') ? maker : null };
  const names = renderNames(R, core, form, material, sphere, event, place, monster, faction, story, uses, ctx.virtue, world.places);
  const valid: Partial<Record<ItemGenNameGrammar, number>> = {};
  for (const [g, w] of Object.entries(core.grammar) as [ItemGenNameGrammar, number][]) {
    const n = names[g];
    if (n && !history.names.has(n)) valid[g] = w * (ITEM_GEN_GRAMMAR_BY_BAND[g]?.[band] ?? 1);
  }
  const grammar = (R.draw('name.grammar', nonEmpty(valid) ? valid : { material: 1 }) ?? 'material') as ItemGenNameGrammar;
  const name = names[grammar] ?? names.material ?? `${material.title} ${form.names[0]}`;

  // 13. Prose.
  const look = renderLook(R, core, form, formId, material, sphere, event, history.looks);
  const provenance = renderTemplate(line.text, { hero, maker, event, faction, culture, monster, place, form, world, virtueWord: ctx.virtue?.word });

  const concepts: ItemGenConcept[] = [];
  if (uses.has('maker') && maker) concepts.push({ id: maker.id, kind: 'actor', name: maker.name });
  if (uses.has('hero') && hero) concepts.push({ id: hero.id, kind: 'actor', name: hero.name });
  if (uses.has('faction') && faction) concepts.push({ id: faction.id, kind: 'faction', name: faction.name });
  if (uses.has('place') && place) concepts.push({ id: place.id, kind: 'location', name: place.name });

  return {
    seedKey: req.seedKey, band, origin: req.origin,
    coreId: core.id, coreLabel: core.label, signatureId: signature.id,
    kind: form.kind, formId, formNoun: form.noun, materialId, sphere, reach: ctx.reach,
    name, grammar, look, provenance, provenanceTone: line.tone,
    effects, catchIndexes, catchNotes,
    tags: [...tags], lossCondition, slotTag: form.slot, cursed,
    virtueTraitId: ctx.virtue?.id ?? null,
    concepts, fired: R.fired,
  };
}

/** Record a generated item in a batch history, so the next one decays away from it. */
export function recordInHistory(history: ItemGenHistory, item: GeneratedItem, heroId?: string | null): void {
  history.core[item.coreId] = (history.core[item.coreId] ?? 0) + 1;
  history.signature[`${item.coreId}:${item.signatureId}`] = (history.signature[`${item.coreId}:${item.signatureId}`] ?? 0) + 1;
  history.form[item.formId] = (history.form[item.formId] ?? 0) + 1;
  if (heroId) history.hero[heroId] = (history.hero[heroId] ?? 0) + 1;
  history.provenance[item.provenance] = (history.provenance[item.provenance] ?? 0) + 1;
  history.names.add(item.name);
  history.looks.add(item.look);
}

// ─── Names ───────────────────────────────────────────────────────────

function renderNames(
  R: Roller, core: ItemGenCore, form: ItemGenForm, material: ItemGenMaterial & { id: string }, sphere: SphereName,
  event: ItemGenEvent | null, place: ItemGenPlace | null, monster: ItemGenMonster | null, faction: ItemGenFaction | null,
  story: { hero: ItemGenHero | null; maker: ItemGenMaker | null }, uses: ReadonlySet<ItemGenEntityUse>,
  virtue: { adj: string } | null,
  places: Readonly<Record<string, ItemGenPlace>>,
): Partial<Record<ItemGenNameGrammar, string>> {
  const n = core.names;
  const noun = form.names[0];
  const poetic = form.names[1] ?? noun;
  const out: Partial<Record<ItemGenNameGrammar, string>> = {};
  out.material = `${material.title} ${noun}`;
  const roleList = uses.has('faction') && faction ? faction.nameRoles : (n.role?.length ? n.role : null);
  const role = roleList ? R.pick('name.role', roleList) : undefined;
  if (role) out.role = `${possessive(role)} ${noun}`;
  const person = story.hero?.first ?? story.maker?.first;
  if (person) out.person = `${possessive(person)} ${noun}`;
  const xofy = n.xofy?.length ? R.pick('name.xofy', n.xofy) : undefined;
  if (xofy) out.xofy = `${noun} of ${xofy}`;
  let adjList: readonly string[] = (event && core.definiteByEvent?.[event.kind]) || (n.definite?.length ? n.definite : ITEM_GEN_SPHERE_ADJ[sphere]);
  if (core.id === 'chose_bearer' && virtue) adjList = [virtue.adj];
  out.definite = `The ${R.pick('name.adj', adjList)} ${poetic}`;
  const root = R.pick('name.root', ITEM_GEN_SPHERE_ROOTS[sphere]) ?? 'Grey';
  const suffix = R.pick('name.suffix', form.suffix ?? [noun.toLowerCase()]) ?? noun.toLowerCase();
  if (!form.beast && root.toLowerCase() !== suffix) out.portmanteau = `${root}${suffix}`;
  const properOf = story.hero ? story.hero.name
    : (uses.has('event') || core.id === 'disaster_salvage') && event ? placeName(places, event.placeId, place)
    : uses.has('monster') && monster ? placeName(places, monster.placeId, place)
    : uses.has('place') && place ? place.name : null;
  if (properOf) out.proper = `${noun} of ${properOf}`;
  if (story.hero) out.house = `The ${story.hero.family} ${noun}`;
  if (form.beast) {
    const given = R.pick('name.beast', ITEM_GEN_BEAST_NAMES.filter(b => !ITEM_GEN_BEAST_NAME_COAT[b] || ITEM_GEN_BEAST_NAME_COAT[b] === material.id));
    if (given) out.given = given;
  }
  return out;
}

/** A place's name by id, falling back to the item's own place and then to a neutral phrase. */
function placeName(places: Readonly<Record<string, ItemGenPlace>>, placeId: string, fallback: ItemGenPlace | null): string {
  return places[placeId]?.name ?? fallback?.name ?? 'the old country';
}

// ─── Prose ───────────────────────────────────────────────────────────

const article = (w: string) => (/^[aeiou]/i.test(w) && !/^(one|uni|use)/i.test(w) ? 'An' : 'A');

function renderLook(
  R: Roller, core: ItemGenCore, form: ItemGenForm, formId: ItemGenFormId, material: ItemGenMaterial & { id: string },
  sphere: SphereName, event: ItemGenEvent | null, usedLooks: ReadonlySet<string>,
): string {
  const fresh = (xs: readonly string[]) => xs.filter(d => !usedLooks.has(d) && !(material.avoidWords ?? []).some(w => d.includes(w)));
  const coreLooks = fresh((event && core.looksByEvent?.[event.kind]) || core.looksByForm?.[formId] || core.looks);
  const soft = form.fits.some(f => ITEM_GEN_SOFT_FITS.has(f)) && material.fits.some(f => ITEM_GEN_SOFT_FITS.has(f));
  const source = R.draw('look.source', {
    core: coreLooks.length ? 6 : 0,
    material: material.look && fresh([material.look]).length ? 3 : 0,
    sphere: form.beast ? 0 : 1.5,
  }) ?? 'sphere';
  const detail = source === 'core' ? (R.pick('look.detail', coreLooks) ?? core.looks[0])
    : source === 'material' ? (material.look ?? ITEM_GEN_SPHERE_LOOK[sphere].hard)
    : ITEM_GEN_SPHERE_LOOK[sphere][soft ? 'soft' : 'hard'];
  let phrase: string;
  if (/^(pair|set|pot|bundle|flask) of/.test(form.noun)) phrase = form.noun.replace(' of ', ` of ${material.word} `);
  else if (material.word.endsWith('horn') && form.noun.endsWith('horn')) phrase = `${form.noun} made from ${material.word}`;
  else phrase = `${material.word} ${form.noun}`;
  const sep = /^(that|with)\b/.test(detail) ? ' ' : ', ';
  return `${article(phrase)} ${phrase}${sep}${detail}.`;
}

const PRONOUNS: Readonly<Record<Pronoun, { they: string; them: string; their: string }>> = {
  she: { they: 'she', them: 'her', their: 'her' },
  he: { they: 'he', them: 'him', their: 'his' },
  they: { they: 'they', them: 'them', their: 'their' },
};

interface TemplateScope {
  hero: ItemGenHero | null; maker: ItemGenMaker | null; event: ItemGenEvent | null; faction: ItemGenFaction | null;
  culture: ItemGenCulture | null; monster: ItemGenMonster | null; place: ItemGenPlace | null; form: ItemGenForm;
  world: ItemWorldContext; virtueWord?: string;
}

function renderTemplate(text: string, s: TemplateScope): string {
  const map: Record<string, string | undefined> = {};
  const h = s.hero;
  if (h) {
    const p = PRONOUNS[h.pronoun];
    Object.assign(map, {
      'hero': h.name, 'hero.first': h.first, 'hero.family': h.family, 'hero.deed': h.deed, 'hero.fate': h.fate, 'hero.role': h.role,
      'hero.they': p.they, 'hero.They': cap(p.they), 'hero.them': p.them, 'hero.their': p.their, 'hero.possessive': possessive(h.name),
    });
  }
  const m = s.maker;
  if (m) {
    const p = PRONOUNS[m.pronoun];
    Object.assign(map, { 'maker': m.name, 'maker.first': m.first, 'maker.they': p.they, 'maker.They': cap(p.they), 'maker.them': p.them, 'maker.their': p.their });
  }
  const e = s.event;
  if (e) {
    const evPlace = s.world.places[e.placeId]?.name ?? '';
    Object.assign(map, {
      'event': text.includes('{event.place}') && evPlace && e.name.includes(evPlace) && e.short ? e.short : e.name,
      'event.place': evPlace || 'that place', 'event.what': e.what, 'event.lingers': e.lingers, 'event.salvage': e.salvage,
    });
  }
  const f = s.faction;
  if (f) {
    Object.assign(map, {
      'faction': f.name, 'faction.the': `the ${f.bare}`, 'faction.The': `The ${f.bare}`,
      'faction.Members': `${f.bare} ${f.roles[0]}s`, 'faction.role': f.roles[1] ?? f.roles[0],
    });
  }
  const c = s.culture;
  if (c) Object.assign(map, { 'culture': c.name, 'culture.Adj': c.adj, 'culture.adj': c.adj });
  const mo = s.monster;
  if (mo) Object.assign(map, { 'monster': mo.name, 'monster.one': mo.one, 'monster.One': cap(mo.one), 'monster.place': s.world.places[mo.placeId]?.name ?? 'the wilds' });
  if (s.place) map['place'] = s.place.name;
  const form = s.form;
  Object.assign(map, {
    'craft': form.craft ?? ITEM_GEN_CRAFT_BY_KIND[form.kind], 'virtue.word': s.virtueWord ?? 'worthy',
    'form.at': form.at ?? 'was at', 'form.held': form.held ?? 'stood', 'form.carried': form.carried ?? 'carried', 'form.endure': form.endure ?? 'it survived',
    'form.It': 'It', 'form.works': form.noun === 'lantern' ? 'lights itself' : form.noun === 'hand-bell' ? 'rings by itself' : 'fogs over by itself',
    'form.Holds': form.noun === 'reliquary' ? 'It holds a finger-bone of' : form.noun === 'stole' ? 'It was worn by' : 'It was rung by',
  });
  let out = text.replace(/\{([a-zA-Z.]+)\}/g, (whole, k: string) => map[k] ?? whole);
  if (form.plural) out = out.replace(/\bIt\b/g, 'They').replace(/\bit\b/g, 'them').replace(/\bThey is\b/g, 'They are').replace(/\bThey has\b/g, 'They have').replace(/\bThey was\b/g, 'They were');
  return cap(out).replace(/\ba ([aeiou])/g, 'an $1');
}
