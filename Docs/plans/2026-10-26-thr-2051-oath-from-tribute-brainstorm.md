# Brainstorm companion — an oath from tribute (THR-2051)

Companion to [`2026-10-26-thr-2051-oath-from-tribute.md`](2026-10-26-thr-2051-oath-from-tribute.md). Design lane, run 2026-10-26b, unattended.

## The question

*The Tribute Exchange* is a hall scene: a mortal lays three trays of tribute before a court, argues the schedule, and swears. Its commitment step says the crown *"swears to the protection that answers it. Both halves go on the page."* Mortal wealth S2 made the tribute cost Means. Nothing is sworn. The [outcome table](https://linear.app/threadbare/issue/THR-1872) asks for *"S Means−− + protection oath"*. Who swears to whom?

## Vision premises in play

- **The world remembers what mortals do** (`Vision/01-core-loop.md`): a scene the player watched should leave a mark the faction sheet can show.
- **Relationships are edges** (`Vision/02-non-negotiables.md`): the oath is the crown's own `sworn_to` edge, not a flag on the mortal.
- **Systemic over scripted** (`Vision/03-design-tensions.md` #2): the scene writes through the crown's one writer, so loyalty, tax, wages and breaking all apply with no special case.

## Options considered

1. **The mortal's own faction swears to the realm that holds the hall** (taken). The prose is about *{actor}'s house* paying for protection. The mortal's house is the faction they rank highest in, and the hall's master is the realm holding that town. One mortal never swears a whole realm (THR-1944's rule for a reused commander, `brokeredOath.ts:66-70`).
2. **The mortal's realm swears to the hall's realm.** Rejected: one hall scene would turn a whole nation into a vassal. THR-1944 already ruled this out for a broker.
3. **A faction present in the town swears** (THR-1944's default pick). Rejected: the tribute is the actor's own, paid out of their own Means. A stranger's guild swearing for it breaks the scene's sense.
4. **No faction — a personal protection mark on the mortal.** Rejected: the crown has no person-level oath, and inventing one is a new primitive (load-bearing decision: no new node or edge types without asking).

## Tensions

- **Bands.** The commitment step's success line is the oath; its failure line strikes the protection clause and keeps the tribute. So every success band swears, and both failure bands pay with nothing sworn. That is the existing Means table, unchanged.
- **No oath possible.** Often the actor has no faction that may swear, or their house is already sworn, or a guild holds the town. The tribute is still paid (it was paid on the trays, before the oath). No refund: a refund would make the scene free when nothing can come of it, and the prose never promises one.
- **Likelier when held.** The table's *likelier when* column says "held town". The census (plan § Substrate) shows how often the scene's town is realm-held. If it is most of the time, no draw change is owed in this slice.
- **Tax.** A sworn vassal pays its liege three tenths of its day income (rulebook quick reference). That is the real tribute, every day after. The scene's Means step is the trays.

## Rejected mechanisms

- A new effect kind. The existing `faction_broker_fealty` does the work once it can take its liege from the scene's town instead of the broker's realm, so this slice adds one optional field.
- A new oath kind `tribute`. `persuaded` already reads *"won by protection"* on the sheet, and the brokered tail reads *"won by <name>'s word"*. A new kind would need words on every crown surface for one scene.
