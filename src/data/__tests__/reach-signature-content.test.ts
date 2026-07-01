import { describe, it, expect } from 'vitest';
import { REACH_DOMAINS } from '../../types/traits';
import { CREATION_SPHERE_NAMES } from '../../types/index';
import {
  resolveSignatureIndividualization,
  composeDefaultSignature,
  REACH_SIGNATURE_DEFAULTS,
  SIGNATURE_MATRIX,
  SIGNATURE_DEFAULT_BASE_VALUE,
  SIGNATURE_BESPOKE_BASE_VALUE,
  REACH_SIGNATURE_CONTENT_TEMPLATES,
  GREAT_WORK_UNIQUE_TAG,
  AFTERMATH_TARGET_SENTINEL,
  AFTERMATH_PRIMARY_SPHERE_SENTINEL,
  type SignatureIndividualization,
} from '../reach-signature-content';
import { GREAT_WORK_ARTIFACT_TIER } from '../game-config';

describe('reach-signature-content — individualization layer (THR-549)', () => {
  it('has a composed-default seed for every ReachDomain', () => {
    for (const reach of REACH_DOMAINS) {
      expect(REACH_SIGNATURE_DEFAULTS[reach]).toBeDefined();
    }
  });

  it('keeps every ReachDomain present in the (skeleton) authored matrix', () => {
    for (const reach of REACH_DOMAINS) {
      expect(SIGNATURE_MATRIX[reach]).toBeDefined();
    }
  });

  // The core correctness property: under the two-domain lock the player's
  // (reach × primarySphere) cell is fixed for the run, so EVERY pair must
  // resolve to a real signature — never an empty card.
  it('resolves a non-null individualization for every ReachDomain × CreationSphereName', () => {
    for (const reach of REACH_DOMAINS) {
      for (const sphere of CREATION_SPHERE_NAMES) {
        const ind = resolveSignatureIndividualization(reach, sphere);
        expect(ind, `${reach} × ${sphere}`).not.toBeNull();
        expect(ind.nameFragment.length, `${reach} × ${sphere} nameFragment`).toBeGreaterThan(0);
        expect(ind.proseKey.length, `${reach} × ${sphere} proseKey`).toBeGreaterThan(0);
        expect(ind.twist.id.length, `${reach} × ${sphere} twist.id`).toBeGreaterThan(0);
        expect(ind.twist.trigger.length, `${reach} × ${sphere} twist.trigger`).toBeGreaterThan(0);
      }
    }
  });

  // The individualization bar: named effect WITH numbers. The composed default
  // is never mechanically empty — even time/entropy (no sphere_flavored_effect
  // table entry) carry the reach base passive.
  it('gives every cell a payload with at least the reach base passive', () => {
    for (const reach of REACH_DOMAINS) {
      for (const sphere of CREATION_SPHERE_NAMES) {
        const { twist } = resolveSignatureIndividualization(reach, sphere);
        expect(twist.payload.length, `${reach} × ${sphere}`).toBeGreaterThan(0);
        const basePassive = twist.payload.find(
          (e) => e.type === 'passive' && e.reach === reach,
        );
        expect(basePassive, `${reach} × ${sphere} base passive`).toBeDefined();
        if (basePassive && basePassive.type === 'passive') {
          // Composed-default cells carry exactly the floor; bespoke cells authored
          // in SIGNATURE_MATRIX (THR-555) may carry a richer base value.
          const isBespoke = SIGNATURE_MATRIX[reach]?.[sphere] !== undefined;
          if (!isBespoke) expect(basePassive.value).toBe(SIGNATURE_DEFAULT_BASE_VALUE);
        }
      }
    }
  });

  it('layers the sphere-flavored passive on top of the reach base when the primitive table has one', () => {
    // `force` → iron passive in SPHERE_EFFECT_TABLE, so iron×force gets two passives.
    const ind = composeDefaultSignature('iron', 'force');
    const reaches = ind.twist.payload
      .filter((e) => e.type === 'passive')
      .map((e) => (e.type === 'passive' ? e.reach : null));
    expect(reaches).toContain('iron'); // base
    expect(ind.twist.payload.length).toBe(2); // base + sphere-flavored
  });

  it('still yields a real payload for creation spheres absent from the primitive table (time, entropy)', () => {
    for (const sphere of ['time', 'entropy'] as const) {
      const ind = composeDefaultSignature('stone', sphere);
      expect(ind.twist.payload.length).toBe(1); // reach base only, but non-empty
      expect(ind.nameFragment).toContain('of ');
    }
  });

  it('is pure/deterministic — same inputs produce equal individualization', () => {
    const a = resolveSignatureIndividualization('veil', 'mind');
    const b = resolveSignatureIndividualization('veil', 'mind');
    expect(a).toEqual(b);
  });

  it('prefers a bespoke matrix cell over the composed default', () => {
    // Inject a distinct bespoke cell locally to prove the resolver branch (iron ×
    // force is a real bespoke cell now (THR-555); we patch it to a fresh object,
    // assert identity, then restore the authored cell in `finally`).
    const bespoke: SignatureIndividualization = {
      twist: { id: 'test.bespoke', trigger: 'test trigger', payload: [] },
      nameFragment: 'Bespoke',
      proseKey: 'test.bespoke',
    };
    const original = SIGNATURE_MATRIX.iron.force;
    SIGNATURE_MATRIX.iron.force = bespoke;
    try {
      expect(resolveSignatureIndividualization('iron', 'force')).toBe(bespoke);
    } finally {
      if (original === undefined) delete SIGNATURE_MATRIX.iron.force;
      else SIGNATURE_MATRIX.iron.force = original;
    }
  });
});

