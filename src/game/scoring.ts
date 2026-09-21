/**
 * Scoring — the Flow chain, Quad Clears, penalties, the time bonus and stars.
 *
 * Every number here is a constant from `types.ts`; the reasoning behind each one
 * is in `docs/game-design.md` §5. This module is the only place that may turn a
 * gameplay event into points.
 *
 * Pure module: no DOM, no React, no `Date.now()` inside — "now" is always passed
 * in, so every function is deterministic and trivially testable.
 */
import {
  BASE_POINTS,
  CHARM_MAX,
  COMBO_MAX,
  COMBO_MULTIPLIERS,
  COMBO_WINDOW_MS,
  QUAD_CLEAR_BONUS,
  STAR3_MIN_COMBO,
  WIN_BONUS_PER_SEC,
  WIN_TARGET_SECONDS,
} from './types';
import type { LayoutId, LayoutRecord, LayoutRecords, ScoreState, StarRating } from './types';

/* ── Flow: the combo chain ──────────────────────────────────────────── */

/**
 * Multiplier for a streak of `streak` consecutive matches.
 *
 * `1 → ×1.0`, `2 → ×1.5`, `3 → ×2.0`, `4 → ×2.5`, `5+ → ×3.0` (capped).
 * A streak of 0 (or negative) counts as ×1.0.
 */
export function flowMultiplier(streak: number): number {
  if (streak <= 0) return COMBO_MULTIPLIERS[0];
  const index = Math.min(streak, COMBO_MAX) - 1;
  return COMBO_MULTIPLIERS[index];
}

/** Points for a match made at the given streak, before any Quad Clear bonus. */
export function matchPoints(streak: number): number {
  return Math.round(BASE_POINTS * flowMultiplier(streak));
}

/**
 * The streak a match made *now* would achieve.
 *
 * Extends the chain when the previous match is still inside the Flow window;
 * otherwise starts a fresh chain at 1.
 */
export function nextStreak(score: ScoreState, now: number): number {
  if (score.lastMatchAt === 0) return 1;
  const withinWindow = now - score.lastMatchAt <= COMBO_WINDOW_MS;
  return withinWindow ? score.combo + 1 : 1;
}

/** Is a Flow chain currently alive? Drives the countdown ring in the stats bar. */
export function isFlowAlive(score: ScoreState, now: number): boolean {
  return score.lastMatchAt > 0 && now - score.lastMatchAt <= COMBO_WINDOW_MS;
}

/** Milliseconds left in the Flow window, clamped to `0..COMBO_WINDOW_MS`. */
export function flowRemainingMs(score: ScoreState, now: number): number {
  if (score.lastMatchAt === 0) return 0;
  return Math.max(0, Math.min(COMBO_WINDOW_MS, COMBO_WINDOW_MS - (now - score.lastMatchAt)));
}

/** Break the chain — used by an invalid pick. */
export function breakFlow(score: ScoreState): ScoreState {
  if (score.combo === 0 && score.lastMatchAt === 0) return score;
  return { ...score, combo: 0, lastMatchAt: 0 };
}

/** The result of committing a match. */
export interface MatchOutcome {
  score: ScoreState;
  /** Points for the match itself, Flow multiplier included. */
  points: number;
  /** Extra points from a Quad Clear, or 0. */
  quadBonus: number;
  /** Streak achieved by this match. */
  streak: number;
  /** True when this match removed the symbol's 4th copy. */
  quadCleared: boolean;
  /** True when the Charm award was swallowed by the cap. */
  charmCapped: boolean;
}

/**
 * Apply a committed match to the score state.
 *
 * @param score       Score state before the match.
 * @param now         Epoch ms of the match.
 * @param quadCleared Whether this match removed the symbol's last two copies.
 */
export function applyMatchScoring(
  score: ScoreState,
  now: number,
  quadCleared: boolean,
): MatchOutcome {
  const streak = nextStreak(score, now);
  const points = matchPoints(streak);
  const quadBonus = quadCleared ? QUAD_CLEAR_BONUS : 0;
  const charmBefore = score.charms;
  const charms = quadCleared
    ? Math.min(CHARM_MAX, charmBefore + 1)
    : charmBefore;

  return {
    score: {
      ...score,
      score: score.score + points + quadBonus,
      combo: streak,
      maxCombo: Math.max(score.maxCombo, streak),
      lastMatchAt: now,
      moves: score.moves + 1,
      quadClears: score.quadClears + (quadCleared ? 1 : 0),
      charms,
    },
    points,
    quadBonus,
    streak,
    quadCleared,
    charmCapped: quadCleared && charms === charmBefore,
  };
}

