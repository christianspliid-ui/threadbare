# Encounter Experience — Player Journey Analysis (2026-05-04)

**Status:** Game-designer walkthrough of the v3 wireframe before committing to long-form design. Companion to `2026-05-04-encounter-experience-v3.html` and `2026-05-04-encounter-experience-grill-me.md`.

This doc does two things:

1. Clarifies what the **Ascendant Action cards** on the right rail actually do — grounded in the existing toolbox, not invented.
2. Walks the **player journey** through the encounter beat-by-beat, naming what the player does, feels, thinks, and chooses, plus where the design hooks them and where it might fail.

The point is to pressure-test the v3 shape from the inside before we lock it in.

---

## 1. The Ascendant Action cards, made specific

In v3 I sketched three cards (*Mark this moment*, *Send a sign*, *Weave a thread to the trader*) as placeholders. Of those, only *Send a sign* maps cleanly to a real action that exists today. That's not enough. The cards on the right rail must hook into our **existing Ascendant toolbox** — the actions defined in `src/data/unified-action-templates.ts` and surfaced today in the **ActionDrawer** — filtered by what is contextually relevant *to this scene*.

### What the right rail actually is

The "Your Hand" panel is a **scene-relevance filter** over the full Ascendant toolbox. Same actions as the ActionDrawer — same costs, same essence model, same prerequisites — but presented in encounter-context with prose adjusted to the scene. Three states per card:

- **Playable here** — bright, full prose, can be clicked. Actions whose target type matches something in the scene (an actor, a place, a bond) AND whose cost the player can pay.
- **Visible but not playable** — dimmed, cost shown. Useful for teaching ("you'd need more essence" or "you'd need to thread the trader first").
- **Hidden** — actions with no scene relevance (e.g., faction edicts when no conclave is active; perception scrying that's redundant when you're already at the scene).

The "+ four more from your deck" affordance is the rest of the playable hand collapsed; clicking opens a fuller view. Same data, lighter presentation.

### What that looks like for Eira at the Gate

Given the cast (Veiren, the trader, Halren) and the place (South Gate), here's what I'd expect the right rail to show, drawing from the actual toolbox:

| Card on the rail | Real action it maps to | What it does in this scene | Cost |
|---|---|---|---|
| **Send a sign** | `divine.omen` | A black bird, a lantern guttering. Tilts every cast disposition softly toward unease. | 2 essence (Tier 1) |
| **Veil the trader's cargo** | `divine.deceive` | Veiren will not see what's under the cloak. Buys the trader one beat of cover; if Eira already noticed, it doesn't help her. | 2 essence (Tier 2) |
| **Whisper the captain** | `divine.persuade` | Mind compulsion. Veiren leans toward her over the trader by half a step. Iron-rooted, hard to move; opposes Mind sphere → costlier than the base. | 2 essence × sphere multiplier |
| **Embolden the trader** | `action.social.embolden` | Divine courage to resist pressure. He decides to stand his ground rather than bolt. The scene goes loud. | 12 essence |
| **Tip the scales toward Eira** | `action.social.tip_scales` | A whisper during the negotiation. Whatever she says, Veiren weights it favourably. | 12 essence |
| **Mark her with fate** | `divine.coincidence` | Tier 3, Devoted bond required. This scene becomes a load-bearing thread of fate in Eira's biography. Future encounters reach back to it. | 4 essence (high-tier) |

A **dimmed card** might be *Wrath descending* (`divine.intimidate`) — playable in principle, but the player doesn't have enough essence right now, so the card shows the cost and the prereq, teaching the player what they'd need next time.

A **hidden card** would be `divine.perceive.cast_attention` — useless mid-scene; you're already here.

### Why this matters for the design

Three implications:

- **No new vocabulary needed.** The right rail re-uses the established Ascendant toolbox; encounter content authors don't have to learn a parallel system.
- **The encounter UI becomes the natural home for actor-targeting and social actions.** Today these live in the same drawer regardless of context. In v3 they finally have a *room* — the room the agent is in.
- **The three contextual leans on the bottom of the card and the Ascendant cards on the right are different things.** The leans are *encounter-defined* (this beat offers these three; the encounter author wrote them). The Ascendant cards are *player-deck* (this is your hand of god-actions; what fits this scene is shown here). They compose: in one beat you might play a small lean (Stir her resolve) AND an Ascendant card (Send a sign) — at the cost of more essence.

