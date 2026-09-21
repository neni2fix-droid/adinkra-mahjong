/**
 * State — the pure game state machine.
 *
 * Every gameplay transition lives here as a total function `GameState → GameState`.
 * The React layer never computes a rule, a score or a status: it calls one of
 * these and renders the result. That keeps the entire game testable without a
 * DOM, which matters because browser automation is unavailable on this host.
 *
 * Purity rules observed throughout:
 *  - **No mutation.** Every function returns a new object; unchanged branches
 *    return the *same* reference so React can bail out of re-rendering.
 *  - **No ambient time.** "Now" is always passed in by the caller.
 *  - **No randomness except through a seed.** Shuffles derive their seed from
 *    the game state, so a whole game is reproducible from `(layout, seed)`.
 *
 * Pure module: no DOM, no React, no `Date.now()`.
 */
import { countBySymbol, maxLayerOf, remainingCount } from './board';
import { shuffleRemaining } from './deck';
import { findHint, hasMoves, select } from './rules';
import { applyMatchScoring, applyPenalty, breakFlow, starsFor, timeBonus } from './scoring';
import {
  CHARM_START,
  HINT_PENALTY,
  RESCUE_SHUFFLE_PENALTY,
  SHUFFLE_PENALTY,
  SHUFFLE_MAX_ATTEMPTS,
  TILE_COUNT,
  UNDO_LIMIT,
} from './types';
import type {
  GameEvent,
  GameState,
  GameStatus,
  LayoutDefinition,
  SymbolId,
  Tile,
  TileKey,
  UndoRecord,
} from './types';
import { generateSolvable } from './deck';

/* ── construction ───────────────────────────────────────────────────── */

/** A brand-new score bag. */
function freshScore() {
  return {
    score: 0,
    combo: 0,
    maxCombo: 0,
    lastMatchAt: 0,
    moves: 0,
    hintsUsed: 0,
    shufflesUsed: 0,
    rescuesUsed: 0,
    quadClears: 0,
    charms: CHARM_START,
  };
}

/**
 * Deal a fresh game.
 *
 * @param layout The board shape to deal.
 * @param seed   Deterministic seed — same `(layout, seed)` ⇒ identical board.
 * @param codex  Already-unlocked Codex ids, carried across games.
 */
export function createGame(
  layout: LayoutDefinition,
  seed: number,
  codex: readonly SymbolId[] = [],
): GameState {
  const deal = generateSolvable(layout, seed);

  return {
    status: 'playing',
    layoutId: layout.id,
    tiles: deal.tiles,
    selected: null,
    remaining: TILE_COUNT,
    score: freshScore(),
    elapsedSeconds: 0,
    history: [],
    hintKeys: null,
    seed,
    codex: [...codex].sort((a, b) => a - b),
    lastEvent: { kind: 'new-game', layoutId: layout.id },
    eventSeq: 1,
  };
}

/**
 * Deal a new game **keeping** the Codex (the collection is permanent).
 * Undo history, score and timer all reset.
 */
export function startNewGame(
  state: GameState,
  layout: LayoutDefinition,
  seed: number,
): GameState {
  const next = createGame(layout, seed, state.codex);
  return {
    ...next,
    lastEvent: { kind: 'new-game', layoutId: layout.id },
    eventSeq: state.eventSeq + 1,
  };
}

/** Re-deal the *same* layout with a new seed. */
export function restartGame(
  state: GameState,
  layout: LayoutDefinition,
  seed: number,
): GameState {
  const next = createGame(layout, seed, state.codex);
  return {
    ...next,
    lastEvent: { kind: 'restart', layoutId: layout.id },
    eventSeq: state.eventSeq + 1,
  };
}

/* ── helpers ────────────────────────────────────────────────────────── */

/** Attach an event and bump the sequence number the UI watches. */
function withEvent(state: GameState, event: GameEvent): GameState {
  return { ...state, lastEvent: event, eventSeq: state.eventSeq + 1 };
}

