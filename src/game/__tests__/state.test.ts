import { describe, expect, it } from 'vitest';
import { LAYOUT_BY_ID } from '../../data/layouts';
import { maxLayerOf } from '../board';
import { findMatch } from '../rules';
import {
  applyHint,
  applySelect,
  applyShuffle,
  applyUndo,
  canHint,
  canUndo,
  createGame,
  evaluateStatus,
} from '../state';

describe('state', () => {
  const layout = LAYOUT_BY_ID['classic-turtle'];

  it('createGame produces a playing state with 136 tiles', () => {
    const state = createGame(layout, 1);
    expect(state.status).toBe('playing');
    expect(state.remaining).toBe(136);
    expect(state.selected).toBeNull();
    expect(state.history).toHaveLength(0);
  });

  it('applySelect + match removes tiles and adds undo record', () => {
    let state = createGame(layout, 2);
    const match = findMatch(state.tiles, maxLayerOf(state.tiles));
    expect(match).not.toBeNull();
    if (!match) return;

    state = applySelect(state, match[0], Date.now());
    expect(state.selected).toBe(match[0]);

    state = applySelect(state, match[1], Date.now() + 100);
    expect(state.selected).toBeNull();
    expect(state.remaining).toBe(134);
    expect(state.history).toHaveLength(1);
    expect(state.score.moves).toBe(1);
  });

  it('applyUndo restores tiles, score, combo, moves, timer', () => {
    let state = createGame(layout, 3);
    const match = findMatch(state.tiles, maxLayerOf(state.tiles));
    expect(match).not.toBeNull();
    if (!match) return;

    const beforeScore = state.score.score;
    const beforeCombo = state.score.combo;
    const beforeMoves = state.score.moves;

    state = applySelect(state, match[0], Date.now());
    state = applySelect(state, match[1], Date.now() + 100);
    expect(state.remaining).toBe(134);

    state = applyUndo(state);
    expect(state.remaining).toBe(136);
    expect(state.score.score).toBe(beforeScore);
    expect(state.score.combo).toBe(beforeCombo);
    expect(state.score.moves).toBe(beforeMoves);
    expect(state.history).toHaveLength(0);
  });

  it('canHint is true when charms > 0 and moves exist', () => {
    const state = createGame(layout, 4);
    expect(canHint(state)).toBe(true);
  });

  it('canUndo is false on a fresh game', () => {
    const state = createGame(layout, 5);
    expect(canUndo(state)).toBe(false);
  });

  it('evaluateStatus is playing on a fresh board', () => {
    const state = createGame(layout, 6);
    expect(evaluateStatus(state)).toBe('playing');
  });

  it('applyHint costs a charm and sets hintKeys', () => {
    let state = createGame(layout, 7);
    const beforeCharms = state.score.charms;
    state = applyHint(state);
    expect(state.score.charms).toBe(beforeCharms - 1);
    expect(state.hintKeys).not.toBeNull();
  });

  it('applyShuffle preserves tile count', () => {
    let state = createGame(layout, 8);
    const before = state.remaining;
    state = applyShuffle(state);
    expect(state.remaining).toBe(before);
  });
});