> **Open question for the long-form plan:** what's the cost ceiling per beat? If a player can stack a contextual lean + multiple Ascendant cards, the resource economy could break. My current lean: one lean primitive + one Ascendant card per beat, max. The "+ four more" disclosure is browseable but the active hand is small.

---

## 2. The player journey, beat by beat

This is one playthrough, told from the inside. I'm pessimistic by default — I name where the design might fail.

### Beat 0 — Pre-encounter (world view, between turns)

**Where the player is.** They've just spent ten minutes nudging Maro toward a town. Time is paused (turn-based pivot). They're considering ending the turn. The retinue panel runs along the right side of the world view; their four threaded agents are listed.

**What happens.** Eira's portrait pulses. A thin gold thread on her tile flares. A small notification card slides in: *"Eira nears the gate. The captain has not seen her yet."*

**What they do.** Their eyes move. Cursor drifts.

**What they feel.** A small spark of *who's that, what's happening to her*. Not urgency — curiosity. The player chose Eira when they bonded her; some part of them is invested.

**What they think.** "Do I want to look in on this?"

**What they choose.** Click in, or end the turn and let it resolve. The game's hint is: *no act is also a story.* So either is real.

**Risk.** If the notification card is shouty (popup, sound effect, "BLOCK INPUT"), it breaks the principle. v3 keeps it small. It needs to stay small. The user already flagged in v2 that the notification card is "on probation" — this beat is exactly where its disposition matters most.

---

### Beat 1 — Entry (the encounter takes over)

**Where the player is.** They clicked. The world view dims. The encounter screen swims into view from below, like a card sliding face-up. Ambient sound shifts: the world view's distant lute fades, the queue's murmur and a lantern's hiss come up.

**What happens.** The painting of the South Gate resolves at the top of the active card. The header reads BEAT 2 · NOW. The cast appears down the left; the Ascendant hand appears on the right; the lean primitives are not yet visible — they're below the fold of attention.

**What they do.** Look. Take it in. Maybe lean back in their chair.

**What they feel.** *Recognition.* Eira has stood at this gate before — they remember her getting through last winter. Halren's face is familiar from a previous council scene. The painting carries weight because it's *a place* — they have stood here.

**What they think.** "Where am I? Who's here? What's about to happen?"

**Affordances they use.** Their eye does the work. The TTS button is right there next to the prose; some players reach for it. Most don't, the first time.

**Hook.** This is the moment where the design either *lands them in a story* or *opens a menu*. The painting + the cast + the prose is what makes it the former. If any of those three were missing, this beat would feel administrative.

---

### Beat 2 — Reading the scene

**What they do.** Read top-down: title (*The Captain Stops*) → painting → prose → cast portraits down the left. The eye then drops to the lean primitives at the bottom of the active card.

**What they feel.** The prose hits short and concrete: *Veiren plants his bootheel in front of Eira and stops.* Not lyric — present-tense. "You. Step forward." gives them a voice in the room. Halren coughs from three places back — the player smiles. There's a story here.

**What they think.** "OK. Veiren is testing her. The trader is hiding something. Halren is watching." They're starting to *read the room*.

**Affordances they use.** Hover. The dotted-underlined terms invite curiosity. They mouse over *running* — a tooltip appears: *the trader is calculating ten paces to the alley, three guards along the wall. He won't make it — but in this moment he is sure he will try.* They mouse over *three places back* — *Halren is signalling Eira: "I am here. I am watching."* They get it. The cough was deliberate.

**Hook.** The tooltips reward curiosity *without burying the prose*. A player who skims and just reads the headlines still gets the story; a player who hovers gets the world. Two depths, both honored. This is exactly the layering Threadbearer needs.

**Risk.** If a player doesn't *notice* the dotted-underlines, the world depth never opens. The treatment needs to be subtle but discoverable. v3's dotted-coloured-text is a candidate; we should playtest it. If it's too subtle, we add a tiny "i" affordance (but only on cards that have tooltipped terms, to avoid clutter).

**Risk.** Information overload. The player has: 1 painting + 1 prose paragraph + 1 dialogue line + 3 cast cards + 2 carried-item cards + 3 lean cards + 4 Ascendant cards (3 visible + "+ 4 more") + the divine court rail + watch-only + the bottom step. **Eleven sources of information** at minimum. Some players will *love* this density (Crusader Kings 3 audience). Others will freeze. We need at least one playtest where someone unfamiliar opens the screen cold and tells us what they noticed first.

---

### Beat 3 — Weighing the leans

