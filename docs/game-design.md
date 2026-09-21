# Adinkra Mahjong — Game Design & Balance

> **Inspired by Ghana's Adinkra visual tradition.**
> Design & Engineering: Nenifix

This document is the **authoritative gameplay design** for Adinkra Mahjong. It
defines *why* the game is fun, *what* systems produce that fun, and *how* those
systems are balanced against each other. `docs/architecture.md` describes how it
is built; this file describes what is being built and why.

Every number here is a **named constant** in `src/game/types.ts`. Nothing in this
document is decorative — each figure is either derived from another, or is
flagged as a tuning lever.

---

## 1. The problem with plain Mahjong Solitaire

Mahjong Solitaire is a good *puzzle* and a mediocre *game*. Four specific
failures, which this design exists to fix:

| # | Failure | Symptom for the player |
|---|---------|------------------------|
| F1 | **No tension.** | There is no clock, no opponent, no risk. Nothing pushes back. |
| F2 | **One decision, repeated.** | "Find any legal pair" is the whole game. After ~10 moves there is no new information, only slower scanning. |
| F3 | **Order is unrewarded.** | Expert players know *which* pair to take changes everything — but the game never pays you for that knowledge, so nobody learns it. |
| F4 | **No reason to return.** | You either clear the board or you don't. There is no next goal. |

Everything below is a targeted response to F1–F4.

---

## 2. Design pillars

Four pillars. Any proposed feature must serve at least one; features that serve
none are rejected (see §8).

1. **Calm mastery.** Premium and quiet, not casino. The game should feel like a
   well-made wooden board, not a slot machine. Reward skill; never punish with
   loss of progress.
2. **Flow over haste.** Pace comes from *rhythm* (matching in a chain), never
   from a countdown that can kill you. Speed is a way to express mastery, not a
   tax on thinking.
3. **The order is the game.** Every system must make *sequencing* matter. This is
   the pillar that fixes F2/F3.
4. **Play is learning.** The Adinkra symbols are not wallpaper. Playing should
   leave you knowing 34 names and 4 families you did not know before.

---

## 3. Core loop

```
        ┌──────────────────────────────────────────────────────┐
        │                                                      │
        ▼                                                      │
   ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌───────────┐  │
   │  READ   │──▶│  PLAN    │──▶│  COMMIT  │──▶│  REWARD   │──┘
   │ scan the│   │ which    │   │ match a  │   │ points,   │
   │ free    │   │ pair, in │   │ pair     │   │ Flow,     │
   │ tiles   │   │ what     │   │          │   │ Charm,    │
   │         │   │ order    │   │          │   │ Codex     │
   └─────────┘   └──────────┘   └──────────┘   └───────────┘
        ▲                                                      │
        └────────────── board mutates, freedom changes ────────┘
```

The loop is the classic solitaire loop. What makes it a *game* is that the
**REWARD** step feeds back into **PLAN**: matching a pair changes which tiles are
free, which changes the correct next move. The player is not solving a static
puzzle; they are steering a mutating one.

**The single most important sentence in this document:** the game pays you for
taking pairs *in the right order*, and the five systems in §4 are the five
currencies it pays you in.

---

## 4. The five systems

Each system is stated as: *the rule*, *what it fixes*, and *why it is balanced*.

### 4.1 Flow — the combo chain

**Rule.** Every successful match builds a streak. The streak pays a multiplier:

| Streak after this match | 1 | 2 | 3 | 4 | 5+ |
|---|---|---|---|---|---|
| Multiplier | ×1.0 | ×1.5 | ×2.0 | ×2.5 | **×3.0** (capped) |

The streak survives only while matches come faster than `COMBO_WINDOW_MS`
(5 000 ms, measured from the *previous* match). Exceed the window, or make an
**invalid** pick (two tiles that do not match), and the streak resets to zero.

**Fixes F1.** This is the tension. It is a soft clock: it never ends your game,
but it always has an opinion about how long you are allowed to think.

**Why it is balanced.**
- The window is **visible** — a countdown ring drains in the stats bar. A tight
  window is only fair if it is legible; an invisible timer would be a cheat.
- The penalty for missing it is *losing a multiplier*, never losing progress.
  This is the pillar-1 promise: skill is rewarded, slowness is not punished with
  loss.
- `×3` caps the runaway. Without a cap, one long streak dominates the entire
  score and the rest of the board becomes irrelevant.
- **The window is deliberately equal to par pace.** `COMBO_WINDOW_MS` (5 000 ms)
  ≈ `WIN_TARGET_SECONDS / pairs` (300 s ÷ 68 pairs = 4.41 s). A player who
  clears the board on par is *exactly* a player who holds Flow. The pace the
  combo demands and the pace the time bonus rewards are the same pace, so the
  game never asks for two contradictory things.
