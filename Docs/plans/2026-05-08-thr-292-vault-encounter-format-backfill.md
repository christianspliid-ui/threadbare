---
title: "THR-292 — Vault encounter architecture pages: unified-format backfill"
status: current
created: 2026-05-08
parent_issue: THR-292
parent_project: Encounter Format Migration
ticket_class: cleanup / documentation propagation
---

# THR-292 — Vault encounter architecture pages: unified-format backfill

## Plan doc

Filed 2026-05-08 by Cowork (scheduled `keep-work-flowing` pass). Tightens THR-292's scope to the actual remaining work after intermediate cleanup landed under THR-341 (2026-05-07 canonical sync of `Systems/Encounter System.md`).

> The `plan-pending-commit` label triggers `flush-plan-docs` to commit this plan doc to `origin/main` (hourly). Do not commit it manually.

Parent epic: [THR-292](https://linear.app/threadbare/issue/THR-292) (filed 2026-04-29 as a Codex-snapshot follow-on from THR-109).
Origin context: Codex's 2026-04-29 automation snapshot lacked the `TheFantasyWorldSimulator/Brainstorms` and `Vision` folders' siblings (Systems/, Ubiquitous-Language/, Cosmology/), so vault encounter architecture pages couldn't be reached from that session. Pattern precedent: THR-356 (Phase 5a cosmology vault propagation), shipped 2026-05-07.

## Cowork pre-flight audit (2026-05-08)

A vault grep on `EncounterTemplate` and adjacent terms returned only four match families:

| File | State | Action required |
|---|---|---|
| `Systems/Encounter System.md` | ✅ Updated 2026-05-07 (THR-341) — explicit migration note: *"All encounter templates are functionally migrated to UnifiedActionTemplate. The deprecated EncounterTemplate type was removed in PR #129."* | None — already canonical |
| `Ubiquitous-Language/Encounters.md` | UL auto-mirror; describes `EncounterTemplate` as a **conceptual term** (the "data-driven definition of an encounter's structure"), with `UnifiedActionTemplate` cross-referenced via `Also see`. Term itself is conceptually canonical, not stale TypeScript guidance. | Optional UL-proposal follow-on (see §6). Not blocking THR-292 closeout. |
| `Ubiquitous-Language/README.md` | UL auto-mirror; lists both terms in the always-load index. | None — both terms are valid concepts. |
| `log.md` | Historical entries (THR-90, THR-91, THR-307, THR-356, etc.) | None — historical entries are immutable per change-audit-trail policy. |

**Conclusion:** Two of the three THR-292 acceptance bullets are already met:
- [x] *Encounter architecture pages in Obsidian reflect unified-only format.* — Systems/Encounter System.md states this explicitly.
- [x] *No stale `EncounterTemplate` guidance remains in vault encounter architecture docs.* — Systems page is clean. UL pages describe `EncounterTemplate` as a concept (still valid), not as a TypeScript class.
- [ ] *Vault log entry appended.* — **outstanding.**

This ticket therefore reduces to a single mechanical action: append a closeout entry to `TheFantasyWorldSimulator/log.md` documenting the verified state, and re-run a verification grep.

## Goal

Close out THR-292 by:

1. Re-running the verification grep (`EncounterTemplate` against the vault, excluding `log.md` and `Ubiquitous-Language/`) and confirming it returns no hand-curated stale guidance.
2. Appending a closeout entry to `TheFantasyWorldSimulator/log.md` via the `vault-log` skill.
3. Optionally filing a UL-proposal follow-on (§6) — not in scope for this ticket; flagged for next user-present session.

## Three-pillar coverage

This is a documentation propagation ticket. Per the Three-Pillar Rule, three-pillar coverage is required or each pillar must be marked N/A with rationale.

| Pillar | Coverage |
|---|---|
| **Engine** | N/A — no code change. EncounterTemplate TypeScript type was removed under PR #129 (THR-90, shipped 2026-04-17). This ticket does not touch source. |
| **Content** | ✅ — vault encounter architecture pages (in scope: `Systems/Encounter System.md`, conceptually `Ubiquitous-Language/Encounters.md`). Already aligned per pre-flight; this ticket only appends the closeout log entry. |
| **UI** | N/A — no UI change. Vault is read by humans + agents; not surfaced in the game viewport. |

## Wiring

Per `Docs/plans/wiring-checklist.md`: no orchestrator phase, modal, GameState field, trace, or player control affected. Vault content is not consumed at runtime by the game; it is consumed at design time by agents. The wiring surfaces touched are:

- `TheFantasyWorldSimulator/log.md` (vault changelog) — append-only.
- `Docs/changelog.md` (repo changelog) — append closeout row at Definition-of-Done.
- Linear THR-292 — completion comment; auto-close on merge via `Fixes THR-292`.

## Non-Functional Priorities — compliance audit

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | N/A | No magic numbers; this is a doc ticket. |
| 2. Inspectability | N/A | No new traces. The vault log entry IS the inspectability artifact for this change. |
| 3. Determinism | N/A | No PRNG-touched code path. |
| 4. Fail-soft | PASS | If `vault-log` cannot reach Obsidian MCP, the skill's filesystem fallback writes directly to the vault file (requires `OBSIDIAN_VAULT_PATH`, set per CLAUDE.md sandbox notes — see impediment #66/71/75/86). |
| 5. Narrative over mechanical perfection | N/A | No game-facing narrative. |
| 6. Additive over destructive | PASS | Log entry is append-only. No deletions or restructures. |
| 7. Performance budget | N/A | One file write. |

## Constants

None — pure documentation propagation.

## Tracing

None added. Verification surface is the grep result + the appended log line.

## Fail-soft

| Failure case | Behavior |
|---|---|
| Obsidian MCP unreachable | `vault-log` skill auto-falls-back to filesystem write at `$OBSIDIAN_VAULT_PATH/log.md`. If `OBSIDIAN_VAULT_PATH` is unset, the skill fails loud rather than dropping the entry silently — surface the impediment via `impediment-reporter` and ping the user. |
| Verification grep finds unexpected stale references | Stop, do not append the closeout log. Comment on THR-292 with the grep output and ping the user; the assumption that THR-341 already fully cleaned the architecture pages would be wrong and we'd want a Cowork pass to scope the residue before closing. |

## Scope (binding done-when)

Codex/CC must satisfy all three before claiming Done:

1. **Verification grep clean.** Re-run `Get-ChildItem -Recurse 'TheFantasyWorldSimulator' -Include *.md -Exclude 'log.md' | Select-String -Pattern 'EncounterTemplate' -CaseSensitive` (or equivalent). Acceptable hits: any inside `Ubiquitous-Language/` (auto-mirrors describing the conceptual term — not stale guidance) and `Systems/Encounter System.md` (the explicit migration note). Any other hand-curated hit is a stop-and-comment trigger.
2. **Log entry appended.** Use the `vault-log` skill (or filesystem fallback) to append a single line to `TheFantasyWorldSimulator/log.md` matching the existing format, e.g.:

   ```
   - **update** | 2026-05-08 — THR-292 closed: verified Systems/Encounter System.md is canonical (PR #129 migration note + THR-341 sync from 2026-05-07). UL Encounters.md describes EncounterTemplate as a conceptual term (data-driven definition); UnifiedActionTemplate is documented separately as the implementing type. No hand-curated vault page carries stale TypeScript-class guidance. Verification grep clean.
   ```

3. **Repo changelog row appended.** Append to `Docs/changelog.md`:

   ```
   | 2026-05-08 | TheFantasyWorldSimulator/log.md | THR-292 closeout entry | confirm encounter architecture pages reflect unified-only format |
   ```

## Coordination block

**Suggested model:** sonnet
**Parallel-safe with:** every other in-flight ticket (no source-tree overlap; vault writes only).
**Mutex with:** none.
**Codex review:** no — single log line + verification grep, no judgment work, structural review would add no signal.

## Routing rationale (CC vs Codex)

Routing to **CC sonnet** (Ready for Dev), not Codex, for two reasons:

1. **Vault MCP/filesystem access pattern.** Phase 5a (THR-356) precedent: CC sonnet executed vault propagation cleanly with the Obsidian MCP + `OBSIDIAN_VAULT_PATH` filesystem fallback wired. Codex sandboxes have repeatedly hit Obsidian MCP unreachability (impediments #66/71/75/86), and the snapshot-folder limitation that originally created THR-292 still applies in the Codex automation environment.
2. **Verification-grep tooling.** PowerShell `Get-ChildItem | Select-String` works reliably in CC. In Codex, `rg.exe` is blocked (impediments #15/28/33/37), and the PowerShell fallback works but with the variable-scoping caveat from impediment #44. CC's environment is the safer choice.

If CC sandbox Obsidian MCP is unreachable, fall back to filesystem write at `OBSIDIAN_VAULT_PATH/log.md` per the existing `vault-log` skill; do not retry indefinitely (per "Known Sandbox Limitations" in CLAUDE.md).

## Children / follow-ons (not in this ticket)

### Optional UL-proposal: add "Implementation type" pointer to `EncounterTemplate` UL entry

Currently the UL Encounters.md entry for `EncounterTemplate` (`Docs/ubiquitous-language/Encounters.md` is the source of truth; vault is auto-mirror) describes the term as the *concept* of a data-driven encounter definition, with `UnifiedActionTemplate` only listed under `Also see:`. A reader of UL alone could miss that the implementing TypeScript type was renamed.

A small UL-proposal could:

- Add an explicit "Implementation type: `UnifiedActionTemplate` (the legacy `EncounterTemplate` class was removed in PR #129)" line to the entry.
- No status change to "deprecated" — the conceptual term is still valid; only the class name changed.

This is a **separate ticket**, not in scope for THR-292. File as a `UL-proposal` Linear issue (Continuous Improvement project) when a Cowork pass next has cycles, or hand off to the next session-start board scan.

### Phase 5a / 5b precedent for any future encounter-format vault residue

If future work uncovers other vault pages that conflate the conceptual term with the old TypeScript class, the cleanup can mirror this ticket's structure: pre-flight grep, scope to actual residue, route via CC if vault MCP needed.

## Acceptance (Linear)

Per the original THR-292 description, with the §3 binding done-when refinements:

- [x] Encounter architecture pages in Obsidian reflect unified-only format. *(verified by Cowork pre-flight 2026-05-08)*
- [x] No stale `EncounterTemplate` guidance remains in vault encounter architecture docs. *(verified by Cowork pre-flight 2026-05-08; UL auto-mirror entries describe the conceptual term, not stale TypeScript-class guidance)*
- [ ] Vault log entry appended. *(this ticket's only mechanical action)*

## Definition of Done (executor)

Standard Definition of Done from CLAUDE.md, plus:

- Closing commit must include `Fixes THR-292` in the body so the merge-to-main auto-close fires.
- Verification evidence in the closing commit body or Linear closeout comment: paste the verification grep output (must show only the acceptable hits enumerated in §3 item 1).
- No other commits should be touched in the same PR — this is intentionally a one-line vault write + one-line repo changelog entry.
