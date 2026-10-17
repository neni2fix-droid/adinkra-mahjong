import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LAYOUT_BY_ID } from '../../data/layouts';
import { createGame } from '../../game/state';
import { getBrowserStorage, loadCodex, loadGame, saveGame } from '../../game/storage';
import { usePersistentGame } from '../usePersistentGame';

describe('usePersistentGame', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('restores a previously saved game on first render', () => {
    saveGame(window.localStorage, createGame(LAYOUT_BY_ID['diamond'], 7));

    const { result } = renderHook(() => usePersistentGame('classic-turtle'));

    expect(result.current.state.seed).toBe(7);
    expect(result.current.state.layoutId).toBe('diamond');
  });

  it('persists the active game after a change (debounced)', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePersistentGame('classic-turtle'));

    act(() => {
      result.current.actions.newGame('ghana-star');
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(loadGame(getBrowserStorage()!)?.layoutId).toBe('ghana-star');
  });

  it('carries the persisted Codex into a fresh game', () => {
    saveGame(window.localStorage, createGame(LAYOUT_BY_ID['classic-turtle'], 1, [2, 9]));

    const { result } = renderHook(() => usePersistentGame('classic-turtle'));
    expect(result.current.state.codex).toEqual([2, 9]);

    act(() => {
      result.current.actions.newGame('classic-turtle');
    });
    expect(result.current.state.codex).toEqual([2, 9]);
    expect(loadCodex(getBrowserStorage()!)).toEqual([2, 9]);
  });
});