- An invalid pick breaks the streak. This is the one deliberate harshness in the
  design, and it is what converts careless clicking into a real mistake. It is
  also the reason the game has a skill ceiling at all.

### 4.2 Quad Clear — completion is a strategy

**Rule.** Every symbol has exactly 4 copies. When the **4th copy** leaves the
board, that symbol is *Quad Cleared*: **+200 points** and **+1 Charm**.

**Fixes F2/F3.** This is the system that makes *order* matter. In plain
solitaire, every pair is worth the same, so the greedy move is always correct.
Here it is not: a pair that finishes a symbol is worth 300% of a pair that does
not. Suddenly the player is hunting for the *third and fourth* copy of symbols
they have already touched, rather than taking whatever is easiest to see.

**Why it is balanced.**
- Max yield is 34 × 200 = **6 800 points** — about 24% of a perfect run. Large
  enough to be worth playing for, small enough that a player who ignores it
  entirely still clears the board comfortably.
- It cannot be gamed by hoarding: you only get the bonus by *removing* tiles, and
  the four copies are physically scattered across layers. Chasing it forces you
  to open up the board, which is exactly the behaviour we want to teach.
- It is a **guaranteed** reward, not a random one — the opposite of a
  casino mechanic.

### 4.3 Charms — the hint/shuffle economy

**Rule.** Hints and Shuffles are not free buttons; both spend from one shared
pool of **Charms**.

| | |
|---|---|
| Start | **3** Charms |
| Earn | **+1** per Quad Clear |
| Cap | **5** (cannot bank beyond 5) |
| Hint | −1 Charm, −100 points |
| Shuffle | −1 Charm, −200 points |
| Rescue Shuffle | **0 Charms**, −500 points (offered only from the no-moves screen) |

**Fixes F1.** The tension here is *budget*, not reflexes: "Do I spend a Charm on
this hint, or do I keep it for a shuffle I might need at the bottom of the
board?"

**Why it is balanced.**
- **Supply is deliberately generous** (3 + up to 34 = 37 Charms across a game,
  against a realistic demand of ~5–15). This is intentional: Charms are a
  *pacing* device and a *learning* device, not a scarcity wall. A player who is
  learning should never be blocked from finishing.
- **The cap of 5 is what makes it a decision.** You cannot hoard. Once you are
  capped, Charms are burning a hole in your pocket, which is exactly when the
  game wants you spending them to push for a finish.
- **The curve is inverted, and that is the point.** Charms are scarce early
  (3, no Quad Clears yet) and abundant late (Quad Clears have paid out). So the
  resource itself gets easier as the board gets harder — a natural, self-solving
  difficulty curve.
- **The real price of a hint is a star, not the 100 points** (§4.4). The score
  penalty is a nudge; the star is the stake. This keeps penalties legible without
  making the score feel punitive.
- **There is no dead end.** Out of Charms and stuck? The no-moves screen always
  offers a Rescue Shuffle for 500 points. You can never be locked out of a game
  you have invested in. Pillar 1, enforced in code.

### 4.4 Stars — the mastery ladder

**Rule.** Each layout carries a 0–3 star record, earned on a clear:

| Star | Requirement |
|---|---|
| ★ | Clear the board |
| ★★ | Clear with **0 shuffles** used |
| ★★★ | Clear with **0 shuffles**, **0 hints**, and a peak Flow of **≥ ×2.5** (streak 4) |

**Fixes F4.** This is the reason to press Play a second time. ★ is achievable by
anyone; ★★★ is a genuine mastery target that requires both planning *and* pace.

**Why it is balanced.**
- The criteria are **binary and self-evident**, deliberately *not* score
  thresholds. We have no playtest data yet, and inventing "clear 14 000 points"
  would be fake precision that we would have to re-tune blind. "No hints, no
  shuffles, hit a ×2.5 chain" is a rule a player can hold in their head and
  verify themselves.
- Requiring both **purity** (no hints/shuffles) *and* **pace** (a ×2.5 chain)
  prevents two degenerate playstyles from taking the top rank: the patient
  turtle who never uses a Charm but takes 12 minutes, and the frantic clicker who
  chains fast but leans on hints.
- Best score is tracked **per layout**, so each board keeps its own ladder.

### 4.5 Symbol Codex — play is learning

**Rule.** The first time you successfully match a symbol, it is **unlocked in the
Codex**: its name, family, and reference meaning. 34 symbols to collect, shown as
a completion meter.

