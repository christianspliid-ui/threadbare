# CI/CD review 2026-10-23 — CI drops the advisory Process lint step

**Shipped 2026-10-23** by the weekly `tb-cicd-review` lane (no ticket; Christian's 2026-10-09 ruling). Freeze-compatible (THR-1946): a removal.

**CI drops the advisory `Process lint` step.** It has had `continue-on-error: true` since 2026-04-23, so it never failed a PR, and nobody read its log. It spent 52–89 s of every `Test · Typecheck · Build` run. Its file checks already run blocking in `Generated artifact freshness` and `Wiki freshness (blocking)`. `npm run check:process` stays for local use.

A second tweak was drafted and withdrawn before push. It would have had pull-work Step 1.6 count a recent `succeeded` pickup run as alive when its transcript tail had no `wrap_up` call. The review gate showed that stand-down runs do not reliably call `wrap_up`, so the check would have stalled the lane.

Ledger: `Docs/ops/cicd-tweaks.md` on `ops`, entry dated 2026-10-23.
