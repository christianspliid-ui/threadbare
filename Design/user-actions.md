# User Action Required

**Last updated:** 2026-08-12 15:58 local (2026-08-12 13:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Action cards print a risk that isn't real ([THR-998](https://linear.app/threadbare/issue/THR-998))

Cards read "a steady / uncertain / perilous working", but for **85% of castable cards the number behind the word cannot move the odds at all**.

- **(a)** make the word track the odds the cast will actually roll
- **(b)** stop printing a risk word where the odds are flat — print scale or cost instead
- **(c)** lower the floors so authored danger bites again (also changes how mortals resolve everything)

**Recommendation: (b)** — if the danger doesn't vary, a danger word is the wrong thing to print.

**Bundling option:** this is the same question as [THR-1002](https://linear.app/threadbare/issue/THR-1002) (unify the card grammar) and [THR-1082](https://linear.app/threadbare/issue/THR-1082) (consequence icon language) — *what does a card tell you?* Say the word and all three get ruled in one sitting instead of three.

### 2. How strict should the prose checker be about abstract words? ([THR-1092](https://linear.app/threadbare/issue/THR-1092))

The automated checker fails any encounter that leans on words like *devotion*, *surveillance*, *settlement* — the actual vocabulary of an encounter about the House of Devotion or a spying mission. It fails **128 of 683 encounters (1 in 5)**, including Build and Forge Alliance. Scoping it to narrative-only was measured and does not help (net 7 templates, 8 newly failing).

- **(a)** keep the number visible for sorting, stop treating it as an automatic fail — the four sharper checks (vague language, hedging, thin premises, wrong voice) stay hard gates. Corpus failures drop 209 → 81.
- **(b)** raise the threshold to some number — arbitrary without a corpus of known-bad prose
- **(c)** keep as-is and accept 128 permanently-red encounters

**Recommendation: (a).** Yours because it defines what "clean prose" means for everything written from here.

### 3. Two small sound decisions ([THR-962](https://linear.app/threadbare/issue/THR-962), [THR-961](https://linear.app/threadbare/issue/THR-961))

Routing the encounter sound cues to the new screen, and how those cues should feel. Both need your ears, not a screen. Both have bounced out of the dev queue twice because an executor cannot close a "Christian hears it" checkbox.

### 4. Parked option, no urgency: a Tenacious-style trait

Open option, explicitly not urgent. Safe default is "stays parked."

## Resolved this period

- 2026-08-12: **the two work lanes are back on** and shipping — the executor and orchestrator both fired this hour, and [PR #1404](https://github.com/christianspliid-ui/threadbare/pull/1404), [#1402](https://github.com/christianspliid-ui/threadbare/pull/1402) and [#1403](https://github.com/christianspliid-ui/threadbare/pull/1403) merged. No cause was recorded for the ~15 h stoppage; Friday's retro has it.
- 2026-08-12: **the play verdicts were already yours — the ask was stale, and that was our error.** You ruled all four on [THR-907](https://linear.app/threadbare/issue/THR-907) and "not yet" on [THR-974](https://linear.app/threadbare/issue/THR-974) on 2026-08-10; both tickets stayed open with the rulings recorded only in comments, so the lanes kept re-asking. Nothing is owed by you on either. This also closes the "does the aftermath appear on its own" question — you saw it fire live that day.
- 2026-08-11: [THR-1071](https://linear.app/threadbare/issue/THR-1071) shipped — mercy no longer makes people crueller. **Your tail question was decided without you, legitimately: stone was exempted from the flip** and given the opposite remedy rather than its value pair renamed. Say the word if you'd rather it had been renamed.
- 2026-08-11: **the cleanup shelf pruned 36 → 21** — ~16 sub-bar process tickets canceled and folded into [THR-1089](https://linear.app/threadbare/issue/THR-1089) and [THR-1090](https://linear.app/threadbare/issue/THR-1090). Your 2026-08-10 materiality bar applied retroactively.
- 2026-08-11: [THR-1086](https://linear.app/threadbare/issue/THR-1086) shipped — the Apotheosis converted off authored choices. **Every encounter in the game now runs the locked format**; the WS5 conversion program is complete.
- 2026-08-11: [THR-866](https://linear.app/threadbare/issue/THR-866) closed — the design look at the apex Ascension encounter, which produced THR-1086 above.
- 2026-08-10: [THR-1083](https://linear.app/threadbare/issue/THR-1083) shipped — the last screen an encounter shows you was outside every prose check; it is now inside one.
- 2026-08-10: "drop and re-author" ruling applied to the whole paused content shelf (THR-848/855/856/858/859/861/863/864).
- 2026-08-09: the encounter-writing format locked ([THR-883](https://linear.app/threadbare/issue/THR-883)).

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