**Fixes F4, and serves pillar 4.** The Codex turns the symbol set from
decoration into a collection. It also gives the game a reason to exist beyond
puzzle-solving: you finish a run knowing 34 Adinkra names you did not know
before.

**Why it is balanced.**
- It unlocks on **first match**, not on Quad Clear — so it fills quickly and
  early, paying out reward in the first minute rather than the last.
- It is **purely additive**: no score, no Charms, no gameplay effect. It cannot
  distort balance. It is the one system that is allowed to be free.

---

## 5. Balance model

### 5.1 The score formula

```
matchPoints   = round(BASE_POINTS × flowMultiplier(streak))   BASE_POINTS = 100
quadBonus     = QUAD_CLEAR_BONUS × quadClears                 = 200 each, ≤ 34
timeBonus     = WIN_BONUS_PER_SEC × clamp(WIN_TARGET − elapsed, 0, WIN_TARGET)
                = 10 × clamp(300 − t, 0, 300)                 max 3 000
penalties     = 100×hints + 200×shuffles + 500×rescues
total         = max(0, ΣmatchPoints + quadBonus + timeBonus − penalties)
```

**Baseline (no skill):** 68 pairs × 100 = **6 800**.
**Ceiling (Flow held):** the first four matches can only reach ×1/×1.5/×2/×2.5
(100+150+200+250 = 700), then 64 × 300 = 19 200 → **19 900**.

So the Flow system alone is worth a **2.9× swing** in match points. Skill, not
luck, dominates the score. That is the intended hierarchy:

| Score source | Max contribution | Share of a perfect run |
|---|---|---|
| Flow multiplier | 19 900 | 71% |
| Quad Clear | 6 800 | 24% |
| Time bonus | 3 000 | 5% |

The time bonus being only 5% is deliberate: the *window* already supplies pace,
so the bonus is a tiebreaker, not a second clock. Two pace systems pulling hard
in the same direction would make the game frantic, which pillar 1 forbids.

### 5.2 Worked score bands

Five archetypal runs. These are the bands we design against, and the numbers the
post-launch instrumentation in §10 checks us against.

| Archetype | Hints | Shuffles | Avg Flow | Time | Match pts | Quad | Time | Penalties | **Total** |
|---|---|---|---|---|---|---|---|---|---|
| Struggling | 5 | 3 (+1 rescue) | ×1.0 | 600 s | 6 800 | 2 000 | 0 | −1 600 | **7 200** |
| Casual clear | 3 | 1 | ×1.3 | 480 s | 8 840 | 3 600 | 0 | −500 | **11 940** |
| Good | 1 | 0 | ×2.0 | 300 s | 13 600 | 5 000 | 0 | −100 | **18 500** |
| Excellent | 0 | 0 | ×2.4 | 240 s | 17 300 | 6 800 | 600 | 0 | **24 700** |
| Perfect | 0 | 0 | ×3.0 | 150 s | 19 900 | 6 800 | 1 500 | 0 | **28 200** |

**Reading the bands.** The spread from a struggling clear (7.2k) to a perfect
run (28.2k) is **~3.9×**, on identical boards with identical tiles. That ratio is
the whole balance target: big enough that mastery is visible, small enough that a
first-time player's score is not humiliating. Note also that a **casual clear
still beats a struggling clear by 66%** — competence pays before mastery does.

### 5.3 Charm economy balance

| Stage of a run | Matches played | Charms earned | Charms banked (cap 5) | Player feeling |
|---|---|---|---|---|
| Opening | 0–10 | 0 | 3 → 3 | "I have to be careful with these." |
| Early-mid | 10–30 | ~5 | 3 → 5 (capping) | "I can afford a hint now." |
| Late | 30–68 | ~29 | pinned at 5 | "Shuffles are cheap, let's finish." |

Realistic demand across a whole run is 5–15 Charms. Supply is 37. **Charms are
therefore never a wall — they are a brake on the first third of the game**, which
is precisely when a player is most likely to spam hints and learn nothing.

The 500-point Rescue Shuffle is priced at **5 base pairs** — meaningful but
trivially recoverable, since a cleared board is worth ~7 000 minimum. It exists
to make being stuck *sting*, not to make it fatal.

### 5.4 Time budget

| | |
|---|---|
| Pairs to clear | 68 |
| Par (`WIN_TARGET_SECONDS`) | 300 s |
| Par pace | **4.41 s per match** |
| Flow window (`COMBO_WINDOW_MS`) | **5 000 ms** |

The 0.6 s of slack between par pace and the Flow window is intentional: it means
a player who is *on par* holds Flow with a little room to think, and a player who
wants ×3 must beat par by ~12%. Flow is therefore a stretch goal, not a baseline
requirement — which is what keeps it exciting rather than exhausting.

