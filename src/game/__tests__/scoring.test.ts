import { describe, expect, it } from 'vitest';
import {
  applyMatchScoring,
  applyPenalty,
  flowMultiplier,
  isFlowAlive,
  matchPoints,
  nextStreak,
  starsFor,
  timeBonus,
} from '../scoring';
import type { ScoreState } from '../types';

function freshScore(): ScoreState {
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
    charms: 3,
  };
}

describe('scoring', () => {
  it('flowMultiplier table', () => {
    expect(flowMultiplier(0)).toBe(1);
    expect(flowMultiplier(1)).toBe(1);
    expect(flowMultiplier(2)).toBe(1.5);
    expect(flowMultiplier(3)).toBe(2);
    expect(flowMultiplier(4)).toBe(2.5);
    expect(flowMultiplier(5)).toBe(3);
    expect(flowMultiplier(10)).toBe(3);
  });

  it('matchPoints at streak 1 = 100', () => {
    expect(matchPoints(1)).toBe(100);
  });

  it('matchPoints at streak 5 = 300', () => {
    expect(matchPoints(5)).toBe(300);
  });

  it('nextStreak starts at 1 when no prior match', () => {
    const score = freshScore();
    expect(nextStreak(score, Date.now())).toBe(1);
  });

  it('nextStreak increments within combo window', () => {
    const now = Date.now();
    const score = { ...freshScore(), combo: 2, lastMatchAt: now - 2000 };
    expect(nextStreak(score, now)).toBe(3);
  });

  it('nextStreak resets after combo window expires', () => {
    const now = Date.now();
    const score = { ...freshScore(), combo: 2, lastMatchAt: now - 6000 };
    expect(nextStreak(score, now)).toBe(1);
  });

  it('isFlowAlive true inside window', () => {
    const now = Date.now();
    const score = { ...freshScore(), lastMatchAt: now - 2000 };
    expect(isFlowAlive(score, now)).toBe(true);
  });

  it('applyMatchScoring increments score and combo', () => {
    const score = freshScore();
    const now = Date.now();
    const outcome = applyMatchScoring(score, now, false);
    expect(outcome.points).toBe(100);
    expect(outcome.score.score).toBe(100);
    expect(outcome.score.combo).toBe(1);
    expect(outcome.score.moves).toBe(1);
  });

  it('applyPenalty floors at 0', () => {
    const score = freshScore();
    const penalized = applyPenalty(score, 50);
    expect(penalized.score).toBe(0);
  });

  it('timeBonus is positive under target', () => {
    expect(timeBonus(120)).toBeGreaterThan(0);
  });

  it('timeBonus is 0 at or over target', () => {
    expect(timeBonus(300)).toBe(0);
    expect(timeBonus(400)).toBe(0);
  });

  it('starsFor: no clear = 0', () => {
    expect(starsFor({ cleared: false, shufflesUsed: 0, hintsUsed: 0, maxCombo: 5 })).toBe(0);
  });

  it('starsFor: clear with shuffle = 1', () => {
    expect(starsFor({ cleared: true, shufflesUsed: 1, hintsUsed: 0, maxCombo: 5 })).toBe(1);
  });

  it('starsFor: clear no shuffle, no hint, low combo = 2', () => {
    expect(starsFor({ cleared: true, shufflesUsed: 0, hintsUsed: 0, maxCombo: 2 })).toBe(2);
  });

  it('starsFor: perfect clear = 3', () => {
    expect(starsFor({ cleared: true, shufflesUsed: 0, hintsUsed: 0, maxCombo: 4 })).toBe(3);
  });
});
