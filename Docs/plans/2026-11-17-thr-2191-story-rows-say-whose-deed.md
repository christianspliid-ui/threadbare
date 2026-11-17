> **title:** A Story row says when the deed was done to the subject — THR-2191
> **linear_issue:** THR-2191
> **author:** Claude Code (design lane, run dl-20261117T1719Z)
> **created:** 2026-11-17
> **three_pillars:** Engine done (one fact rule in the Connections builder, fold key) · Content done (four role words) · UI done (no component change; the words land in the row's existing fact slot)

# A Story row says when the deed was done to the subject — THR-2191

A sheet's Story list names each chapter and nothing else, so "Destroy a power" on the sheet of the mortal
whose power was destroyed reads as their own deed. This plan adds a short role word after the chapter name
when the subject did not do the deed, and leaves their own deeds unmarked.

## Why this is load-bearing

The Story group is where the player reads a mortal's (or a faction's, or a relic's) life at a glance (UI Law 55,
story continuity). A list that cannot tell "they did it" from "it was done to them" tells the wrong story
whenever the subject was the target. The ticket was raised by the design lane while planning
[the Story rows name the deed](https://linear.app/threadbare/issue/THR-2145) (2026-11-07): that slice removed a
leaked key, `(afflicted)`, which had been the only hint of the role on one row kind.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Connections builder, Story recipe (`src/engine/views/connections.ts`) | 🟢 ACTIVE | **extends** — one new fact rule on the three `participated_in` Story steps; the repeat fold keys on role too |
| `participated_in.role` on event edges (encounter, undertaking outcome, fight, battle, world past, appointment, prayer writers) | 🟢 ACTIVE | **read only** — no writer changes |
| Story repeat fold (`foldStoryRepeats`, THR-2223) | 🟢 ACTIVE | **extends** — keeps the role word and the repeat word together |
| Link row render (`LinkRows`, `src/components/shared/Section.tsx:552-583`) | 🟢 ACTIVE | unchanged — already draws the fact after the name chip |
| Inspector words (`INSPECTOR_WORDS`, `src/data/view-content.ts:105`) | 🟢 ACTIVE | **extends** — one `storyRole` sub-table |

Measured on `origin/main` `38acd7fb`:

- The Story steps set no fact: `story: [{ edge: 'participated_in', dir: 'out', only: 'event' }]` for person
  (`connections.ts:81`), faction (`:117`) and artifact (`:132`); the location step is `occurred_at` (`:97`) and has
  no participant role. `factFor` returns `''` when the rule is absent (`:237-238`).
- The row draws `<Chip …label={row.name}/>` then `{row.fact && <span …tertiary>{row.fact}</span>}`
  (`Section.tsx:577-578`): the fact sits right after the name, which is where the text-position decision puts a
  row's secondary word ([text positions](https://linear.app/threadbare/issue/THR-2119), rule 6: a chip comes after
  the row's name).
- Since THR-2223 the fact slot already carries the repeat word ("twice", "five times") for a folded chapter, and
  the fold (`foldStoryRepeats`, `connections.ts:282-305`) **overwrites** the fact (`:302`) and keys only on the
  template (`:496-499`). So a
  mortal who ran *The Gallows Pardon* once and had it run on them once shows one row, "twice", with no role.
- Role values, census of every `participated_in` edge into an event node, CLI `--seed 42 --map medium`, `tick 300`,
  then one `eval` over the graph's edges:

  ```
  {"n":3407,"c":{"individual:primary":3277,"individual:target":78,"individual:fighter":19,
   "individual:opponent":19,"individual:attacker":3,"individual:fallen":2,
   "faction:target":3,"faction:winner":2,"faction:loser":2,"culture:(none)":2}}
  ```

  Writers, by grep: `primary` / `target` (`encounterEventNode.ts:122`, `:131-140`; `grievance/undertakingOutcomeNode.ts:294-362`),
  `fighter` / `opponent` (`fights/fightRecord.ts:17-18`), `attacker` / `defender` (`battleRecord.ts:171-176`),
  `winner` / `loser` and `fallen` (`worldPast.ts:372`, `:443`), `primary` (`appointments.ts:449`),
  `answered` (`prayers.ts:616`, the god only; the god page has no Story group).

So 96% of a mortal's Story rows are their own deeds. The role word belongs on the other 4%.

## The decision

**Decided by delegation — design lane, 2026-11-17 (process.md rule 4). Veto in chat.**

A Story row says **who the deed belonged to only when it was not the subject's own**. The word sits in the row's
existing fact slot, right after the chapter name, in the tertiary colour every fact already uses. Own deeds stay
unmarked. One word per edge role, from one table:

| Edge role | Who the subject was | Row reads (example) |
|---|---|---|
| `target` | the one the chapter was done to | **Destroy a power** done to them |
| `opponent` | the one a fight was started against | **Fight at the Old Mill** set upon |
| `defender` | the commander whose side was attacked | **Battle at Greywater** defending |
| `fallen` | a commander who died in a past war | **The War of the Fords** fell in it |
| `primary`, `fighter`, `attacker`, `winner`, `loser`, none | the doer, or both sides of a war | *(no word)* |

When a row also folds repeats, the role word comes first and the repeat word second, joined by the middle dot
every fact already uses: **The Price on Their Head** done to them · twice. The fold keeps a mortal's own runs of a
chapter and the runs done to them as **two rows**, so the repeat count never mixes the two.

- **Why only the minority is marked:** 96% of rows are the subject's own deed (census above). Writing "by them"
  on 3,277 rows to set off 78 would add a word the eye must skip on almost every line; the plain list already
  reads as "what they did", the way a chronicle reads. The exception is the information.
- **Why one word per role, not per chapter:** the role is on the edge for every writer; a verb per template would
  be a content table over every chapter (541 story chapters, per
  [the chapters-with-a-hand plan ticket](https://linear.app/threadbare/issue/THR-2179)) to keep in step with each
  new one. Rejected.
- **Why "done to them", not "against them":** a target is not always harmed. The same census, grouped by chapter
  name for the 78 `target` edges, is mostly hostile (*The Price on Their Head* 36, *Old Blood* 9, *Seize a place* 6)
  but also holds *Consecrate a pilgrim way*, *Create an item*, *Investigate Reputation* and *Browse the Library*.
  "Done to them" holds for both kinds; "against them" would call a consecration an attack.
- **Why winner and loser stay unmarked:** both realms waged the war. Who won is an outcome, not a role, and
  outcome words on Story rows are a separate question (see Out of scope).
- **"Them" for every subject:** the third-person plural fits a mortal, a faction and a relic's bearer alike, and
  stays out of the second person (UI Law 42).

**Would change the call:** Christian wanting every row marked ("by them" on own deeds too), or wanting outcome
words (won / lost) on Story rows; a warm-round tester still reading a target row as the mortal's own deed (then
the role word moves before the name).

## Engine pillar

In `src/engine/views/connections.ts`:

1. Add `'storyRole'` to `FactRule` (`:51`). `factFor` (`:237`) gets `case 'storyRole': return storyRoleWord(edge);`
   where `storyRoleWord` reads `edge.properties.role` as a string and looks it up in
   `INSPECTOR_WORDS.storyRole`; an unknown or missing role returns `''`.
2. The three `participated_in` Story steps (person `:81`, faction `:117`, artifact `:132`) gain `fact: 'storyRole'`.
   The location Story step (`occurred_at`, `:97`) is unchanged: it has no participant.
3. Fold by role too: where `templateKey` is built (`:496-499`), append the row's role word when it is not empty
   (`${templateKey}|${row.fact}`), so own runs and runs done to the subject fold separately.
4. `foldStoryRepeats` (`:282-305`) keeps the role word: the folded row's fact (today overwritten at `:302`)
   becomes `[roleWord, storyRepeatWord(runs)].filter(Boolean).join(' · ')`. Carry the role word on `Collected` (a
   new optional `roleWord` field) rather than re-parsing `row.fact`. The field must also survive `push`'s
   action-instance replace path (`:463`, `items[at] = { row, sortKey, tick, templateKey, startsRun: true }`),
   where a two-step chapter's later step replaces the earlier one: pass `roleWord` through there too.
5. Story sort stays tick-first (`sortRows`, `:429-431`); the fact does not enter it.

No graph, edge or writer change. No new node or edge type. Pure function of existing state, so determinism holds.

## Content pillar

One sub-table in `INSPECTOR_WORDS` (`src/data/view-content.ts`), beside `storyRepeat` (`:126`):

```ts
/** THR-2191 — a Story row's role word, only when the deed was not the subject's own. Keys are `participated_in.role`. */
storyRole: { target: 'done to them', opponent: 'set upon', defender: 'defending', fallen: 'fell in it' },
```

Roles not in the table render no word (the doer's roles, `winner` / `loser`, and any future role until it is
added). These are plain words, not new game terms, so no UL proposal is owed.

## UI pillar

Browser-verify tool: **Playwright DOM** (the Inspector is DOM).

### Player-facing display

No component change. The word arrives in `LinkRowVM.fact`, which `LinkRows` already draws after the name chip
(`Section.tsx:578`), tertiary colour, wrapping with `overflowWrap: 'anywhere'`. Every Story group on the person,
faction and relic pages gains it; the record page's own "who took part" rows are unchanged.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Mortal sheet → Story, a chapter run on them | **Destroy a power** done to them | PC-6 (one fact told two ways) | The power was destroyed by someone else; the name opens the chapter to see who. |
| Mortal sheet → Story, a fight they were jumped in | **Fight at the Old Mill** set upon | PC-6 | They were attacked, not the attacker. |
| Mortal sheet → Story, a chapter both ways | **The Price on Their Head** twice, and **The Price on Their Head** done to them | PC-5 (repeated rows) | Two rows: their own two runs, and the one done to them. |
| Mortal sheet → Story, their own deed | **Tend the Shrine** | none | Unchanged: unmarked means their own. |

**PC-6: the other surfaces that show this fact.** The row's link opens the event's record page. Its "What
happened" line names the doer: `eventFallbackSummary` picks the `role: 'primary'` edge and writes "{doer} took a
step in {chapter}, and it …" (`detailPageResolvers.ts:953-970`). A fight's record summary reads "{fighter} fought
{opponent} here." (`fights/fightRecord.ts:70-73`). Both name *someone else* as the doer when the sheet's row says
"done to them" or "set upon", so they agree. The record page's "who took part" rows show each person's trade, not
their part (`connections.ts` record recipe, `fact: 'role'` → `wordedRole` → `displayTradeLabel`), so they neither
agree nor disagree; giving them role words is out of scope. Before this plan the sheet disagreed with the record
page by omission: the record named another doer, the sheet listed the chapter as the mortal's own.

**PC-5: what de-duplicates the Story rows.** A row is one action instance (THR-2139), and the runs of one chapter
fold into one row (THR-2223). After this plan the fold key is the chapter **plus** the role word, so one chapter
shows as at most two rows: the subject's own runs and the runs done to them. A subject with ten runs each way sees
**The Price on Their Head** ten times, and **The Price on Their Head** done to them · ten times.

### Playtest signal

A warm-round tester describing a mortal's past from the sheet never claims as the mortal's deed a chapter that was
done to them.

### Event notifications · Debug inspection · Visual presence (HexMapV2)

None. No new `__DEBUG` accessor: the row is read from the DOM by `data-link-row`, and the edge role is already
visible to `__DEBUG` graph reads.

### UI Laws engaged

Law 55 (story continuity: the Story list reads true), Law 13/14 (words, no raw keys: the edge role key never
renders, unknown roles render nothing), Law 16 (the word is part of the row's fact, not a label strip), Law 42
(plain register, no second person), Law 56 second clause (the word is backed by the edge it names), Law 25
(nothing new renders over an empty row), Laws 1, 17, 21, 33, 37 (unchanged: same subject chip, colour, links,
viewport and chrome).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — no new module, so no new wiring row is owed.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `connections.ts` `storyRole` fact | N/A (view build, on read) | `LinkRows` in the Inspector's Connections block | none new (reads `participated_in.role`) | none | DOM `data-link-row`; graph edge role |

## Interface impact

| Contract | Change |
|---|---|
| Event writers → `participated_in.role` → Connections Story | **extend** — the view now reads `role` (already required on the edge by `EDGE_SCHEMA`, `appointments.ts:449`); writers unchanged |
| Connections → `LinkRowVM.fact` → `LinkRows` | **preserve** — same field, new words in it |

A read of an existing edge property by a view, inside one subsystem's presentation path; no cross-system write
is added. The executor records the read site in `Docs/canon/interface-map.md` if the Connections row there lists
the edge properties it reads, and leaves `scripts/interface-contracts.ts` alone unless its gate asks.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `INSPECTOR_WORDS.storyRole` | four entries (above) | The role word per `participated_in.role`; a role missing from the table renders no word |

## Tracing

N/A — a presentation read of existing state; no decision is made that a trace could explain.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Edge has no `role`, or a role not in the table | No word; the row renders as today. |
| `role` is not a string | Treated as missing; no word. |
| A legacy step node with no `actionId` | Folds by template and role exactly as THR-2223 does today. |

## Done when

- [ ] **Unit** (`thr2191-story-role-words.test.ts`, graph fixture): a person who is `target` on an encounter event
   gets a Story row whose fact is exactly `done to them`; `opponent` → `set upon`; `defender` → `defending`;
   `fallen` → `fell in it`; `primary`, `fighter`, `attacker`, `winner`, `loser` and a missing role → `''`.
- [ ] **Unit:** the same template run twice by the subject and once on the subject yields two Story rows, facts
   `twice` and `done to them`; run twice on the subject yields one row, fact `done to them · twice`; a two-step
   chapter done to the subject (two event nodes sharing one `actionId`) yields one row whose fact is still
   `done to them` after the later step replaces the earlier one.
- [ ] **Unit:** a faction `target` row (undertaking outcome on a faction) reads `done to them`; no Story fact on
   any page contains an underscore or a raw role key.
- [ ] The existing `thr2223-story-repeats-and-what-happened`, `thr2145-story-rows-no-keys` and `subjectPages`
   tests pass unchanged, or are updated only where they asserted an empty fact on a target row.
- [ ] **Browser, 1920×1080, Playwright DOM**, `?view=game&seeded&size=medium`, ticks run through
   `window.__DEBUG.tick(n)` until some mortal has a `target` Story edge (find one with a graph read through the
   debug bridge): open that mortal's sheet, and the Story row for that event reads the chapter name followed by
   `done to them`. One 1920×1080 screenshot of the Story group.
- [ ] **Gates:** `npm run gate` (code track; the diff touches `src/engine/`, so the 30-tick CLI smoke and the
   `review-gate` skill apply), `npm run gate -- --final` last before push; line-anchored closer in commit and PR body.

## Out of scope

- Outcome words (won / lost / at a price) on Story rows — a separate legibility question; the aftermath already
  carries them.
- Naming the other party on the row ("done to them by Vara") — the record page lists who took part.
- The record page's "who took part" rows, which show each person's trade, not their role in the event.

## Coordination block

**Suggested model:** sonnet. One fact rule, one fold tweak and a word table, fully specified with line numbers.

**Parallel-safe with:** THR-2244 (Stay the Unmaking difficulty: `game-config.ts`, card words) — no shared files.

**Mutex with:** any ticket editing `src/engine/views/connections.ts` or `INSPECTOR_WORDS` in
`src/data/view-content.ts`. None is in Ready for Dev today; the executor greps open PRs for both paths before claiming.

**Files to touch:**
- Edit: `src/engine/views/connections.ts` (fact rule, three steps, fold key, fold fact)
- Edit: `src/data/view-content.ts` (`INSPECTOR_WORDS.storyRole`)
- New: `src/engine/__tests__/thr2191-story-role-words.test.ts`
- Edit, if it lists edge properties: `Docs/canon/interface-map.md` (the read site)

## Notes for the executor

- Line numbers are from `origin/main` `38acd7fb`.
- No Blast Radius section is owed: `connections.ts` is imported by 7 files and `view-content.ts` by 62 (grep of
  `src/`), both under the 100-importer bar. The view runs on read, never in a tick phase, and draws no random numbers.
- `src/engine/` is touched: run the `review-gate` skill before arming auto-merge, and the 30-tick CLI smoke.
- Keep the role word out of the Story sort; rows stay newest first.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present (no component change, with the rationale and browser check)
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise is contradicted. It extends `Vision/00-north-star.md` ("the mortal is a person whose
      interior life the player witnessed": the Story list stops claiming a done-to deed as theirs) and keeps
      `Vision/taste-profile.md` ("mechanics are communicated as sentences, never as numeric values": plain words).
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-17-thr-2191-story-rows-say-whose-deed-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every word in one data table; adding a role is a one-line data change. |
| 2. Inspectability | PASS | The word is the edge role, readable from the graph; no hidden logic. |
| 3. Determinism | PASS | Pure function of graph state; no random draws. |
| 4. Fail-soft | PASS | Unknown or missing role renders no word (fail-soft table). |
| 5. Narrative over mechanical perfection | PASS | The list tells the true story of who did what. |
| 6. Additive over destructive | PASS | New fact rule and words; existing rows unchanged except target rows gaining a word. |
| 7. Performance budget | PASS | One map lookup per Story row on view build. |

## Intent-judge verdict

Pass 1 (cold): **Revise**, 2 GAPs, 0 VIOLATIONs. Dimension 11: the `connections.ts` line anchors had been copied from
the ticket's 2026-11-07 text and were stale (faction and location swapped). Dimension 12: the class was mislabelled
(PC-6 is "one fact told two ways"), and PC-6's other surfaces and PC-5's de-duplication were not answered. The judge
also asked that the `push` instance-replace path be named. All fixed: anchors re-measured with `grep -n` on
`38acd7fb`, `:463` named with a unit Done-when, and PC-6 / PC-5 paragraphs added under Player-facing text.
Pass 2 (cold): **Allow**, every dimension PASS. The judge re-verified each anchor and the cross-surface claims against
source.

## Forked-audit verdicts

- **NFP:** PASS-with-notes. Inspectability: the role-aware fold is visible only through row output, not a trace
  (accepted: a view read, no decision). Additive: folded rows of a chapter split into own and done-to rows (intended,
  covered by the Done-when).
- **Three-pillar:** PASS-with-notes. The Engine pillar covers the template subsections in prose. Blast Radius
  omission now stated in Notes for the executor (7 and 62 importers). The verdict stubs are now filled.
- **Vision:** PASS-with-notes. Extends the north star's "mortal as a person"; respects the taste profile's
  plain-sentence rule. The Vision audit section now cites the Vision files it relies on.
