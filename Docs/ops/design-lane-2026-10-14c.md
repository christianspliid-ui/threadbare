---
lane: tb-design-lane
run: 2026-10-14c
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-14 (run c, ~07:05Z)

## Needs Christian

Nothing needs your decision. One thing only you can do, when convenient, is under Escalations.

## Decided for you

- [The encounter coverage map](https://linear.app/threadbare/issue/THR-1723/content-categorization-runs-with-typesafe-first-run-encounter-coverage) — **a map of what our 567 encounters are about, so the next ones fill the gaps.** This is the TypeSafe run you asked for on 4 Oct.
  - **What it reads.** Each encounter's story text, *without* the labels its author gave it, so the reading is independent.
  - **What it judges.** Four things, all in words we already use:
    - which Reach the encounter tests;
    - which Spheres its story expresses (530 of 567 name none today);
    - what the mortal is doing (explore, duel, build…);
    - the walk of life it happens in (trade, the wilds, the divine…).
  - **What comes out.** A grid of crowded and empty corners for the encounter writers, and a list of encounters whose story seems to test a different Reach than the one they are filed under.
  - **Nothing changes by itself.** The tool never edits an encounter or a tag. Every finding is a list for someone to read.
  - **Where it lives.** The results live on the ops branch, beside the lane reports, and are re-read instead of re-asked. That keeps a full run at about 10 cents.
  - **How it is checked.** A separate Claude reader labels 64 encounters without seeing TypeSafe's answers. The map only trusts answers where the two agree at least 85% of the time. Otherwise it says plainly that it cannot be trusted yet.
  - **No game screen.** The encounter catalog stays hidden from players, as already ruled.
  - **Links:** [plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-14-thr-1723-encounter-coverage-map.md), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-14-thr-1723-encounter-coverage-map-brainstorm.md).
  - Building waits until 09:30 on Thursday 15 Oct (07:30 UTC).
  - *To veto, say:* **"show me the map in the game's wiki"**, **"have a person check the sample, not Claude"**, or **"let it fix the labels it is sure about"**.

## Work

- **Why a plan doc.** Ready for Dev held 1 non-Deferral item, below the floor of 4. The orchestrator had staged [THR-1723](https://linear.app/threadbare/issue/THR-1723/content-categorization-runs-with-typesafe-first-run-encounter-coverage) for this lane at about 02:30Z. It builds on no lane decision, so no veto window applied. No vetoes in the briefing; nothing of this lane's to resume.
- **Claimed** with marker `design-lane claim 2026-10-14c`, assignment verified.
- **Measured** on `main` @ `667869d2` with a scratch script over the Encounter kind:
  - 567 entries; 37 declare a Sphere, 186 an activity, 107 wear a family tag.
  - Three proof templates declare a Reach that is not one of the Eight (`resolve`, `combat`). The runner reports them; fixing them is not this ticket's work.
  - Text is a median 2,950 chars per entry, 37k at most, which fits TypeSafe's 32k-token limit.
  - The price is $0.042 per million input tokens (TypeSafe models page, read today). A full run is estimated at about 2.3 M tokens, roughly $0.10.
- **Gates:**
  - Intent judge: **Allow**, with two gaps closed before the PR:
    - It now states that the two theme lists are local to the run and do not split the tag axis the UL warns about.
    - A kill-criteria section was added.
  - NFP audit: **pass with notes**. One unnamed number got a constant.
  - Three-pillar audit: **pass**.
  - Vision audit: **pass with notes**. Vision files are now cited.
  - `npm run gate -- --final` PASS; `check:plan-doc-liveness` LIVE.
- **PR:** [docs(plan): 2026-10-14 encounter coverage map](https://github.com/christianspliid-ui/threadbare/pull/2368), merged.
- **Handed off** to Ready for Dev, unassigned, with `Claimable from: 2026-10-15T07:30:00Z` in the description and the coordination block as the latest comment.
- **Filed** [First encounter coverage run](https://linear.app/threadbare/issue/THR-1850/first-encounter-coverage-run-judge-all-encounter-entries-with-jev) as slice B: the paid run, the 64-entry check, publishing the map and one ticket per kind of finding. It is Todo and unassigned, blocked by the runner ticket and by the key below.
- **Self-corrected:** the plan branch was first pushed under a name carrying the issue id. Linear can read that as a closer, so it was renamed before the PR opened and the old remote branch deleted.

## Escalations

- **One step only you can take, when convenient: set the TypeSafe key.** Add `TYPESAFE_API_KEY` as a Windows user environment variable on the home computer. The key comes from [the TypeSafe console](https://console.typesafe.ai/). Do not paste it into chat. Checked today: it is not set. The runner can be built without it, but [the first coverage run](https://linear.app/threadbare/issue/THR-1850/first-encounter-coverage-run-judge-all-encounter-entries-with-jev) waits on it.
