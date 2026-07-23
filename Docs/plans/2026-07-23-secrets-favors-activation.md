> **title:** `Activate Secrets & Favors — dormant engine + orphaned player verbs — THR-724`
> **linear_issue:** THR-724
> **author:** `Claude Code (Fable design session, per user routing decision 2026-07-23)`
> **created:** 2026-07-23
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Activate Secrets & Favors — THR-724

*An entire social dark-economy — blackmail, leverage, favors called in — is built, wired,
and produces zero output; its player verbs are authored and unreachable. Four structural
breaks, all diagnosed below. Fix the breaks; do not green-field.*

## Why this is load-bearing

Secrets & Favors is the highest-richness-per-effort opportunity in the coupling assessment
(`Docs/audits/2026-07-23-simulation-coupling-assessment.md`, opportunity #1): it is
surface-native to the god fantasy (Eye reach — the god as the one who *knows*), and every
piece already exists. Without it, social scenes have no teeth and the Eye player identity
has no signature loop.

**Diagnosis (Fable design session, 2026-07-23 — runtime + grep verified).** A 120-tick
standard run (seed 42, medium) births **zero** `knows_secret_of` and **zero** `owes_favor`
edges. Four breaks, in causal order:

1. **Generation is content-starved.** `generateSecret` has exactly two production triggers:
   `completedEncounter.secretDiscovery` (orchestrator.ts:617) and the `secret_discovery`
   aftermath effect (encounterAftermath.ts:3328). **Zero** templates in
   `unified-action-templates.ts` or `social-scene-templates.ts` author either. Only
   `secret-encounter-content.ts` carries them (via `encounter-content.ts` +
   `socialEncounterGeneration.ts`), and that path demonstrably produces nothing in 120
   ticks — the executor pinpoints whether those templates are never selected or their
   outputs never route to `createSecretEdge`.
2. **Consequences are orphaned.** `applySecretRevelationConsequences`,
   `applyFavorBreakingConsequences`, `applyFavorRedemptionConsequences` have **zero
   production callers.** Even if a secret existed and were revealed, nothing would happen.
3. **Duplicate module fork.** `secretsConsequences.ts` (211 lines) and
   `secretsFavorsConsequences.ts` (228 lines) export same-named functions — an unresolved
   fork. One must be canonicalized, the other retired with its tests (dead-contract test
   rule, DoD).
4. **Player verbs unreachable.** `action.secrets.plant_secret` / `action.secrets.reveal_secret`
   are authored but appear in no beat's `grantsActionIds` → unreachable by construction
   (THR-613/THR-501). Their template blocks carry no `graphOps`/`technicalEffect` markers —
   after granting, verify link 3 (effects actually fire) before calling the chain closed.

**What works:** `phaseSecretsFavors` (maintenance: decay/tension/expiry, registered in
`phases/index.ts`) and `computeInitialLeverage` (live at social-scene start via
`encounter.ts:242`). Leverage is the healthy limb — build toward it, not around it.

## Engine pillar

### Systems design

Fix order mirrors the causal chain — each step is independently verifiable:

1. **Generation (fix break 1).** Wire `secretDiscovery` outcomes into the *live* social
   pipeline: add `secret_discovery` aftermath effects to a starter set of existing
   social/tavern/guild templates (Content pillar) so secrets are born from ordinary social
   play, and repair the `secret-encounter-content.ts` path if the executor finds it
   selected-but-unrouted. Target rate: `SECRETS_TARGET_PER_100_TICKS` born in a standard
   run (tunable, see Constants).
2. **Consequences (fix breaks 2+3).** Canonicalize ONE consequence module (executor
   compares the two — keep the richer, migrate any unique effects from the other, delete
   the loser + repoint its tests). Call `applySecretRevelationConsequences` from the
   resolution path where a `reveal`-class outcome or the reveal card fires;
   `applyFavorBreaking/Redemption` from the favor-touching outcomes.
3. **Player verbs (fix break 4).** Grant both cards via a new pool beat (see Content).
   Verify their step outcomes actually mutate the graph (link 3) — if the templates carry
   only prose, add `graphOps` calling `createSecretEdge` / reveal consequences.

### Graph nodes / edges

No new node or edge types. `knows_secret_of` and `owes_favor` edges exist in the schema and
are the system's carriers; consequences mutate existing `relates_to` sentiment.

### Tick phases

No new phases. `phaseSecretsFavors` (6.653) continues as maintenance; generation and
consequences ride the existing encounter resolution/aftermath phases.

### Resolution logic

Reveal consequences use the canonical module's existing magnitude/relationship logic.
Leverage integration is already live — no changes to `computeInitialLeverage`.

### PRNG callouts

`generateSecret` already takes an rng; all new call sites pass the phase-scoped seeded rng
(existing pattern at orchestrator.ts:616). No `Math.random()`.

## Content pillar

### Encounter templates

- Add `secret_discovery` aftermath effects to `SECRET_SEED_TEMPLATE_COUNT` existing
  social/tavern/guild templates (extend in place — no new template files).
- Verify/repair the `SECRET_DISCOVERY_ENCOUNTER_TEMPLATES` registration so the dedicated
  secret encounters actually fire (THR-573 lesson: separate template files can be invisible
  to the live pool).

### Prose tables

Reveal/plant outcome prose exists in the card templates; extend only where the wired
`graphOps` need outcome variants. Threadbare voice per `Docs/canon/prose.md`.

### Attachment content

N/A — no attachment changes.

### Data tables

- **New pool beat** in `ascendant-beat-content.ts` (`ASCENDANT_BEAT_POOL`): Eye-flavored
  milestone beat (working name: *The Unveiled Eye*), `grantsActionIds:
  ['action.secrets.plant_secret', 'action.secrets.reveal_secret']`, eligibility gated on
  Eye reach practice or intel-record count (executor picks the existing eligibility
  predicate that fits; never re-offer held cards). Beat prose in
  `ascendant-pool-beat-templates.ts` following the established template shape.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — intelligence panel + action drawer).*