---

## 6. Difficulty curve

Difficulty is expressed as **freedom**, not as tile count. Every layout has
exactly 136 tiles; what changes is how many legal moves are available at a time
and how quickly that number collapses.

| # | Layout | Rating | Freedom profile | Par |
|---|---|---|---|---|
| 1 | **Classic Turtle** | ●○○○ Gentle | Wide 12×8 base, generous rim. Many open pairs throughout; forgiving of mistakes. | ~300 s |
| 2 | **Diamond** | ●●○○ Balanced | Tapering 12×12 rim. Freedom is high in the middle and tightens at the four points. | ~330 s |
| 3 | **Compact Mobile** | ●●●○ Compact | 8 wide portrait. Fewer lateral neighbours, so a "sandwiched" tile stays sandwiched longer. Designed for one-hand play. | ~360 s |
| 4 | **Ghana Star** | ●●●● Mastery | Two deliberate **pinch points** (rows 2 and 9 narrow to 2 tiles) create narrow corridors. The hardest board — mis-sequencing here can genuinely strand tiles. | ~390 s |

**Why this order.** Each layout introduces one new pressure: (1) none, (2)
tapering, (3) narrowness, (4) chokepoints. A player who can hold Flow on the
Ghana Star has mastered the game.

**Default layout is Classic Turtle** — the gentle one. First contact should never
be the hardest board.

---

## 7. Failure, recovery and fairness

The design has exactly **one** failure state, and it is always recoverable.

| Situation | Game response |
|---|---|
| Invalid pick (non-matching pair) | Flow streak resets. Announcement: "Those tiles do not match." Tile shake. No other cost. |
| Blocked tile tapped | Announced, shaken, no state change. The tile explains itself. |
| No legal moves remain | `no-moves` state → modal offering **Rescue Shuffle (−500)**, Restart, or New Game. |
| Refresh / accidental close | Game auto-restores from `localStorage` (versioned, debounced). |
| Bad deal | **Impossible by construction.** Deals are generated by reverse-play, so a full clearing sequence is proven to exist before the first tile is rendered. |
| Board cleared | `won` state → Win modal with star rating, score breakdown, and Replay. |

Two structural guarantees underwrite the whole table:

1. **Every deal is provably solvable.** `deck.ts` builds boards by *removing*
   legal pairs; the removal order it used *is* a valid solution. A player can
   never lose to the shuffle.
2. **Every state is escapable.** There is no combination of inputs that traps a
   player in an unwinnable, un-restartable screen. Pillar 1, enforced by the
   state machine rather than by hope.

The consequence: **the player's only opponent is their own sequencing.** That is
what makes the Flow and Quad Clear systems feel fair even when they punish you.

---

## 8. Anti-features (deliberately excluded)

Explicit non-goals. Each was considered and rejected; recording them prevents
them being re-proposed later.

| Rejected | Why |
|---|---|
| Countdown timer that ends the run | Violates pillar 1. Flow already supplies pace without a fail state. |
| Lives, energy, cooldowns | Adds a *waiting* mechanic to a game about thinking. Nothing to sell, nothing to gate. |
| Purchasable hints / charm packs | Charm supply is already generous (§5.3). Monetising it would require making the game worse first. |
| Wildcard / bomb / power tiles | Would break Mahjong's pure match-2 logic and read as casino. |
| Move limits | Creates a loss state out of the player's control. |
| Random tile bonuses | Casino texture. Every reward in this game is deterministic. |
| Accounts / login for core play | Explicitly excluded by the product brief. Also unnecessary: nothing needs a server. |
| Daily-login streaks (v1) | Habit mechanics on a calm puzzle game feel cheap. Revisit only with a Daily Challenge that is itself good. |
| Score thresholds for stars | Fake precision without playtest data (§4.4). |

---

## 9. Tuning levers, ranked

When the game needs to be easier, harder, or more exciting, change these **in
order**. Levers 1–3 are the ones that matter; the rest are cosmetic.

