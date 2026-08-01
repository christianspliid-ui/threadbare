---
needsChristian: thr-860-capital-cluster-verdict, thr-883-prototype-verdict-ready, thr-931-docs-gates-required-check
queue: backed-up
freshness: healthy
deploy: skipped
tasks: ok
---
# Briefing

**Generated:** 2026-08-01 09:59 local (07:59 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two changes this hour, both good.** The one-line command you were carrying has gone away on its own, and the item I flagged last hour as "not yet" is now ready.

**1. The verdict on the five prototype encounters.** *(unchanged)*

Still the one thing everything else waits behind. **Play the five and tell me if the format is right.** Eleven content jobs are paused until you do.

It's one sitting: you play the five end-to-end and give a plain-language verdict on the prose, on the rhythm of when things fire, on whether the world visibly reacts, on how it looks, and on whether it's fun. **"Needs another go" is a perfectly good answer** — it settles the question and charters the next round. That is the last step of the encounter-slice plan; finishing it finishes the plan.

**2. The four capital-city encounters that ride along with that verdict.** *(unchanged)*

A council mediation over a millrace, a noble's court at a ford toll house, two feuding houses and the seam where their banners meet, and a monument that turned into a problem with a rock. Written, finished, deliberately not landed — they're in the *old* style. When you lock the format they either go in as they are and get tidied up later alongside the seven earlier ones, or get dropped and rewritten under the new rules. **Nothing is lost either way** — the work is safe on its own branch, and has been for about 45 hours. Same sitting as the verdict, not a separate visit.

**3. NOW READY — one tick in a GitHub setting. About two minutes.**

Last hour I told you this was coming and asked you *not* to do it yet. **The thing it was waiting for landed at 09:51 this morning, so it is safe to do now.**

What it is: we added a second, much faster automated check that catches broken documentation on documentation-only changes — the kind that until now went through with nothing checking them at all. It runs, and it shows a red or green mark. It does **not** yet stop a bad change from going in. Turning it into a real stop is a GitHub setting, and that setting is yours alone — no agent can change it.

Where to click:

> GitHub → the `threadbare` repo → **Settings** → **Branches** → the protection rule for `main` → **Require status checks to pass before merging** → type **`Docs gates`** in the search box → tick it → **Save changes**.

Leave the existing `Test · Typecheck · Build` check ticked as it is — this one goes *alongside* it, not instead of it.

**Why it's worth the two minutes, from something measured this morning:** a documentation change went in at 09:54, **three seconds** after the required check reported "nothing here to check", while the new documentation check was *still running*. Had that check gone red, the change would have merged anyway. Ticking the box closes exactly that gap, and it does not slow normal work down.

---

**Cleared since last hour, nothing for you to do:** the one-line command about your working copy is **gone**. Your copy had stopped updating because an automated session left a loose file in your folder that git refused to overwrite. That is now fixed in the automation itself, the loose file was cleared safely, your copy caught up on **88 stranded changes** at 09:11, and it has been updating normally since. **Your own edits — your two settings files and both retrospective drafts — were untouched, exactly as promised.**

## Queue

**Backed up — 64 ready, 2 parked, none actively being worked.** One urgent, 11 high, 4 medium, 4 unranked, 44 low-priority tidy-ups. Both parked items are decisions 1–3 above, so nothing is sitting parked without a reason. The urgent one is a real bug in the encounter demo links — steps after the first resolve silently — and it is next in line for the automated lane.

- **Two ready items are invisible to the pickup lane.** Both were filed with a name attached, and the lane only picks up unclaimed work, so they will sit unnoticed. Was one last hour, now two. Agent-side bookkeeping, already tracked as a known defect — not yours.
- **One item has been waiting 8 days** — merging two duplicate code paths for casting. The only one past the staleness bound, and low priority.

## Freshness

**Home tree is current and healthy** — on the main line, up to date apart from the last few minutes' normal churn, and the automatic sync is running on time again after this morning's repair. Your two settings files still show local edits; they are safe, and nothing arriving touches them. Housekeeping ran 19 minutes ago and is healthy: 30 worktrees, 49 branches, nothing awaiting a decision.

Live site is fine — everything published since the last build touched only notes and documentation, so no rebuild was needed. Automated checks are running normally, nothing is stuck waiting to merge, and all 9 scheduled jobs are on time.

## What's moving

Seven changes landed on the main line in the last two hours. The two that matter to you are both above: **the automatic-sync fix that unstuck your working copy**, and **the documentation check that makes item 3 ready to tick**. The rest is planning-lane bookkeeping and these hourly briefings.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