**What they do.** They read each lean card. Each follows the same shape: SPHERE · cost → god-verb → what arises in her → consequence. They compare.

**What they feel.** A small lean toward one of them. Not yet a decision. *Stir her resolve* — the player imagines confrontation, dust, Veiren's iron eye. *Sharpen her sight* — they imagine Eira spotting the trader's contraband and the moment forking. *Soften her stance* — they imagine her stepping aside, the trader bolting, Halren's voice from three places back.

**What they think.** "Which story do I want?" Not "which is optimal." The user's verdict — *influence direction, not outcome* — is delivered here or it isn't.

**Affordances they use.** Hovering tooltips inside the lean cards: *Veiren's eye* → reveals the test. *the small folk's silence* → reveals the vow. The carried-items in the left rail are a quiet backstop ("Captain's token" — small favor).

**The Ascendant cards enter.** The player glances right. *Send a sign* would tilt everyone's mood — interesting if they're unsure. *Embolden the trader* — an entirely different scene; the trader picks his fight. *Mark her with fate* — this scene becomes load-bearing in her biography. Higher cost, higher weight.

**Cognitive load.** Three lean cards × three Ascendant cards × watch-only = *~7 viable choices*. The game doesn't recommend; it shows you the room and trusts you. For some players, this is the dream. For others, it's anxiety.

**Mitigation already in design.** The watch-only panel is right there. *No act is also a story.* If a player feels paralysed, the design forgives them: stop reading, hit watch, see what happens. That's a real escape hatch — not a punishment.

**Risk.** If watch-only feels like the cowardly choice (e.g., bad outcomes follow disproportionately), the opt-out principle collapses. We need to ensure un-leaned encounters generate stories that read just as well.

---

### Beat 4 — The choice

**What they do.** They click. Say: *Sharpen her sight.* Their essence orbs dim — one full one, one half. The card highlights briefly. A small "you have committed" tone plays. The lean choice locks.

**What they feel.** Weight. They spent something. They're invested. (If essence were free, this beat would feel weightless. The cost is what makes the choice matter.)

**What they think.** "Now I want to see what happens."

**Affordance.** A 'change my mind' window? My take: **no**. Not in turn-based. The choice was real. Leaving an undo would dilute the held-breath of the next beat. This is a place where the design must commit — even if some players will misclick once and complain.

---

### Beat 5 — The dice / threads moment

**What happens.** Audio: a low thrum. Visual: the threads in the painting briefly pulse — the gold thread crossing the sky tightens. A short charged moment. Three to five seconds.

The resolution renders qualitatively, on the card itself, replacing the prose: *The threads draw taut. They hold. Eira's gaze finds the satchel.* No numbers. No "rolled 47 vs 60." Just words and the weight of luck.

**What they feel.** Held breath. Then: relief, or wince. Both are good outcomes for the design — both mean the moment had stakes.

**What they think.** "What did I just see?"

**Risk.** If this is too short, no tension; too long, players get impatient on second playthrough. My instinct: 3–4 seconds plus a 'continue' click that lets the player linger if they want. Citizen Sleeper does this well — the dice fall and you have a moment to look at them before pressing on.

---

### Beat 6 — The outcome

**What they do.** Read the result.

*Eira's gaze flicks past Veiren. There — under the cloak — a satchel of contraband salt. Two days of it. Halren coughs again, sharper this time. Veiren's eye is still on her. He has not yet noticed where she's looking. There is a beat. She has to decide what to do with what she now sees.*

A small change indicator appears at the bottom right of the card: *Eira now knows the trader's secret.* This is the first **change crystallised** — a bit of intelligence that becomes a graph artifact.

**What they feel.** *Oh.* A new piece of plot. The story has forked. The player knows something the game didn't tell them upfront — *what does she do with this?*

**What they think.** "I gave her the gift of sight. Now Beat 3 is going to be about what she does with it."

**Hook.** This is the dopamine moment for the right kind of player — the *ah, the world is changing* feeling. The change is small (an intelligence artifact) but it has narrative weight because it sets up the next beat.

**Risk.** If the outcome doesn't feel *connected* to the lean — if the player doesn't perceive their lean caused this — the agency collapses. The prose has to make the connection legible. *"Her gaze flicks"* is the verb of *Sharpen her sight*. Good. But content authors need to honor this. Without strong authoring, the outcome reads disconnected.

---

### Beat 7 — The next card turns

**What happens.** Beat 3 is now active. The card structure repeats: place painting (still the gate, but later — Halren is closer now, the trader is sweating), new prose, new lean primitives, new Ascendant filter.

