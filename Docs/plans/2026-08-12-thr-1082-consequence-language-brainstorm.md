# Brainstorm companion — Consequence language (THR-1082)

Alternatives considered, tensions held, and the Vision premises the plan stands on. The plan doc records what was decided; this records what was *rejected* and why, so the next session does not re-litigate it.

## The session's arc (2026-08-12, Christian live in chat)

The ticket arrived as an iconography problem (icon + noun + direction + magnitude). The first mockup solved that and Christian accepted the mechanics (chevrons, icon-first derived chips) — then reframed the deeper defect: the taxonomy is meaningless to a player, and the consequences themselves are plot-dead. His Eldritch Horror reference (the Albert Wilmarth ally card) was not about layout: it was about a consequence being a *story object* — a person who joins you, an injury that hampers you, a debt that follows you. The second mockup (SCAR/BOND/BOON/PATH with cause→change sentences) landed, with the addition that the whole attachment palette is consequence material.

## Rejected: reusing pips for consequence magnitude

Law 15 as written says pips are "the one sanctioned magnitude glyph language," which pointed at reuse. Rejected on Law 10 — pips already mean *effect on the odds*, and THR-972's director finding was precisely that two meanings sharing one silhouette at small sizes are indistinguishable. Cost pips got a frame to escape that; putting pip rows on consequence chips would walk back into it. The delta cluster keeps the *family* (filled triangles, the penalty-pip glyph) while being a visibly different shape grammar (1–3 stacked, not 5-slot rows). This is why the plan amends Law 15 rather than obeying it: the law's "one language" phrasing accidentally forbade what Law 10 demands.

## Rejected: THREAD as the plot-hook category name

Perfect word, poisoned well: *thread* is the god↔mortal bond, load-bearing across the UL, the UI (thread rows), and the pitch of the game itself. Overloading it would cost more in confusion than it buys in flavor. PATH chosen; TIDING, CALL, ROAD noted as alternates. Christian did not veto PATH.

## Rejected: keeping MARK as the fail-soft bucket

"Everything else" can never be explained in a tooltip that reads as fiction. The fail-soft *duty* is real (NFP #4) and is inherited by the polarity rule (gain→BOON, loss→SCAR, info→PATH), which always lands somewhere a player can read.

## Rejected: five visible magnitude steps

The data ladders are five-band and stay five-band. Five *triangle* sizes at 14px are not distinguishable, and Christian asked for "rough magnitude" explicitly. Three steps display; five bands persist underneath; the exact word rides the tooltip. If a future tuning pass wants finer display resolution, the map is one constant.

## Rejected: keeping a short generated sentence on derived chips

The mad-lib in miniature is still a mad-lib. "Vara's Stone grew steadily" cannot be made memorable by any template because nobody authored it — the encounter-pipeline skill's actor-centered rule already names this shape as the anti-example. Icon-first presentation is also what Christian literally asked for ("just showing with an icon that stone got a plus modifier of some rough magnitude"). The sentence survives as tooltip/aria text, which also keeps THR-1004's numeral gate meaningful at its single address.

## Rejected: shipping the companion category inside this ticket

A person-shaped attachment ("part of the retinue, not an agent") raises design questions this surface does not: how companions are named and portrayed, whether they expire, what bonuses they grant, how they interact with the cast system and knowledge gating. Bundling it would hold the language hostage to the hardest content problem. Split; BOND renders companions the moment they exist.

## Tension held: derived growth is still on screen every time

Christian called incidental capability growth "the least interesting thing that happened." The plan compresses it (icon-first, no sentence) but does not remove it. Removal was considered: rejected because growth is the one *always-true* feedback loop the player has for capability progression, and the compact form costs ~30px. If it still reads as noise after the content pass enriches the authored set, a follow-up can gate sub-band growth out of the chip list entirely — one adapter filter, no engine change.

## Vision premises this stands on

- **Personal-first consequences** (Christian, 2026-08-12, recorded in the plan's contract quote) — the aftermath is a success or failure *for the character* before it is a world-state diff.
- **Player-as-god reading mortals' stories** — chips are the god's ledger of what the mortal lived through, which is why cause precedes change in every sentence.
- **Plain register, picturable anchors** (THR-868) — cause→change sentences are event prose, not lyric; the mock's sentences were written to that bar deliberately.
- **Prose does the scene, cards do the rules** (THR-883) — the chip tag + cluster is "the rules"; the welded sentence is "the scene"; neither leaks into the other's job.

## Eldritch Horror findings carried over (from the issue, sharpened by the session)

1. Noun always named, typed, colored → our `stateNoun` + category tint.
2. Direction always explicit → our `direction` field, never inferred.
3. Magnitude secondary — *true for EH, false for us* (Christian's correction: our magnitudes genuinely vary) → hence a real magnitude idiom instead of omission.
4. Cost sits inside the fiction → our causality rule; the chip is one welded statement, not a paragraph plus a detached label.
