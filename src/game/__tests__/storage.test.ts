import { describe, expect, it } from 'vitest';
import {
  clearGame,
  getBrowserStorage,
  loadCodex,
  loadGame,
  loadRecords,
  loadSettings,
  saveCodex,
  saveGame,
  saveRecords,
  saveSettings,
  STORAGE_KEYS,
} from '../storage';
import type { GameState, StorageLike } from '../types';

function memoryStorage(): StorageLike {
  const store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
  };
}

describe('storage', () => {
  it('memoryStorage round-trips', () => {
    const mem = memoryStorage();
    mem.setItem('x', 'hello');
    expect(mem.getItem('x')).toBe('hello');
    mem.removeItem('x');
    expect(mem.getItem('x')).toBeNull();
  });

  it('loadSettings returns defaults when empty', () => {
    const mem = memoryStorage();
    const s = loadSettings(mem);
    expect(s.theme).toBe('light');
    expect(s.layoutId).toBe('classic-turtle');
    expect(s.sound).toBe(true);
  });

  it('saveSettings then loadSettings round-trips', () => {
    const mem = memoryStorage();
    const settings = loadSettings(mem);
    const next = { ...settings, theme: 'dark' as const, sound: false };
    saveSettings(mem, next);
    const loaded = loadSettings(mem);
    expect(loaded.theme).toBe('dark');
    expect(loaded.sound).toBe(false);
  });

  it('saveGame and loadGame round-trip', () => {
    const mem = memoryStorage();
    const state: GameState = {
      status: 'playing',
      layoutId: 'classic-turtle',
      tiles: {},
      selected: null,
      remaining: 136,
      score: {
        score: 0, combo: 0, maxCombo: 0, lastMatchAt: 0, moves: 0,
        hintsUsed: 0, shufflesUsed: 0, rescuesUsed: 0, quadClears: 0, charms: 3,
      },
      elapsedSeconds: 0,
      history: [],
      hintKeys: null,
      seed: 1,
      codex: [],
      stars: 0,
      lastEvent: null,
      eventSeq: 0,
    };
    saveGame(mem, state);
    const loaded = loadGame(mem);
    expect(loaded).not.toBeNull();
    expect(loaded!.status).toBe('playing');
    expect(loaded!.remaining).toBe(136);
  });

  it('clearGame removes saved game', () => {
    const mem = memoryStorage();
    const state: GameState = {
      status: 'playing',
      layoutId: 'classic-turtle',
      tiles: {},
      selected: null,
      remaining: 136,
      score: {
        score: 0, combo: 0, maxCombo: 0, lastMatchAt: 0, moves: 0,
        hintsUsed: 0, shufflesUsed: 0, rescuesUsed: 0, quadClears: 0, charms: 3,
      },
      elapsedSeconds: 0,
      history: [],
      hintKeys: null,
      seed: 1,
      codex: [],
      stars: 0,
      lastEvent: null,
      eventSeq: 0,
    };
    saveGame(mem, state);
    clearGame(mem);
    expect(loadGame(mem)).toBeNull();
  });

  it('records round-trip', () => {
    const mem = memoryStorage();
    const records = { 'classic-turtle': { bestScore: 5000, stars: 2 as const, clears: 3, bestTimeSeconds: 120 } };
    saveRecords(mem, records);
    const loaded = loadRecords(mem);
    expect(loaded['classic-turtle']?.bestScore).toBe(5000);
  });

  it('codex round-trip', () => {
    const mem = memoryStorage();
    saveCodex(mem, [1, 5, 10]);
    expect(loadCodex(mem)).toEqual([1, 5, 10]);
  });

  it('ignores corrupt JSON gracefully', () => {
    const mem = memoryStorage();
    mem.setItem(STORAGE_KEYS.settings, 'not-json');
    const s = loadSettings(mem);
    expect(s.theme).toBe('light');
  });

  it('discards a game stored under a stale schema version', () => {
    const mem = memoryStorage();
    mem.setItem(
      'adinkra-mahjong:v2:game',
      JSON.stringify({ version: 2, data: { status: 'playing' } }),
    );
    expect(loadGame(mem)).toBeNull();
  });

  it('getBrowserStorage returns localStorage in a DOM environment', () => {
    expect(getBrowserStorage()).toBe(window.localStorage);
  });
});