**What the player feels.** Continuity. The story turned a page but the page is in the same book. The cast is still here; the place is still here; only the situation has changed.

**What they think.** "I'm in a story." That's the goal feeling.

**What they choose.** Same shape as Beat 4. Stir / Sharpen / Soften adjusted for this beat. Maybe a different Ascendant card now glows because the situation changed (e.g., *Tip the scales* is more potent now that Eira knows about the contraband).

**Hook.** This is the moment where multi-step encounters earn their existence. A one-beat encounter would have stopped at Beat 6. The journey through 4 beats is what gives the story shape.

---

### Beat 8 — Aftermath (last beat, change crystallises)

**What happens.** The encounter resolves. The fourth card is the **aftermath** — the receipt that locks change into Eira's graph.

For a small encounter: a single line. *"Eira earned the iron pin of Bren — the Civic Guard remembers her. She also carries new knowledge: the trader has a contraband line."*

For a big encounter (per the v1 grill-me discussion): a forced choice. *"How does she carry this? — Bear it as a debt to Veiren — or — Repay it now with the trader's name."* Two cards face-down on the screen, the player picks one. The choice tints how she behaves in future scenes.

**What they feel.** Completion. A small thump of *"that mattered."* The biography ticked forward.

**What they think.** "Now what's she like?" Maybe they click on her character sheet and see the iron pin sitting alongside the vow.

**Hook.** The promise of "after an encounter, the character is changed in a way you have to reckon with on next use" pays off here or it doesn't. The aftermath card is the design's moment of truth.

**Risk.** If the aftermath is paperwork (a checklist of bullet-pointed gains and losses), it deflates the encounter. v3's structure resists this — one or two sentences, one or two artifacts, poetic not bureaucratic. Content authors need to be held to this discipline.

---

### Beat 9 — Return to world

**What happens.** The encounter screen fades. The world view returns. Eira's portrait now shows a small new mark — a tiny iron pin icon. Time is still paused. The retinue panel shows: *Serafina the Quiet — a beat brews, click to peek*.

**What they feel.** Continuity. Hunger. They want to know what's next.

**What they think.** "Do I take Serafina now? Or do I check Eira's sheet to see what just happened to her?"

**Affordances they use.** The retinue panel as next-encounter selector. Eira's portrait → click for biography. End turn → advance to next.

**Hook.** This is the moment where wide-vs-tall play is real. A wide-play player skims to Serafina immediately; a tall-play player lingers on Eira to read what changed. The design must reward both.

---

## 3. Affordances and how they map to player styles

| Affordance | What it does | Who uses it |
|---|---|---|
| Place painting at top of card | Sets the scene; movie-in-the-head | Everyone, passively |
| TTS / Kokomoro voice button | Reads prose aloud | Players who consume ambiently; accessibility users |
| Dotted-underlined coloured terms | Reveal context on hover | Players who lean in; world-readers |
| Cast portraits in left rail | Remind who's in the room | Everyone |
| Carried-items list | Show what Eira brings to the moment | Strategic players |
| 3 lean primitive cards | The encounter's specific tilts | Active players choosing direction |
| Ascendant Action cards (right rail) | Broader god-moves filtered by scene | Players with deeper investment / tall play |
| "+ four more from your deck" | Disclosure to full hand | Power users; rare moments |
| Divine Court compact rail | Peripheral awareness of other agents | Wide-play players |
| Watch only panel | Opt-out without penalty | Tired or curious players, anyone |
| Step pips (BEAT 2 OF 4) | Tells you you're mid-arc | Everyone, glance-only |
| Change indicator on outcome | Names the artifact crystallised | Everyone |
| Aftermath card | The change made permanent | Everyone |

**Two distinct player styles the design tries to serve:**

- **Tall play / Malazan-protagonist style.** Few agents, deep investment. Reads every tooltip, plays Ascendant cards, lingers on aftermath. Wants the encounter to feel like a *short story* with weight. v3 mostly serves this.
- **Wide play / portfolio style.** Many agents, opportunistic spotlighting. Skims encounters, hits watch-only often, drills in only when something looks interesting. Wants the encounter to be *briefly readable* and easy to disengage from. v3 honours this through opt-out, TTS, and the small notification card.

