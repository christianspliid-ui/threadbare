# THR-400 — Vision audit, back to In Design

**Issue:** [THR-400 — Faction action expansion — add 6–8 governance verbs](https://linear.app/threadbare/issue/THR-400/faction-action-expansion-add-6-8-governance-verbs)
**Auditor:** Cowork, 2026-05-11
**Verdict:** back to In Design — Vision drift, not just structural gaps
**Origin:** descoped from a broader ascended-action organization effort (THR-390 audit §2.3 + §3); the original intent was *organize what already exists*, not *commission new substrate*

---

## Summary

The draft proposes eight new faction-targeting verbs across four shapes (fracture / redirect / expose / elevate). The four-shape framing is good. The family-resemblance pairings (Stir Dissent ↔ Incite Unrest, Whisper Leader ↔ Persuade, Anoint Successor ↔ Anoint Champion) are good. The conditional-reveal discipline ("only fires if corruption actually exists") is good.

But the draft drifted on Vision in four places, and the structural gaps from the prior pass remain. Specifically: one proposed verb violates non-negotiable #1; the catalog surface itself may be retiring under a 2026-05-04 direction the draft does not acknowledge; the mortal-loop bridge (the North Star) is unspecified per verb; and three of the eight verbs casually invoke entire new substrate systems as if they were implementation steps.

The result is a "feature creep" pattern: started as catalog *organization*, drifted into substrate *commissioning*. Send back. Renarrow.

---

## Vision drifts to reconcile

### 1. `action.faction.sanction_mission` violates non-negotiable #1

> *"Force the faction to commit to a specific mission/quest the player names (raid this enemy, settle this hex, recover this artifact)."*

`Vision/02-non-negotiables.md` §1 (Player is a god, not a protagonist): *"A god who can move a mortal like a chess piece has no moral weight when they do… influence but not command."* The Vision rejects choose-your-own-adventure framing at mortal scale; the same logic applies at institutional scale. **The god does not name the mission.** Reframe options:

- **"Kindle a Calling"** — surface a mission shape *from the faction's own internal pressures*. The faction has latent goals; essence biases which one rises. The player amplifies what was already there; they do not author it.
- **Drop entirely** if no reframe lands. Eight verbs was a ceiling, not a floor.

### 2. Catalog surface may be retiring — 2026-05-04 direction not acknowledged

`Vision/taste-profile.md` strong opinion (updated 2026-05-07): *"Encounter-specific intervention verbs. Verbs are encounter-specific, anchored in the cosmological pattern of reach + sphere + moral axis. The hypothesis that there are three fixed verbs (nudge / whisper / vision) was retired 2026-05-04 — encounter authors write per-scene god-verbs underpinned by the 8 reaches."* Reference: `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §10.4.

THR-400 doubles down on global `UnifiedActionTemplate` entries (`targetCategories: ['faction']`) without addressing the per-scene direction. **This is the first question the next design pass must settle**, because the answer determines whether the design surface itself is valid:

- If the 2026-05-04 direction means *all* god-verbs become encounter-specific, faction interventions should be authored *inside* faction-scoped encounter templates, not as global templates. THR-400 is then the wrong shape.
- If global templates remain valid for faction-scale interventions (plausible: faction scale may be too coarse for per-scene authoring), the plan must say so with explicit rationale and a line where global stops and per-scene starts.

### 3. Mortal-loop bridge missing — North Star drift

`Vision/00-north-star.md`: the moment we are building toward is one mortal the player came to care about, in a crisis. `Vision/03-design-tensions.md` §3 (divine remove vs. player attachment, drift signal): *"We are drifting toward pure remove when the player has no mortals they could name."*

Faction verbs are the highest-remove category in the catalog. Without an explicit mortal-loop hook per verb — "when this fires, the encounter pipeline scans for affected mortals in the portfolio and lifts the most-bonded one toward a curated encounter" — these are eight new ways for the player to spend essence on entities they cannot grieve. The plan needs a per-verb section: *"How this produces an encounter on a mortal in the portfolio."*

- Schism is interesting because *Serafina* sits in the wrong half.
- Stir Dissent is interesting because *Kael*, the leader the player has been building, is being undermined.
- Recover Doctrine is interesting because a mortal the player anointed last run is now bound by a teaching that contradicts who they have become.

Without this, the audit's framing ("faction is under-served as a target type") justifies new verbs against the wrong frame. Factions are not the target. *Mortals via factions* are the target.

### 4. Prose-surface (IPK) undefined — non-negotiable #3 risk

`Vision/02-non-negotiables.md` §3: *"All mechanics surface through prose, never numbers."* `Vision/taste-profile.md` strong opinion (Prose-first UI): *"attachment tooltips never show `+3 resolve`; they say 'her resolve holds through the third watch without fraying.'"*

The plan describes engine mutations (`dissentScore +X`, `corruptionRevealed: true`). It does not describe what the player reads when they look at a faction after a verb fires. Each verb needs at least one IPK or prose-band entry surfacing the post-state. Without this layer, faction state is invisible to the player — which means the player cannot learn what their verb did, which means they cannot form judgment for the next intervention.

---

## Tension #4 — conditional UX is a Vision-level decision, not a UX afterthought

Reveal Corruption / Unmask Heretic only fire if hidden state exists. `Vision/03-design-tensions.md` §4 (legibility vs. mystery) lists this exact failure mode under drift signals: *"We are drifting toward too much legibility when players start talking about 'optimal strategy'."*

The plan must spec a prerequisite: corruption is *suspected* via an eye-domain capability check, *suspicion* surfaces the verb in the drawer, *invocation* tests whether the suspicion was correct. Greyed-out actions leak the existence of hidden state and break mystery. Hidden-until-suspected is the right shape; the design owes the suspicion mechanic.

---

## Structural gaps (unchanged from prior pass)

These are blockers independent of the Vision drifts:

1. **Schism's faction-split is a subsystem, not a step.** Splitting a faction requires: mint new faction node, allocate name + doctrine + leader, transfer members via edge rewrite, partition territory. Today's faction creation path is unverified. If it doesn't exist, Schism is its own epic.
2. **Reveal Corruption / Unmask Heretic / Anoint Successor assume hidden-state schema** (corruption fields, heretic flags, succession edges) that may not exist on faction nodes. Codesight pre-flight not done.
3. **No three-pillar structure** (Engine / Content / UI sections); no constants / traces / fail-soft tables; no Brainstorm companion. All required by Design Governance.
4. **Cross-issue tension with THR-396 (reach-domain reassignment) and THR-397 (rarity recurve)** unaddressed; many proposed domain/rarity tags will need re-tagging if those land first.
5. **Eight verbs in one PR at the end of a four-PR mutex chain** is high rebase risk; the audit said 6–8 as a ceiling, not a target.

---

## Recommended reframe

Drop to **four verbs that ride existing substrate and clearly honor non-negotiables**:

| Verb | Shape | Substrate it rides |
| --- | --- | --- |
| Stir Dissent | fracture | dissent score on faction (verify exists) |
| Whisper to Leader | redirect | leader edge + persuasion model already used elsewhere |
| Recover Doctrine | elevate | ruin discovery + faction property update |
| Unmask Heretic (renamed: "Surface a Doubter") | expose | conditional on member-faction-conflict state (verify exists) |

Defer to per-verb design tickets, each scoped to include the substrate work *and* the mortal-loop bridge:

- Schism (faction-split subsystem)
- Reveal Corruption (hidden-state model + suspicion mechanic)
- Anoint Successor (succession subsystem)
- Sanction Mission, reframed as Kindle a Calling (faction-internal-pressure model)

Every remaining verb must spec: (a) the substrate it rides (verified via Codesight), (b) the IPK / prose-band the player reads after it fires, (c) the encounter the orchestrator generates on a portfolio mortal as the verb's narrative payload.

---

## Next design pass — checklist for the next agent

1. **Run Codesight pre-flight first.** Map each of the four reframed verbs to the substrate it touches. Confirm presence; if absent, escalate as its own ticket.
2. **Settle the 2026-05-04 direction.** Read `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §10.4. Either confirm global templates are still valid at faction scale (with rationale) or pivot to per-scene authoring inside faction-scoped encounters.
3. **For each verb, write the mortal-loop bridge paragraph.** What encounter does this generate, on whose mortal, sourced from which existing thread?
4. **Reframe Sanction Mission** to Kindle a Calling (or drop).
5. **Spec the suspicion mechanic** before designing Reveal Corruption / Surface a Doubter.
6. **Restructure to three pillars** (Engine / Content / UI / Wiring) with constants / traces / fail-soft tables inline.
7. **Draft the Brainstorm companion** alongside the plan, in the same pass.

Once those are in, plan returns to Ready for Dev with a much sharper scope.

---

*Filed by Cowork, 2026-05-11. The original draft is preserved in the Linear issue body; this audit is the contract for the next design pass.*
