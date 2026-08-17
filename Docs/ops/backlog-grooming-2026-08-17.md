---
lane: daily-backlog-grooming
run: 2026-08-17
promoted: 0
filed: 0
resolved: 1
swept: 3
canceled: 0
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-08-17

## Needs Christian
- **Read 2 encounters and rule on them** (THR-1130). Batch 1 of the encounter retrofit shipped and merged; it waits only on your 2-of-6 sample verdict. Proposed pair: Ward the Camp (thinnest start) and Tend to Wounds (warmest tone). Parked ~34 h, and nothing else on the retrofit can move — batch 2's brief is gated behind the verdict, and 9 of the 15 encounters sit behind batch 2.
- **One attended session with a dev server** (THR-1133). 13 screenshots across 6 shipped UI surfaces owing their 1920×1080 capture. The hourly lane is refused a dev server, so this discharges only when you are present. It grew 4 → 6 passes in two days and will keep growing.

## Work in flight
- **THR-1152** (veil step-replay affordance) — claimed today 07:02Z with coordination block. Sole live WIP, healthy.
- **THR-1130** — park, not stalled. Batch 1 landed under sibling id THR-1131 (PR #1494). Camp seven + sequels remain, gated on the verdict above.

## Technical gates resolved this run
- **THR-1153** — mutex-liveness note posted. Its `Mutex with: THR-1130` reads as a live partner, but THR-1130 is a park with no concurrent editor of `vertical-slice.ts`, so the collision is prospective, not current. Mutex left in place; the reversal stays the executor's call. This was the only thing making the claimable shelf read as empty.

## Counts by state
In Dev 2 (1 live, 1 park) · Ready for Dev 2 · Todo 12 · In Design 1 · Implementation Planning 0 · Idea ~85.

## Problems found and fixed
- No orphans — every issue in all six states carries a project. No state/priority contradictions; all "Now" projects are High. No In Design item over 7 days (THR-790 at 2 d).
- **Reported, not fixed:** `Plan Cross-Linking Infrastructure` is an empty project — zero issues ever, Idea status, untouched since 2026-04-23. Deletion candidate; left rather than guessed at.
- **Reported, not fixed:** `.planning/ROADMAP.md` § Future Work still lists TB-095…TB-099 as pending, but all five map to subsystems the generated `systems-inventory.md` shows built (Companies THR-74, Ambitions & Initiatives, Factions & Succession, Secrets & Favors). Doc drift is non-qualifying under Rule 0 — logged, not ticketed. **No roadmap tickets filed**, and that is the finding: filing them would be the THR-614 green-field duplicate the roadmap's own warning block names.

## Materiality sweep
In-scope 3 · canceled 0 · consolidated 0.
- **THR-1134** (Continuous Improvement, High, no cost/benefit line) — **stands.** Filed at Christian's explicit request for a diagnostic he cannot get today; a director ask outweighs the boilerplate line the minting bar asks for. Demoting on a missing form field is precisely the Goodhart failure § 2.5 exists to catch.
- **THR-1114** (`Improvement`, Low, two off-cosmology `sphereAffinity` values) — **stands.** Looks like a two-value data fix (question 2), but it is a content call on what the actions *mean* plus a corpus-wide invariant test that closes the class. Player-visible Codex data, not lane machinery.
- **THR-1133** ruled **out of scope** — no `Infrastructure`/`Improvement` label, not Continuous Improvement; it verifies shipped product UI. Doubt recorded: it is paperwork-shaped and question 3 is arguable, but it discharges real owed evidence on six surfaces, so it stands.

## Pipeline status
Thin shelf, but **product work, not process sludge** — a healthy inversion from 2026-08-11. Next pickup: **THR-1153** (High, three-pillar), now that its mutex is documented as non-concurrent. THR-1133 is the only other Ready-for-Dev item and the hourly lane cannot take it. If THR-1153 lands before the verdict above, the claimable shelf is empty — the fix is upstream supply (THR-1134 needs a design pass; no coordination block, sits in Todo), never more process tickets.