### Player-facing display

The player's known secrets surface as **intelligence records** in the existing
agent-detail intelligence panel (ARC-123 substrate) — no new panel. Verify a secret
learned via revelation appears there and is legible as targeting fuel for the reveal card.
Design-system conformance required: `frontend-ui` skill + `Docs/design-system/`, shared
primitives + tokens, no hardcoded hex.

### Event notifications

Secret revelation consequences emit a notification through the existing router (channel:
alert, icon: discovery-class) — reuse the ambition-completion pattern.

### Debug inspection (DebugPanel)

`secret_decayed` / `favor_tension` traces already exist; add `secret_born` and
`secret_revealed` (see Tracing). No new DebugPanel tab — traces suffice.

### Visual presence (HexMapV2)

N/A — no map signifier for v1 (secrets are interpersonal, not spatial).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `secretGeneration.ts` (existing) | encounter resolution + aftermath | — | graph edges | `secret_born` | trace viewer |
| canonical consequences module | aftermath application | notification router | graph edges | `secret_revealed` | trace viewer |
| beat grant (data only) | beat director (1.75) | AscendantBeatModal + ActionDrawer | `unlockedActionIds` | `action.unlock.granted` (existing) | `listUnreachableActions()` |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `SECRETS_TARGET_PER_100_TICKS` | 8 | Tuning target for generation rate in a standard run (evaluator target, not a hard gate) |
| `SECRET_SEED_TEMPLATE_COUNT` | 10 | How many existing social templates gain `secret_discovery` effects in v1 |
| `SECRET_DISCOVERY_CHANCE` | existing per-template | Keep per-template; no global override |

Existing `SECRET_*`/`FAVOR_*` constants in `types/secretsFavors.ts` are unchanged.

## Tracing

```ts
// secret_born — emitted when createSecretEdge lands a new knows_secret_of edge
interface SecretBornTrace {
  type: 'secret_born';
  // holderId: string; subjectId: string; secretType: string; magnitude: number; sourceTemplateId?: string;
}
// secret_revealed — emitted when revelation consequences apply
interface SecretRevealedTrace {
  type: 'secret_revealed';
  // revealerId: string; subjectId: string; audience: 'target' | 'public'; sentimentDelta: number;
}
```

Register both in `TRACE_CATEGORIES`. Aggregate per tick if any path can touch all agents
(trace-volume rule); these are per-event and low-volume by nature. Beware the `emitTrace`
Omit-collapse trap when adding fields — only `tsc -b` catches it.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `generateSecret` finds no valid secret type for target | returns null, caller skips, no trace spam |
| Reveal fires with no matching `knows_secret_of` edge | consequence no-ops + one `failSoft` trace |
| Beat granted twice / card already held | existing `resolvePendingBeat` dedup handles it |
| Consequence module throws | existing try/catch swallow in phase; aftermath wraps per-effect |

## Interface impact