/** Terminal statuses ignore all gameplay input. */
function isPlayable(state: GameState): boolean {
  return state.status === 'playing';
}

/**
 * Won > no-moves > playing.
 *
 * Never returns `paused`: pausing is a UI-level overlay, so that a paused board
 * still reports the truth about whether moves remain.
 */
export function evaluateStatus(state: GameState): GameStatus {
  if (state.remaining === 0) return 'won';
  if (!hasMoves(state.tiles, maxLayerOf(state.tiles))) return 'no-moves';
  return 'playing';
}

/** Can a hint be bought right now? */
export function canHint(state: GameState): boolean {
  return isPlayable(state) && state.score.charms > 0 && hasMoves(state.tiles, maxLayerOf(state.tiles));
}

/** Can a shuffle be bought right now? */
export function canShuffle(state: GameState): boolean {
  return isPlayable(state) && state.score.charms > 0 && state.remaining >= 2;
}

/** Is there anything on the undo stack? */
export function canUndo(state: GameState): boolean {
  return state.status !== 'won' && state.history.length > 0;
}

/* ── select / match ─────────────────────────────────────────────────── */

/**
 * Handle a tile tap. Classifies via `rules.select`, then applies consequences.
 *
 * The two stateful rules:
 *  - an **invalid** pick breaks the Flow chain and moves the selection to the new
 *    tile (design doc §4.1);
 *  - a **match** commits tiles, score, Codex, undo record and status.
 */
export function applySelect(state: GameState, tileKey: TileKey, now: number): GameState {
  if (!isPlayable(state)) return withEvent(state, { kind: 'ignored' });

  const outcome = select(state.tiles, state.selected, tileKey, maxLayerOf(state.tiles));

  switch (outcome.type) {
    case 'ignored':
      return withEvent(state, { kind: 'ignored' });

    case 'blocked':
      return withEvent({ ...state, hintKeys: null }, { kind: 'blocked', key: tileKey });

    case 'selected':
      return withEvent(
        { ...state, selected: tileKey, hintKeys: null },
        { kind: 'select', key: tileKey, symbolId: state.tiles[tileKey].symbolId },
      );

    case 'deselected':
      return withEvent({ ...state, selected: null }, { kind: 'deselect', key: tileKey });

    case 'invalid':
      return withEvent(
        {
          ...state,
          selected: outcome.second,
          score: breakFlow(state.score),
          hintKeys: null,
        },
        { kind: 'invalid', keys: [outcome.first, outcome.second] },
      );

    case 'matched':
      return commitMatch(state, outcome.keys, outcome.symbolId, now);
  }
}

/**
 * Commit a matched pair.
 *
 * Order matters: the Quad Clear test reads the live count *before* removal, so a
 * symbol with exactly two live copies is completing on this move.
 */
