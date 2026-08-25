# The Encounter Content Package — `compile:encounter` (THR-1246)

**This card is the implementation pass's schema reading.** Fill a package, run one
command, and the compiler configures everything mechanical. You no longer read the
types file, exemplar encounter files, the registration file, or a test exemplar —
your context is for the content.

```bash
npm run compile:encounter -- Docs/plans/encounters/<slug>.package.json
npm run compile:encounter -- <path> --dry-run   # print the files, write nothing
npm run compile:encounter -- <path> --force     # overwrite an existing compile
```

## What the compiler does for you (do NOT do these by hand)

| Concern | Compiler behavior |
|---|---|
| `src/data/encounters/<slug>.ts` | emitted with your prose **byte-identical** (round-trip pinned by test), the literal annotated `UnifiedActionTemplate`, wrapped in `compileOpeningEnvelope` |
| `locationSubtypes` | derived via `expandSettings(settings)` — authoring it beside `settings` is an error |
| `consequenceDraw` | **stamped** from the binding draw (id + reach + rarity, THR-1145) — authoring it is an error; if a family fights the fiction, record a `consequenceSwap` in the template |
| Registration | added to `RAW_UNIFIED_ACTION_TEMPLATES` and `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`, idempotently; set `"registerInLocationCache": false` **only** for a group-exclusive template (THR-733) |
| Structural test | `__tests__/<slug>.test.ts` generated with this encounter's actual shape baked in |
| Deep field validation | delegated to `check:typecheck` — the emitted literal is excess-property-checked against the real type, so a typo'd or unknown field is a named compile error, never a silent drop |

## Package shape

```jsonc
{
  "slug": "the-cold-crossing",                  // kebab-case; names the files
  "doc": ["header line", "…"],                  // optional; the file's block comment —
                                                //   put the narrator's-checklist evidence here
  "constName": "THE_COLD_CROSSING_TEMPLATE",    // optional; derived from slug when omitted
  "registerInLocationCache": true,              // optional; false ONLY for group-exclusive
  "template": {
    // ═══ This IS the UnifiedActionTemplate, minus the two derived fields. ═══
    // Every field name and value shape is the real type's — there is no
    // package-only vocabulary to learn. Prose goes here verbatim.
    "id": "encounter.<family>.the_cold_crossing",  // tail must match the slug
    "rarityTier": 1,
    "intrinsicTier": "background",
    "name": "The Cold Crossing",
    "reach": "stone",
    "crudType": "read",
    "scale": "local",
    "apCost": 1,
    "actorAffinities": ["individual"],
    "motivations": ["preservation_transformation"],
    "settings": ["wayside", "ruin"],           // one opening per declared class:
    "openings": { "wayside": "…", "ruin": "…" },
    "steps": [ /* ActionStep objects — prose, difficulty, hands (StepNudge[]), metadata effects */ ],
    "traitVariants": [ /* TraitVariant[] */ ],
    "supportBundle": [ /* EncounterSupportActorSpec[] */ ],
    "narrativeTemplates": { "initiation": "…", "success": "…", "failure": "…" },
    "aftermathConfig": { /* BranchAwareAftermathConfig — byOutcome keys on the SEVEN-value UnifiedActionOutcome */ },
    "description": "…"
  }
}
```

## What the compiler validates before writing (loud, named errors)

- Unknown **top-level** keys (`slug` / `doc` / `constName` / `registerInLocationCache` / `template` only).
- Authored `consequenceDraw` or `locationSubtypes`-beside-`settings` (both derived).
- Envelope honesty (the shipped `validateSettingEnvelope`): every declared class has an opening, no opening for an undeclared class.
- Hand rules per nudge-bearing step, from the shipped authoring constants: 4–8 cards, ≥4 distinct spheres, ≥1 ungated common (sphere-less) option, ≤1 rider, every nudge ≥1 failure-band fragment, a big-delta card (Δ ≥ 0.15) covers both failure bands, one shared id prefix, no duplicate ids.
- `aftermathConfig.fallback.byOutcome` keys ∈ the seven-value `UnifiedActionOutcome` (`near_miss` and other `StepOutcome` values do not key aftermath).

Everything the package-level validator does not check, `check:typecheck` does — that
is the design, not a gap. A field the type rejects cannot ship.

## After compiling — still yours

1. `npm run check:typecheck` — the deep validation pass; a red here names your field.
2. `npx vitest run src/data/encounters/__tests__/<slug>.test.ts`
3. `npm run check:encounter -- <templateId>` — the Composition Contract (Stage 3).
4. `npm run check:encounter-live -- <templateId>` — the live proof (Stage 4).
5. Concept art per the design doc's art direction (unchanged — see the implementation prompt).

**The compiled `.ts` file is the canonical, hand-editable artifact from then on.**
Nothing regenerates it behind an editor; re-running the compiler on an existing file
requires `--force` and will overwrite hand edits — it says so before refusing.

## Authoring rules that still bind (the compiler cannot judge these)

- **Prose is verbatim from the approved final doc** — the compiler preserves your
  bytes; getting the right bytes into the package is the pass's whole job.
- Cards from the 21-type library, imperative verb+noun names, mechanism-stating
  effect lines, no digits — the editorial critics and `check:encounter`'s warn
  channel own these, exactly as before.
- Law 56: every aftermath chip backed by an effect that fires on its band.