/* ── Penalties ──────────────────────────────────────────────────────── */

/** Score after paying a penalty. Floors at 0 — the score never goes negative. */
export function applyPenalty(score: ScoreState, amount: number): ScoreState {
  return { ...score, score: Math.max(0, score.score - amount) };
}

/* ── Time bonus & final score ───────────────────────────────────────── */

/**
 * Completion bonus: `WIN_BONUS_PER_SEC` per second *under* par, zero at or past
 * par. Clamped so a suspicious elapsed time can never inflate the score.
 */
export function timeBonus(elapsedSeconds: number): number {
  const under = Math.max(0, Math.min(WIN_TARGET_SECONDS, WIN_TARGET_SECONDS - elapsedSeconds));
  return Math.round(WIN_BONUS_PER_SEC * under);
}

/** The score written to the record book: earned points plus the time bonus. */
export function finalScore(score: ScoreState, elapsedSeconds: number): number {
  return score.score + timeBonus(elapsedSeconds);
}

/* ── Stars: the mastery ladder (design doc §4.4) ────────────────────── */

/** Inputs the star rating depends on. */
export interface StarInputs {
  cleared: boolean;
  shufflesUsed: number;
  hintsUsed: number;
  maxCombo: number;
}

/**
 * ★ clear · ★★ clear with no shuffle · ★★★ clear with no shuffle, no hint and a
 * peak Flow of at least ×2.5 (`STAR3_MIN_COMBO`).
 *
 * Deliberately binary rather than score-thresholded: with no playtest data,
 * "clear 14 000 points" would be fake precision (design doc §4.4).
 */
export function starsFor({ cleared, shufflesUsed, hintsUsed, maxCombo }: StarInputs): StarRating {
  if (!cleared) return 0;
  if (shufflesUsed > 0) return 1;
  if (hintsUsed > 0) return 2;
  return maxCombo >= STAR3_MIN_COMBO ? 3 : 2;
}

/** Human-readable requirement for the next star, for the win modal. */
export function starHint(stars: StarRating): string {
  switch (stars) {
    case 3:
      return 'Perfect play — no hints, no shuffles, and a ×2.5 Flow chain.';
    case 2:
      return 'Clear without hints or shuffles to earn ★★★.';
    case 1:
      return 'Clear without using a shuffle to earn ★★.';
    default:
      return 'Clear the board to earn ★.';
  }
}

/* ── Record book ────────────────────────────────────────────────────── */

/** A blank record, used the first time a layout is played. */
export function emptyRecord(): LayoutRecord {
  return { bestScore: 0, stars: 0, clears: 0, bestTimeSeconds: null };
}

/**
 * Fold a finished run into the per-layout record book.
 *
 * Best score and star rating only ever improve; `clears` counts up; best time is
 * the fastest clear. Returns a **new** object — never mutates the input.
 */
export function recordRun(
  records: LayoutRecords,
  layoutId: LayoutId,
  result: { score: number; stars: StarRating; elapsedSeconds: number },
): LayoutRecords {
  const previous = records[layoutId] ?? emptyRecord();
  const bestTimeSeconds =
    previous.bestTimeSeconds === null
      ? result.elapsedSeconds
      : Math.min(previous.bestTimeSeconds, result.elapsedSeconds);

  return {
    ...records,
    [layoutId]: {
      bestScore: Math.max(previous.bestScore, result.score),
      stars: (Math.max(previous.stars, result.stars) as StarRating),
      clears: previous.clears + 1,
      bestTimeSeconds,
    },
  };
}

/** Total stars across every layout — the headline progress number. */
export function totalStars(records: LayoutRecords): number {
  let total = 0;
  for (const id in records) {
    total += records[id as LayoutId]?.stars ?? 0;
  }
  return total;
}