function commitMatch(
  state: GameState,
  keys: [TileKey, TileKey],
  symbolId: SymbolId,
  now: number,
): GameState {
  const liveBefore = countBySymbol(state.tiles).get(symbolId) ?? 0;
  const quadCleared = liveBefore === 2;

  const tiles: Record<TileKey, Tile> = {
    ...state.tiles,
    [keys[0]]: { ...state.tiles[keys[0]], removed: true },
    [keys[1]]: { ...state.tiles[keys[1]], removed: true },
  };

  const codexUnlocked = !state.codex.includes(symbolId);
  const codex = codexUnlocked
    ? [...state.codex, symbolId].sort((a, b) => a - b)
    : state.codex;

  const outcome = applyMatchScoring(state.score, now, quadCleared);
  const charmGain = outcome.score.charms - state.score.charms;

  const record: UndoRecord = {
    keys,
    symbolId,
    pointsAwarded: outcome.points + outcome.quadBonus,
    charmGain,
    codexGained: codexUnlocked ? [symbolId] : [],
    before: {
      combo: state.score.combo,
      maxCombo: state.score.maxCombo,
      lastMatchAt: state.score.lastMatchAt,
      moves: state.score.moves,
      elapsedSeconds: state.elapsedSeconds,
    },
  };

  const history = [...state.history, record];
  if (history.length > UNDO_LIMIT) history.shift();

  const remaining = remainingCount(tiles);

  let next: GameState = {
    ...state,
    tiles,
    remaining,
    selected: null,
    hintKeys: null,
    score: outcome.score,
    history,
    codex,
  };

  const status = evaluateStatus(next);

  if (status === 'won') {
    // Bake the completion bonus in so `state.score.score` is the final score.
    const bonus = timeBonus(next.elapsedSeconds);
    const finalScoreValue = next.score.score + bonus;
    const stars = starsFor({
      cleared: true,
      shufflesUsed: next.score.shufflesUsed,
      hintsUsed: next.score.hintsUsed,
      maxCombo: next.score.maxCombo,
    });
    next = withEvent(
      { ...next, status: 'won', score: { ...next.score, score: finalScoreValue } },
      { kind: 'won', score: finalScoreValue, stars },
    );
  } else {
    next = withEvent({ ...next, status }, { kind: 'matched', keys, symbolId, points: outcome.points, combo: outcome.streak, quadCleared, codexUnlocked });
  }

  return next;
}

/* ── undo ───────────────────────────────────────────────────────────── */

/**
 * Undo the most recent match.
 *
 * Restoration is **exact by construction**: the undo record stores the points the
 * match actually awarded and the scalars from immediately before it, so undoing
 * subtracts precisely what was added and restores precisely what was there.
 * Hint and shuffle penalties applied *after* the match are untouched — they were
 * never part of the match, so they survive the undo (no refund exploit).
 */
export function applyUndo(state: GameState): GameState {
  const record = state.history[state.history.length - 1];
  if (!record) return withEvent(state, { kind: 'ignored' });

  const tiles: Record<TileKey, Tile> = {
    ...state.tiles,
    [record.keys[0]]: { ...state.tiles[record.keys[0]], removed: false },
    [record.keys[1]]: { ...state.tiles[record.keys[1]], removed: false },
  };

  const codex =
    record.codexGained.length > 0
      ? state.codex.filter((id) => !record.codexGained.includes(id))
      : state.codex;

  return withEvent(
    {
      ...state,
      status: 'playing',
      tiles,
      remaining: remainingCount(tiles),
      history: state.history.slice(0, -1),
      selected: null,
      hintKeys: null,
      codex,
      elapsedSeconds: record.before.elapsedSeconds,
      score: {
        ...state.score,
        score: Math.max(0, state.score.score - record.pointsAwarded),
        combo: record.before.combo,
        maxCombo: record.before.maxCombo,
        lastMatchAt: record.before.lastMatchAt,
        moves: record.before.moves,
        charms: Math.max(0, state.score.charms - record.charmGain),
      },
    },
    { kind: 'undo' },
  );
}

/* ── hint ───────────────────────────────────────────────────────────── */

/**
 * Buy a hint: −1 Charm, −`HINT_PENALTY` points, highlight the pair.
 *
 * A hint deliberately does **not** break the Flow chain — it costs score and a
 * Charm, and the chain is the player's own business. It also does not push onto
 * the undo stack, because it is not a move.
 */
export function applyHint(state: GameState, now: number): GameState {
  void now;
  if (!canHint(state)) return withEvent(state, { kind: 'ignored' });

  const pair = findHint(state.tiles, maxLayerOf(state.tiles));
  if (!pair) return withEvent(state, { kind: 'ignored' });

  return withEvent(
    {
      ...state,
      hintKeys: pair,
      score: applyPenalty(
        {
          ...state.score,
          hintsUsed: state.score.hintsUsed + 1,
          charms: state.score.charms - 1,
        },
        HINT_PENALTY,
      ),
    },
    { kind: 'hint', keys: pair, symbolId: state.tiles[pair[0]].symbolId },
  );
}