| Rank | Constant | Current | Safe range | What it controls |
|---|---|---|---|---|
| **1** | `COMBO_WINDOW_MS` | 5 000 | 3 500–6 000 | The single most powerful knob in the game. Lower = frantic and high-variance; higher = thoughtful and low-variance. Move this first. |
| **2** | `QUAD_CLEAR_BONUS` | 200 | 100–300 | How much the game rewards *sequencing* over *greedy matching*. At 0 the game reverts to plain solitaire; above 400 it warps the score. |
| **3** | `CHARM_START` / `CHARM_MAX` | 3 / 5 | 2–4 / 4–6 | How tight the early game feels. Lower `CHARM_MAX` = more forced spending, less hoarding. |
| 4 | `HINT_PENALTY` / `SHUFFLE_PENALTY` | 100 / 200 | 50–300 | Tiebreakers only. The star rating is the real price (§4.4). |
| 5 | `WIN_BONUS_PER_SEC` | 10 | 0–20 | How much speed is rewarded *beyond* holding Flow. |
| 6 | `RESCUE_SHUFFLE_PENALTY` | 500 | 250–1 000 | How much being stuck costs. Never set to 0 — a free rescue removes the reason to plan. |
| 7 | `BASE_POINTS` | 100 | 100 | Pure score inflation. Affects nothing else. Leave alone. |

---

## 10. Post-launch instrumentation

The game stores everything locally and sends nothing anywhere. To tune levers 1–3
against reality rather than intuition, add an **opt-in "Export run stats"**
button (clipboard, user-initiated) recording per completed run: layout, score,
elapsed, matches, max Flow, hints, shuffles, rescues, stars, and cleared/abandoned.

Health metrics and target values:

| Metric | Target | If it misses |
|---|---|---|
| First-clear rate per layout | > 65% | Layout is too hard → raise `COMBO_WINDOW_MS` |
| Median peak Flow | ≥ ×2.0 | The Flow system is not landing → widen the window |
| Median hints per run | ≤ 2 | Board is too opaque → check tile legibility, not the rules |
| Rescue-shuffle rate | < 15% | Deals feel unfair → inspect chokepoint layouts |
| ★★★ rate | 5–15% | Below → too harsh; above → raise the Flow requirement |
| Abandonment by layout | even spread | One layout is disliked → re-examine its freedom profile |

---

## 11. First-release scope: browser only

**The first version ships as a browser game.** No Node service, no desktop shell,
no backend. The brief is explicit about this and the design agrees: none of the
five systems needs a server.

**In scope now:** single-player solitaire · 4 layouts · the five systems above ·
Symbol Codex · 7 screens · keyboard + screen-reader accessibility · PWA ·
`localStorage` persistence · zero runtime dependencies beyond React.

**Explicitly deferred** (and the seam that keeps each one cheap to add later):

| Deferred | Seam already in place |
|---|---|
| Node/Electron desktop build | The core is 100% pure TypeScript with no DOM access (`src/game/**`), so it runs unmodified under Node. Only the React shell would be swapped. |
| Daily Challenge (one shared deal for everyone) | `GameState.seed` is already persisted and the deal is fully deterministic from `(layout, seed)`. |
| Cloud leaderboards | Score derivation is a pure function, so a server could re-verify any submitted run from `(layout, seed, move list)`. |
| Level campaign | Layouts are plain coordinate arrays; new boards need no gameplay changes. |
| Async / race multiplayer | The move list is a serialisable sequence of tile keys. |

---

## 12. Constants reference

Single source of truth: `src/game/types.ts`.

| Constant | Value | Meaning |
|---|---|---|
| `SYMBOL_COUNT` | 34 | Distinct Adinkra symbols |
| `TILES_PER_SYMBOL` | 4 | Copies per symbol |
| `TILE_COUNT` | 136 | Tiles per board |
| `BASE_POINTS` | 100 | Points for a Flow-×1 match |
| `COMBO_WINDOW_MS` | 5 000 | Flow window |
| `COMBO_MAX` | 5 | Streak at which the multiplier caps (×3) |
| `QUAD_CLEAR_BONUS` | 200 | Points for removing a symbol's 4th copy |
| `CHARM_START` | 3 | Starting Charms |
| `CHARM_MAX` | 5 | Charm cap |
| `HINT_PENALTY` | 100 | Score cost of a hint |
| `SHUFFLE_PENALTY` | 200 | Score cost of a shuffle |
| `RESCUE_SHUFFLE_PENALTY` | 500 | Score cost of a no-moves rescue shuffle |
| `WIN_BONUS_PER_SEC` | 10 | Time-bonus rate |
| `WIN_TARGET_SECONDS` | 300 | Par time (bonus hits 0 here) |
| `UNDO_LIMIT` | 20 | Bounded undo depth |
| `SHUFFLE_MAX_ATTEMPTS` | 60 | Bounded shuffle retry budget |

---

**Self-consistency verdict.** Every system maps to a named failure (F1–F4) or
pillar; every number in §5 is derived from §12 or explicitly flagged as a lever;
the score hierarchy (skill 71% > sequencing 24% > speed 5%) matches the stated
pillars; and no system introduces a loss state that §7 does not cover.
