# THR-1153 — the chip's referent is now reachable, and the corpus sweep has its own ticket

**Shipped 2026-08-17**, second and closing pass. The first pass
(`2026-08-17-thr-1153.md`) folded the Unsafe Bridge's `PATH · THE RIVER CROSSING` chip,
the defect the director reported. This pass ships the ticket's **adapter route** and
splits the corpus sweep and the gate out to THR-1164.

## What was still wrong

Law 56's second clause makes a chip's `stateNoun` its **referent** — the word naming the
graph object the ending changed. THR-1122 gave that word Law 17's hover tier and stopped
there. So a chip could declare `entityId` on its `stateNoun` and the noun still rendered
as text that went nowhere, while *the same object, decorated inside the sentence one line
below, clicked through*. The chip's most concentrated referent was its least reachable
one — and twelve chips in the shipped corpus are in exactly that state, five of them on
the Bridge ending the director was looking at when he filed this.

That is the second half of his complaint, the half the fold did not answer: *"if it
connects to anything that can not be seen by the player at all, which is a no no."*

## The fix, and why it is four lines rather than a mechanism

`stateNoun.entityId` and `stateNoun.visualKind` now travel to the surface as
`nounEntityId` / `nounEntityKind`, and the noun is drawn by **`NarrativeSegments`** — the
component that already owns the three-tier rule (click where a page exists, hover where
the registry can explain, plain otherwise).

Rendering it there rather than adding a click branch to the tag is the whole design
decision. This block was one of the two inline copies of that rule which THR-1105
collapsed into one component; hand-rolling a click tier back into it is precisely how
that drift restarts (Law 27). Routing through `NarrativeSegments` also means every tier
stays *earned* rather than assumed: the link is drawn only when `openEntity` can route
the kind, so a `companion` — a person who is not an agent node — stays text instead of
opening the wrong sheet (Law 21), and the underline appears only when the tooltip
registry can actually answer.

One presentational detail worth recording, because it is the kind of thing that silently
dims a surface: `NarrativeSegments` sets no colour on a plain segment, so the wrapper now
carries `TEXT_WARM` and the `·` separator alone carries `TEXT_WHISPER`. A plain noun
inherits warm and looks exactly as it always did.

## Falsified in both layers, separately

The two layers are testable apart, and the falsification proves they are:

- Stripping the adapter's two-line passthrough reds the adapter assertion and **nothing
  else** — the veil tests build their chip model by hand, so they cannot mask an adapter
  regression.
- Stripping the veil's `entityId`/`entityKind` on the segment reds the veil assertion and
  nothing else: `Unable to find an accessible element with the role "button" and name
  "WOUNDED"`.

The third new test is the one that matters most, and it is an absence: a noun declaring
**no** anchor must draw no control. Without it, an unconditionally-clickable noun would
pass the other two — and would put a live-looking link on the 29 chips whose referent is
still scene fiction, which is THR-1141's failure (dressing an unanchored claim in a
pointer) one layer up.

## The split, and the measurement behind it

The remaining scope — the corpus sort and the anchor-resolution gate — is now
**THR-1164**, `Ready for Dev` with its coordination block. The split is a real seam, not
a convenience: gate and sweep are inseparable from each other (Law 56 is no-exemptions,
so a gate arriving alone reds every unswept chip) and both are separable from the adapter
route, which changes no content and reds nothing.

The worklist is measured against a stated predicate rather than remembered. A chip
qualifies when it **declares a named referent carrying no anchor** — an unanchored
`stateNoun`, or no `stateNoun` and a non-empty `concepts[]` with nothing anchored in it.
That is **48 chips across 17 templates**: 29 in `vertical-slice.ts`, 19 in
`holy-order-dawn-encounter-content.ts`.

Two corrections to the earlier count are worth carrying forward. The predicate must be
scoped to chips that *declare* a referent — run unscoped it returns **491**, because it
sweeps in the 437 older-shape chips that declare nothing at all, make no claim the clause
can be about, and are already held by Law 2's `concepts` rule and the composition
ratchet. And 19 of the 48 are `hod.*`, which `check:encounter --all` **cannot see**: that
runner is scoped to the `encounter.` prefix, 191 of 683 templates. A clause-2 rule living
only in the composition contract would report green over 40% of its own worklist. That
trap is written into THR-1164's body as the reason it says *corpus* and not *encounters*.

The 19 also name one thing — *"The Dawn"* — with `visualKind: 'faction'` and no
`entityId`, because faction **nodes** are per-world and chapters share a def id, so no
static id exists to write. They need a declaration form that resolves at render, and the
adapter layer this pass touched is where it goes: `buildUnifiedEncounterStageModel`
already holds the graph and already resolves cast bindings to node ids for the narrative
linker. Shipping that resolver without the 19 chips consuming it would have been a
mechanism with no caller, so it went to THR-1164 with them.

## Verification

`npm test` 1034 files / 16,611 tests green, exit 0 (redirected, never piped — a piped
gate run reports `tail`'s exit code). Typecheck ratchet 3178, unchanged. `npx vite build`
clean in 15.04s.

**Browser-verify substitution: jsdom-render — unattended run, no startable dev server.**
`preview_start` is refused outright in scheduled runs (*"Dev servers can't be started from
unattended sessions"*, impediments #546/#574), which also shuts the Playwright route,
since that presumes a running server. The substitution is render assertions on the real
`EncounterVeil` for **every face this change produces**: anchored + host can route (a real
`<button>`, and the click hands `openEntity` the declared id *and* kind), anchored + host
cannot route (no control, text intact), no anchor declared (no control, hover tier
intact), tooltip resolves (focus stop present), tooltip unresolvable (plain, and never the
raw id). The route was decided before the capture rather than at it — the failure mode
#546 and #574 both recorded.
