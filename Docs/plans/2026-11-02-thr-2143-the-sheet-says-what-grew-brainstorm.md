# Brainstorm companion: The pool says how full it can get, and the sheet says what grew (THR-2143)

Plan: [`2026-11-02-thr-2143-the-sheet-says-what-grew.md`](2026-11-02-thr-2143-the-sheet-says-what-grew.md). Design lane, run 2026-11-02e.

## Alternatives weighed

| Question | Taken | Not taken, and why |
|---|---|---|
| How the limit reads | Bar ends at the cap; the hover says in words how it grows | **Hover numeral ("Holds up to 55"):** the first draft's choice, read as inside Law 13's pool-balance exception. The Vision audit returned REVISE: non-negotiable #3 and the taste profile forbid numbers with no recorded exception. Reserved for Christian. **Numeral on the row (`53/55`):** doubles the row's width at 1920, with the same Vision question. |
| Upkeep | When and why, in words; payers counted | **Per-day amount** (the ticket's proposal): blocked by the 2026-09-10 per-tick-rates ruling (THR-1426). **`SUSTAIN_FLOW_BANDS` word:** measured upkeep is 0.1–0.5 per thread per tick, below the ladder's `slight` floor (≥1), so every row would read "negligible", which is false at a day's scale. **Change the economy so upkeep is paid before the clamp:** a rule change, out of scope. |
| How long a gain marks its tile | A three-day window from the chapter's resolve tick | **Until the player has looked:** needs per-viewer stored state (localStorage), differs between reloads and viewers, and still leaves the unchanged word unexplained. **Forever (a growth history):** that is the Journey tab's job, not the tile's. |
| One word per pole | The axis registry's (Fair / Scheming) | **The Nature table's (Honest / Cunning):** it would have to rewrite the fate line, the personality row and the card lean tags, all of which read the registry, and THR-524 approved the registry vocabulary. |
| Where a lean shows | A Nature chip | **Lower the personality row's gate from `intimate` to `known`:** this opens eight axis meters on the sheet at once, against the census's "too much to take in". **A mark on the personality row:** still invisible at `known`. |
| Fate-line verb | "leans … now" | **Keep "came out" and show a full drift:** the shift is ±0.30 on a −1…1 axis, a lean by size. |
| Fated | Hover sentence in Christian's words | **Colour:** reserved to him (THR-1980 § Needs Christian). |

## Tensions

- **Legibility vs. numbers (Vision tension: mechanics through prose).** No numeral is added. The testers' wish for a checkable number is the open fork reserved for Christian.
- **The time window vs. "until seen".** The window can expire before a returning player opens the sheet. That is accepted: the Aftermath and the Chronicle still record the gain, and the window keeps the screen deterministic.
- **Vocabulary churn.** Nature's words change for every pair. That finishes an approved migration (THR-525), but a returning tester will see new words. The UL already names the axis registry as canonical (`Docs/ubiquitous-language/Agents.md` § value pairs).

## Vision premises leaned on

- North star: the player must be able to weigh what a nudge costs. The cap and the upkeep are the price list.
- Non-negotiable #3: mechanics through prose; the numeral is a balance, not a mechanic's internals.
- PC-6 (the screen must not contradict itself): the Aftermath, the fate line and the sheet must agree.
