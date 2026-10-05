# Brainstorm companion — a lead ends where the site's road ends (THR-1702)

Companion to `Docs/plans/2026-10-05-thr-1702-found-leads-end-the-climb.md`. The thinking that did not belong in the spec.

## What it feels like from inside the world

A seeker hears of a glowing hollow in the hills, goes to look, reads the ground, and finds it. Then, every day for the rest of the year, she walks back out to survey it again, as though she had not. Nobody in the world would tell that story. The rest of the climb is good: rumour, search, arrival, knowing. Only the ending is missing. At a ruin the ending is the delve. At a wonder or a toppled tower, nothing is written, so the system keeps restarting the last chapter.

The fix gives the climb the ending it already implies. The visit's success line says she *knows where it lies now*. That becomes true and stays true: the place goes on her sheet as somewhere she found, and the itch to look again is gone.

## Why "found it" and not a reward

The tempting fix is a payoff: finding a wonder could grant a blessing, a sphere's essence or a mark. It is attractive because wonders are sphere-resonant places with legends attached (THR-1631's wonder finders, *"First to find {wonder}, and did not come back the same."*). But choosing that payoff decides what wonders are *for* in the game, and nothing agreed decides it. The bug does not need it either. So the lane fixes the loop and leaves the payoff as an open door, named on the ticket as what would change the call.

There is a quiet benefit to the plain ending. With no reward on a wonder, nothing tempts mortals to farm wonders, and the chase-the-wonder ambition stays a story about seeking, not a resource loop.

## Why the delve road, not "is it a wonder"

The census turned up a second population the ticket did not name: 6–11 worldgen plain ruins per world (`ruins` with no `ruinedTick`, plus shipwrecks, vaults and towers in the ruin class). The visit admits them and no delve enters them, so they have the same dead end. Keying "spent" on the site's class would have fixed wonders and left the ruins looping. Keying on whether a delve could ever start there fixes both. It also treats a mortal-burned town correctly: that site becomes delvable 36 ticks after it falls, so its lead stays alive until then.

## Why the decay sweep is the right place

There are five ways a lead reaches `located`: the visit, a survey critical, two divine-whisper paths, and rumour composition. Putting the find inside each would be five edits and five places to drift. The decay sweep already walks every lead every ten ticks and already owns ending leads (by age). Ending one by being found is the same job.

## Things considered and parked

- **Drop wonders from the visit.** Moves the loop down a rung (a `narrowed` wonder lead is pulled and refreshed forever, since a survey only writes `narrowed`). It also reverses S3's agreed scope.
- **Let the lead age out.** Forgets the find 80 ticks later. A mortal who stood at a wonder should not lose it from her sheet.
- **A wonder-voiced visit template.** The visit's prose is about fallen stone and steps down, which fits hollows and caverns, not springs or groves. It is worth writing when wonders get their meaning. Today it would be 1 visit in 66, written against a question nobody has answered.
- **A chronicle line for the find.** Rejected: a mortal finding a place is not news at the god's scale, and the visit's ending already carried the moment.