/* ── shuffle & rescue ───────────────────────────────────────────────── */

/** Derive a fresh shuffle seed from state, so repeated shuffles differ. */
function shuffleSeed(state: GameState): number {
  return (
    (state.seed * 2654435761 + state.score.shufflesUsed * 40503 + state.eventSeq + 1) >>> 0
  );
}

/**
 * Buy a shuffle: −1 Charm, −`SHUFFLE_PENALTY` points.
 *
 * The charge is only taken when the shuffle actually succeeds — a failed shuffle
 * must never cost the player anything.
 */
export function applyShuffle(state: GameState): GameState {
  if (!canShuffle(state)) return withEvent(state, { kind: 'ignored' });

  const outcome = shuffleRemaining(
    state.tiles,
    maxLayerOf(state.tiles),
    shuffleSeed(state),
    SHUFFLE_MAX_ATTEMPTS,
  );

  if (!outcome.ok) {
    return withEvent(state, { kind: 'shuffle', moved: 0, failed: true });
  }

  const next: GameState = {
    ...state,
    tiles: outcome.tiles,
    selected: null,
    hintKeys: null,
    score: applyPenalty(
      {
        ...state.score,
        shufflesUsed: state.score.shufflesUsed + 1,
        charms: state.score.charms - 1,
      },
      SHUFFLE_PENALTY,
    ),
  };

  return withEvent({ ...next, status: evaluateStatus(next) }, { kind: 'shuffle', moved: outcome.moved, failed: false });
}

/**
 * The no-moves escape hatch: a shuffle that costs points but **no Charm**.
 *
 * This is what makes being stuck recoverable rather than fatal (design doc §7).
 * Always available from the no-moves screen.
 */
export function applyRescueShuffle(state: GameState): GameState {
  if (state.status !== 'no-moves' && state.status !== 'playing') {
    return withEvent(state, { kind: 'ignored' });
  }
  if (state.remaining < 2) return withEvent(state, { kind: 'ignored' });

  const outcome = shuffleRemaining(
    state.tiles,
    maxLayerOf(state.tiles),
    shuffleSeed(state) ^ 0x9e3779b9,
    SHUFFLE_MAX_ATTEMPTS,
  );

  if (!outcome.ok) {
    return withEvent(state, { kind: 'shuffle', moved: 0, failed: true });
  }

  const next: GameState = {
    ...state,
    tiles: outcome.tiles,
    selected: null,
    hintKeys: null,
    score: applyPenalty(
      { ...state.score, rescuesUsed: state.score.rescuesUsed + 1 },
      RESCUE_SHUFFLE_PENALTY,
    ),
  };

  return withEvent(
    { ...next, status: evaluateStatus(next) },
    { kind: 'rescue', moved: outcome.moved },
  );
}

/* ── timer & pause ──────────────────────────────────────────────────── */

/** Advance the clock. A no-op unless the game is genuinely being played. */
export function applyTick(state: GameState, seconds: number): GameState {
  if (!isPlayable(state) || seconds <= 0) return state;
  return { ...state, elapsedSeconds: state.elapsedSeconds + seconds };
}

/** Pause. Ignored unless the game is in progress. */
export function pauseGame(state: GameState): GameState {
  if (!isPlayable(state)) return state;
  return withEvent({ ...state, status: 'paused' }, { kind: 'paused' });
}

/** Resume. Re-evaluates the status so a paused board cannot hide a no-moves state. */
export function resumeGame(state: GameState): GameState {
  if (state.status !== 'paused') return state;
  return withEvent({ ...state, status: evaluateStatus(state) }, { kind: 'resumed' });
}

/** Clear the transient hint highlight (the UI does this on a timer). */
export function clearHint(state: GameState): GameState {
  if (state.hintKeys === null) return state;
  return { ...state, hintKeys: null };
}