Registry rows pre-seeded by this design session in `scripts/interface-contracts.ts`
(deferralTicket THR-724) — the executor's job is to turn them green (`verifiedLive` with
run evidence): `secrets-generation` (LEAKED — content-starved, 0 edges/120t) ·
`secrets-consequences` (LEAKED — zero production callers; module orphan) ·
`secrets-player-verbs-reachable` (LEAKED — no beat grants the ids). Actions: **extend**
Encounters→Secrets (generation), **add** Secrets→Encounters (consequences),
**add** Beats→Secrets (player-loop links 2–4). Leverage row may be added as
`verifiedLive` (encounter.ts:242 evidence).

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted — secrets/leverage are core to the social-systems
  vision (Social Expansion E) and the Eye identity.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes rules of play: two new castable cards enter via a beat, and reveal
  consequences become real. Update `Docs/canon/rulebook.md` §divine actions/§encounters
  rows from `[DESIGN]` to `[IMPL]` in the closing PR and re-verdict the section.
- [x] Quick-reference: add the secrets verbs line if the card list is enumerated there.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | new constants named; existing SECRET_*/FAVOR_* untouched |
| 2. Inspectability | PASS | secret_born/secret_revealed traces close the observability gap |
| 3. Determinism | PASS | seeded rng at all generation call sites; no Math.random |
| 4. Fail-soft | PASS | table above; existing swallow patterns preserved |
| 5. Narrative over mechanical perfection | PASS | consequences are sentiment/relationship prose events, not numeric-only |
| 6. Additive over destructive | PASS with note | one duplicate module is deleted — that is the fork *resolution*, with tests repointed |
| 7. Performance budget | PASS | event-driven; maintenance phase already interval-gated |

## Done when

- [ ] 120-tick CLI run (seed 42, medium): `knows_secret_of` edges > 0 born from ≥2 distinct
  template sources; ≥1 `secret_revealed` consequence fired (paste `eval` counts + trace lines)
- [ ] `__DEBUG.listUnreachableActions()` no longer lists the two secret card ids; seeded
  browser run shows the beat offering + both cards castable
- [ ] One consequence module remains; the other is deleted with tests repointed
- [ ] Registry rows for THR-724 flipped to `verifiedLive` with run evidence; generator green
- [ ] `npm test` + `npx vite build` pass; `tsc -b` net-new diff clean
- [ ] Closing commit + PR body include `Fixes THR-724`
- [ ] Browser-verify: intelligence-panel + beat modal screenshots at 1920×1080 (Playwright), console clean, `__DEBUG` state assertion

## Coordination block

**Suggested model:** opus — diagnosis is done and specific; execution is bounded (advisory;
the automation runs Opus regardless).

**Parallel-safe with:** THR-725 (disjoint: scoring/prosperity vs secrets modules), THR-726
(disjoint: ambition modules) — but see mutex.

**Mutex with:** any concurrent edit of `ascendant-beat-content.ts` /
`ascendant-pool-beat-templates.ts` (beat grant), `unified-action-templates.ts` secrets
family, or `scripts/interface-contracts.ts` (all three coupling tickets touch the registry —
land registry edits serially, rebase-regenerate on conflict like the UL dashboard JSON).

**Files to touch:**
- Edit: `src/engine/orchestrator.ts` / `src/engine/encounterAftermath.ts` (consequence call
  sites), one consequence module kept + one deleted, `src/data/ascendant-beat-content.ts`,
  `src/data/ascendant-pool-beat-templates.ts`, ~10 social templates, `src/types/trace.ts`
  (+ TRACE_CATEGORIES), `scripts/interface-contracts.ts` (flip rows green)
- Delete: the losing consequence module + its dedicated tests (repoint coverage)

## Notes for the executor

- **Do not green-field.** All four fixes are repairs to existing modules. If you find
  yourself writing a new secrets engine, stop and re-read the diagnosis.
- The two consequence modules must be *diffed* before choosing — one may carry effects the
  other lacks; migrate, don't drop.
- After granting the cards, verify link 3 (effects fire) — the template blocks currently
  show no graphOps/technicalEffect markers; prose-only steps would make the cards lie.
- Leverage (`computeInitialLeverage`) is live — do not touch it except to read.

## Forked-audit verdicts

**Skipped with recorded rationale (2026-07-23):** intent was verified interactively by the
user across the originating session (coupling assessment → player-lens verdicts → model
routing decision → "feel free to do the outstanding design work"), the interface framework
these plans instantiate passed an adversarial cold-context Fable review the same day
(verdicts in `Docs/plans/2026-07-23-system-interface-map.md` tail), and every diagnosis
claim here is runtime/grep-verified rather than intention-transcribed. Chat approval
satisfies the human gate (THR-608). Executor guardrail: if the substrate diverges from the
diagnosis, stop and surface — do not adapt silently.