**A third style the design might fail.** *The lurker* — a player who never plays Ascendant cards because they don't trust they understand them yet. If the right rail's purpose isn't immediately legible, this player ignores half the design. The Ascendant card teaching needs to be in-encounter (tooltips, prereq hints on dimmed cards) and in onboarding (an early encounter that *requires* one). Otherwise, six months in, this player still hasn't touched their hand.

---

## 4. Where the design works (the hooks)

1. **The painting + cast + prose triple.** This is what turns "card with options" into "scene." Every successful encounter relies on it.
2. **The lean cards' shape.** SPHERE → god-verb → what arises in her → consequence. Reads like a directorial note. Honors the *influence not control* principle.
3. **Tooltips as world-depth.** Two layers of legibility — the surface story for skimmers, the world depth for hovering. Both honoured.
4. **Watch-only as first-class.** *No act is also a story.* The opt-out is a real escape hatch, not a punishment.
5. **The aftermath card as receipt.** One sentence + one artifact. Poetic, not bureaucratic. The change locks in.
6. **Ascendant cards as filter, not new vocabulary.** Hooking into the existing toolbox means content authors don't learn a parallel system.

---

## 5. Where the design might fail (the risks)

1. **Information overload at first entry.** Eleven sources of information on screen. Some players will freeze. Mitigation: playtest cold-open scenarios; consider progressive disclosure (cast cards collapsed by default, expandable).
2. **Tooltip discoverability.** If players don't notice the dotted-underline treatment, the world depth never opens. Mitigation: subtle "hover for more" cue on first encounter; animated dotted-underline on first appearance.
3. **Ascendant cards feeling alien.** If the player can't tell the difference between a contextual lean and an Ascendant card, the right rail reads as duplication. Mitigation: visual separation is clean in v3 (right vs bottom), but the *purpose* needs to be taught — early encounters where a contextual lean isn't enough and an Ascendant card cracks the moment open.
4. **The dice moment too short or too long.** Design a 3–4 second held breath with a 'continue' click. Test it.
5. **Aftermath becoming paperwork.** The discipline is "one sentence, one artifact." Content authors will drift toward bullet lists. The pipeline must reject paperwork-style aftermath at review.
6. **Watch-only feeling cowardly.** If un-leaned encounters generate worse stories disproportionately, the opt-out collapses. Mitigation: separately content-author the un-intervened path; never leave it to a degenerate fallback.
7. **The lurker.** Players who never touch their Ascendant hand because they don't understand it. Mitigation: onboarding scenario that *requires* one, plus prereq hints on dimmed cards.
8. **Divine Court rail competing for attention.** When Serafina starts pulsing while you're mid-Eira, the player's eye is pulled away. Mitigation: pulse is small and slow; clicking another agent doesn't interrupt the current encounter, it queues.
9. **Voice/TTS feeling like a gimmick.** If the Kokomoro voice is uncanny or robotic, players will turn it off and never use it. The voice has to be the right voice. This is a "get it right or kill it" problem.
10. **Failure-as-complication discipline at content time.** Every encounter author needs to be able to write a *better* failure than success. If most authors give up and write generic "she couldn't do it" failures, the principle dies.

---

## 6. Open questions for the long-form design plan

- **Cost ceiling per beat.** One contextual lean + one Ascendant card max? Or stack freely up to your essence? My lean: one + one.
- **Aftermath choice mechanism.** Two face-down cards the player picks between? Drag-and-drop? A simple two-button binary? The user said small encounters get receipts, big ones get choices — but the choice UI is unspecified.
- **What is "watch only" mechanically?** Does it just skip to outcome? Does it produce a degraded-but-real story? Does it consume any quintessence (no), or generate any (no)?
- **TTS scope.** Per beat? Whole encounter? On hover? Default on or off?
- **Multi-beat pacing.** Are beats cinematic (you press to advance) or auto-flowing (with a skip)? Probably the former in turn-based.
- **Onboarding.** What's the first encounter the player ever sees? It teaches the shape. Specifying this is a project of its own.

---

## 7. Verdict question for the user

Three things I want your verdict on before committing the long-form plan:

1. **Is the journey description true to your vision?** Specifically the *what they feel* line for each beat. If any of those rings false, I want to know which one and why.
2. **The Ascendant card hooking-into-toolbox model.** Is "right rail = scene-relevance filter on the existing ActionDrawer" the right architecture? Or do you want encounter-time Ascendant moves to be a separate, smaller vocabulary?
3. **The 10 risks above.** Which ones do you take seriously enough to design around in v1, vs. which are theatre risks we accept and watch?

If those land, I'll proceed to the long-form Engine/Content/UI design plan.
