# THR-875 — Meeting Batch A: the shadow and veil reaches convert

**Shipped 2026-08-09.** Ten more dilemma templates gained a `test` field, taking
the converted population from 10 to **20** and completing the **shadow** and
**veil** slot-1 sets. Four of the eight reaches now draw a formative test from
slot 1 on every meeting; four still fall through to the legacy choice scene.

## What converted

`AX-SHADOW-01` … `AX-SHADOW-05` (`honesty_cunning`) and `AX-VEIL-01` …
`AX-VEIL-05` (`tradition_novelty`), authored against `AX-IRON-01` as the worked
reference and against the contract enforced by
`src/components/MeetTheFirst/__tests__/meetingNudgeStage.test.ts`. Each carries
a 7-card hand: two free sphere-less commons leaning opposite poles, five sphered
across `mind`/`life`/`spirit`/`time`/`matter`, one `floor_at_cost` rider, and
all five `bandProse` slots. Difficulties spread 0.35–0.6 rather than parked on
the 0.5 default, so shadow and veil do not forecast identically to each other or
to the two reaches already shipped.

Three setups carried a framing that quietly made `{agent.name}` a child or a
youth, which the present-tense re-situation rule does not allow, and were re-cut
to the adult reading:

- `AX-SHADOW-01` — the thief was "an older youth, well-liked and connected" and
  `{agent.name}` was "neither"; he is now a man holding a seat on the water
  council, and the witness is an adult with no standing rather than a child.
- `AX-SHADOW-05` — the onlookers were "three adults", which made `{agent.name}`
  the child watching them; they are now "three others".
- `AX-VEIL-01` — the scholar recruited `{agent.name}` as "young enough to not be
  afraid of being right"; she now recruits the one person in the assembly with
  a voice and no office to lose.

No scenario needed killing — all ten re-situated honestly.

## The pole convention, and the two inversions

Pole `a` is the first-named pole of the `ValuePair` and carries the negative
`axiologicalShifts` sign, matching `AxiologicalProfile`. So `a` = honesty and
`b` = cunning; `a` = tradition and `b` = novelty.

**The choice-id letter is not the pole letter**, and this reach is where that
bites. Two shadow templates invert, and both carry a comment at the site saying
so, because an author skimming the ids would get them backwards:

- `AX-SHADOW-02` — `ax-shadow-02-a` is the **forgery** (`+0.25`, cunning) and
  `-b` is the plain warning (`-0.3`, honesty).
- `AX-SHADOW-04` — `ax-shadow-04-a` **keeps** the dying woman's secret (`+0.2`)
  and `-b` tells it (`-0.3`).

The same rate as the previous batch, which found two inversions in nine. Read
the shift, never the letter.

## What `polarity` on a factor line actually means

Worth recording, because the two shipped batches read as if they disagree.
`factorLines[].polarity` is **not** pole-aligned. `resolveMeetingBand` rolls a
band from `difficulty` plus the played cards' `forecastDelta` (all positive) and
knows nothing about poles; the pole comes separately from `computeNetPoleLean`,
and a negative-magnitude band flips it. So `for`/`against` is pressure on the
moment resolving **cleanly**, and only `poleLean` steers which pole gets written.
Both prior batches are consistent under that reading.

## Evidence

Per-reach slot-1 conversion, swept headlessly over `REACH_VALUE_PAIR`:

| reach | pair | slot-1 | converted |
|---|---|---|---|
| iron | `mercy_ruthlessness` | 5 | 5 |
| gold | `asceticism_extravagance` | 5 | 5 |
| shadow | `honesty_cunning` | 5 | **5** |
| veil | `tradition_novelty` | 5 | **5** |
| heart | `loyalty_ambition` | 5 | 0 |
| eye | `revelation_discretion` | 5 | 0 |
| stone | `preservation_transformation` | 5 | 0 |
| star | `sacrifice_survival` | 5 | 0 |

```
npm test                      -> 976 files / 15,426 tests passed
npm run check:typecheck       -> OK — 3462 error(s), unchanged from baseline
npx vite build                -> built in 12.17s
check:generated-freshness     -> OK — 33 artifacts match HEAD    (run last)
check:wiki-freshness:blocking -> OK — 24 pages, no stale         (run last)
```

The contract suite is non-vacuous by construction — it iterates whatever carries
a `test`, so growing the population is what gives the assertions something to
bite on, and it needed no edit for this batch.

No engine smoke: the diff is one file under `src/data/`, touching no tick-loop,
orchestrator, phase or agent-decision path. No browser evidence: the diff touches
no UI-pillar path (`FormativeTestBeat` and the stage model are unchanged), so
both pillars are N/A per the ticket.

## What remains on THR-875

**20 slot-1 templates** across heart, eye, stone and star — 5 per reach, the same
work at the same rate now that the shape is established four times over.

**Slot 2 (24 templates) stays blocked** on [THR-1062](https://linear.app/threadbare/issue/THR-1062):
all 40 `reach_specific` templates leave `targetValuePair` undefined while the
contract asserts `test.valuePair === template.targetValuePair` against a required
field. That is a content decision about what a reach trial *is*, not a
conversion, and it is not this ticket's to guess.