describe('reach-signature-content — engine-backed signatures (THR-555)', () => {
  const byId = (id: string) => REACH_SIGNATURE_CONTENT_TEMPLATES.find(t => t.id === id);

  it('ships the three engine-backed signature templates, each reach-gated', () => {
    for (const [id, reach] of [
      ['invest.iron.warhost', 'iron'],
      ['invest.veil.rend_the_gate', 'veil'],
      ['invest.stone.great_work', 'stone'],
    ] as const) {
      const t = byId(id);
      expect(t, id).toBeDefined();
      expect(t!.reach, `${id} reach`).toBe(reach);
      // Reach-gated by the shipped requiresReach field (THR-503 getTargetActionSlots).
      expect(t!.requiresReach, `${id} requiresReach`).toBe(reach);
      expect(t!.actorAffinities, `${id} ascendant-only`).toContain('ascendant');
    }
  });

  it('Iron / Warhost fires signature_warhost bound to the card target + anoints a chosen banner', () => {
    const t = byId('invest.iron.warhost')!;
    // Aftermath: the shipped signature_warhost effect, faction bound via $target.
    const effect = t.aftermathConfig!.fallback.reactions![0].effects[0];
    expect(effect.kind).toBe('signature_warhost');
    expect((effect as { factionId: string }).factionId).toBe(AFTERMATH_TARGET_SENTINEL);
    // Step: the shipped anoint_faction op (→ chosen_status_grant primitive), $target-bound.
    const step = t.steps[0] as { onSuccess: readonly { op: string; nodeId: string }[] };
    const op = step.onSuccess[0];
    expect(op.op).toBe('anoint_faction');
    expect(op.nodeId).toBe('$target');
  });

  it('Veil / Rend the Gate opens a sustained rift on the target, amplifying the caster primary sphere', () => {
    const t = byId('invest.veil.rend_the_gate')!;
    const effect = t.aftermathConfig!.fallback.reactions![0].effects[0] as {
      kind: string; locationId: string; sphere: string; durationMode: string;
    };
    expect(effect.kind).toBe('sphere_influence_amplify');
    expect(effect.locationId).toBe(AFTERMATH_TARGET_SENTINEL);
    expect(effect.sphere).toBe(AFTERMATH_PRIMARY_SPHERE_SENTINEL);
    expect(effect.durationMode).toBe('sustained');
  });

  it('Stone / The Great Work mints one unique master forge + a legendary relic at the target', () => {
    const t = byId('invest.stone.great_work')!;
    const effect = t.aftermathConfig!.fallback.reactions![0].effects[0] as {
      kind: string; subtype: string; uniqueTag: string; nearAgentId: string; artifactForgeTier: string;
    };
    expect(effect.kind).toBe('spawn_unique_location');
    expect(effect.subtype).toBe('master_forge');
    expect(effect.uniqueTag).toBe(GREAT_WORK_UNIQUE_TAG);
    expect(effect.nearAgentId).toBe(AFTERMATH_TARGET_SENTINEL);
    expect(effect.artifactForgeTier).toBe(GREAT_WORK_ARTIFACT_TIER);
  });

  it('authors a bespoke matrix cell at each signature reach × its primary Creation Sphere', () => {
    // REACH_TO_SPHERE: iron→force, veil→mind, stone→matter — the bespoke veneer.
    for (const [reach, sphere] of [
      ['iron', 'force'],
      ['veil', 'mind'],
      ['stone', 'matter'],
    ] as const) {
      const ind = resolveSignatureIndividualization(reach, sphere);
      // A bespoke cell, not the composed default: authored proseKey + richer base.
      expect(ind.proseKey, `${reach}×${sphere}`).toBe(`signature.${reach}.${sphere}`);
      const basePassive = ind.twist.payload.find(
        e => e.type === 'passive' && e.reach === reach,
      );
      expect(basePassive, `${reach}×${sphere} base`).toBeDefined();
      if (basePassive && basePassive.type === 'passive') {
        expect(basePassive.value).toBe(SIGNATURE_BESPOKE_BASE_VALUE);
      }
    }
  });
});
