/**
 * Adinkra Mahjong — core types and the single source of truth for tuning.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Every balance number in `docs/game-design.md` is a constant at the bottom of
 * this file. Gameplay code must never hard-code a tuning value: change it here,
 * change it once. The ranked list of levers lives in `docs/game-design.md` §9.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pure module: no DOM, no React, no `window`, no `localStorage`.
 */

/* ── primitives ─────────────────────────────────────────────────────── */
export type SymbolId = number; // 1..34
export type LayerIndex = number; // 0-based
export type TileKey = string; // `${layer}:${x}:${y}`
export type LayoutId = 'classic-turtle' | 'diamond' | 'ghana-star' | 'compact-mobile';
export type SymbolFamily = 'wisdom' | 'strength' | 'unity' | 'life';
export type ThemeName = 'light' | 'dark';
export type GameStatus = 'ready' | 'playing' | 'paused' | 'won' | 'no-moves';

/** Mastery rating for a cleared layout (design doc §4.4). */
export type StarRating = 0 | 1 | 2 | 3;

/** Layout difficulty, 1 = gentle … 4 = mastery (design doc §6). */
export type Difficulty = 1 | 2 | 3 | 4;

/** Which top-level screen the app shell is showing. */
export type ScreenName = 'landing' | 'game' | 'help' | 'settings';

/* ── content ────────────────────────────────────────────────────────── */
export interface Symbol {
  id: SymbolId;
  slug: string; // 'gye-nyame' — matches asset filename
  name: string; // 'Gye Nyame'
  family: SymbolFamily;
  meaning: string; // reference content (NOT canonical)
  svgAssetPath: string; // '../assets/symbols/gye-nyame.svg'
  accessibleLabel: string; // 'Gye Nyame, supremacy of God'
}

/* ── board ──────────────────────────────────────────────────────────── */
export interface BoardPosition {
  x: number;
  y: number;
  layer: LayerIndex;
}

export interface Tile extends BoardPosition {
  key: TileKey;
  symbolId: SymbolId;
  removed: boolean;
}

export interface LayoutDefinition {
  id: LayoutId;
  name: string;
  /** One-line description of the freedom profile, shown in the layout picker. */
  blurb: string;
  /** 1 = gentle … 4 = mastery. Drives presentation order, never game rules. */
  difficulty: Difficulty;
  cols: number;
  rows: number;
  layers: number; // number of layers
  maxLayer: LayerIndex; // layers - 1
  positions: BoardPosition[];
  tileCount: number; // always 136
}

/* ── moves & scoring ────────────────────────────────────────────────── */
export interface Move {
  keys: [TileKey, TileKey];
  symbolId: SymbolId;
  points: number;
  comboAfter: number; // combo count AFTER this move
  at: number; // epoch ms
}

/**
 * Every mutable scoring quantity. Restored verbatim by undo, so it must stay
 * a flat bag of scalars (design doc §7 / architecture §10.4).
 */
export interface ScoreState {
  score: number;
  /** Current consecutive-match streak (1 = first match of a chain). */
  combo: number;
  /** Peak streak reached this run — drives the ★★★ requirement. */
  maxCombo: number;
  /** Epoch ms of the previous match; 0 = no previous match. */
  lastMatchAt: number;
  /** Matches committed. */
  moves: number;
  hintsUsed: number;
  shufflesUsed: number;
  rescuesUsed: number;
  /** Symbols fully cleared (all 4 copies removed). */
  quadClears: number;
  /** Shared hint/shuffle currency (design doc §4.3). */
  charms: number;
}

/* ── undo ───────────────────────────────────────────────────────────── */
/**
 * One committed match, recorded so undo can be **exact**.
 *
 * The record stores the points the match *actually* awarded plus the scalars from
 * immediately before it. Undo then subtracts precisely what was added and
 * restores precisely what was there — no recomputation, so no drift, and no way
 * to refund a hint or shuffle penalty that happened after the match.
 *
 * See `docs/game-design.md` §7 and `docs/architecture.md` §10.4.
 */
export interface UndoRecord {
  keys: [TileKey, TileKey];
  symbolId: SymbolId;
  /** Points this match added, Flow multiplier and Quad Clear bonus included. */
  pointsAwarded: number;
  /** Charms this match actually granted (0 when the cap swallowed the award). */
  charmGain: number;
  /** Codex ids this match unlocked, so undo can re-lock them. */
  codexGained: SymbolId[];
  /** Scalars captured BEFORE the move, restored verbatim. */
  before: {
    combo: number;
    maxCombo: number;
    lastMatchAt: number;
    moves: number;
    elapsedSeconds: number;
  };
}

/* ── events (drive announcements + animations; state stays pure) ────── */
export type GameEvent =
  | { kind: 'select'; key: TileKey; symbolId: SymbolId }
  | { kind: 'deselect'; key: TileKey }
  | { kind: 'blocked'; key: TileKey }
  | { kind: 'invalid'; keys: [TileKey, TileKey] }
  | {
      kind: 'matched';
      keys: [TileKey, TileKey];
      symbolId: SymbolId;
      points: number;
      combo: number;
      quadCleared: boolean;
      codexUnlocked: boolean;
    }
  | { kind: 'hint'; keys: [TileKey, TileKey]; symbolId: SymbolId }
  | { kind: 'shuffle'; moved: number; failed: boolean }
  | { kind: 'rescue'; moved: number }
  | { kind: 'undo' }
  | { kind: 'won'; score: number; stars: StarRating }
  | { kind: 'no-moves' }
  | { kind: 'new-game'; layoutId: LayoutId }
  | { kind: 'restart'; layoutId: LayoutId }
  | { kind: 'paused' }
  | { kind: 'resumed' }
  | { kind: 'ignored' };

/* ── game state ─────────────────────────────────────────────────────── */
export interface GameState {
  status: GameStatus;
  layoutId: LayoutId;
  tiles: Record<TileKey, Tile>;
  selected: TileKey | null;
  remaining: number;
  score: ScoreState;
  elapsedSeconds: number;
  history: UndoRecord[]; // bounded undo stack
  hintKeys: [TileKey, TileKey] | null; // transient highlight
  seed: number; // deal seed (determinism / restore / future daily challenge)
  /** Unlocked Codex symbol ids, ascending (design doc §4.5). */
  codex: SymbolId[];
  /** The most recent event, plus a monotonic sequence number for the UI. */
  lastEvent: GameEvent | null;
  eventSeq: number;
}

/* ── settings / persistence ─────────────────────────────────────────── */
export interface Settings {
  sound: boolean;
  theme: ThemeName;
  layoutId: LayoutId;
  reduceMotion: boolean; // explicit user override
  /** Show the symbol name on each tile face. */
  showSymbolNames: boolean;
  /** Show the family colour chip on each tile. */
  showFamilyBadge: boolean;
}

/** Per-layout mastery record. */
export interface LayoutRecord {
  bestScore: number;
  stars: StarRating;
  clears: number;
  bestTimeSeconds: number | null;
}

export type LayoutRecords = Partial<Record<LayoutId, LayoutRecord>>;

/** Unlocked Codex symbol ids. */
export type CodexState = SymbolId[];

export interface SavedGame {
  version: number; // === SCHEMA_VERSION
  savedAt: number; // epoch ms
  state: GameState; // fully serialisable
}

export interface PersistedEnvelope<T> {
  version: number;
  data: T;
}

/* ── injectable storage (keeps storage.ts pure & testable) ──────────── */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/* ── audio ──────────────────────────────────────────────────────────── */
export type SoundName = 'select' | 'match' | 'error' | 'hint' | 'shuffle' | 'win' | 'lose';

export interface SoundEngine {
  init(): void; // must be called from a user gesture
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  play(name: SoundName, combo?: number): void;
}

/* ── selection result (returned by rules.select) ────────────────────── */
export type SelectResult =
  | { type: 'ignored' }
  | { type: 'blocked'; key: TileKey }
  | { type: 'selected'; key: TileKey }
  | { type: 'deselected'; key: TileKey }
  | { type: 'invalid'; first: TileKey; second: TileKey }
  | { type: 'matched'; keys: [TileKey, TileKey]; symbolId: SymbolId };

/* ═══════════════════════════════════════════════════════════════════════
 * TUNING CONSTANTS — single source of truth (design doc §12)
 * ═══════════════════════════════════════════════════════════════════════ */

/** Bumped whenever `GameState` changes shape; drives storage migration. */
export const SCHEMA_VERSION = 2;

export const TILES_PER_SYMBOL = 4;
export const SYMBOL_COUNT = 34;
export const TILE_COUNT = SYMBOL_COUNT * TILES_PER_SYMBOL; // 136

/* ── Flow: the combo chain (design doc §4.1) ────────────────────────── */
export const BASE_POINTS = 100;
/**
 * Lever #1 in the tuning table. 5 000 ms ≈ par pace (300 s ÷ 68 pairs ≈ 4.41 s),
 * so a player clearing on par is exactly a player holding Flow.
 */
export const COMBO_WINDOW_MS = 5000;
/** Streak at which the multiplier caps (×3). */
export const COMBO_MAX = 5;
/** Multiplier for streak n, index n-1. Beyond COMBO_MAX the last value holds. */
export const COMBO_MULTIPLIERS: readonly number[] = [1, 1.5, 2, 2.5, 3];

/* ── Quad Clear (design doc §4.2) ───────────────────────────────────── */
export const QUAD_CLEAR_BONUS = 200;

/* ── Charms: the hint/shuffle economy (design doc §4.3) ─────────────── */
export const CHARM_START = 3;
export const CHARM_MAX = 5;
export const HINT_PENALTY = 100;
export const SHUFFLE_PENALTY = 200;
export const RESCUE_SHUFFLE_PENALTY = 500;

/* ── Time bonus (design doc §5.1) ───────────────────────────────────── */
export const WIN_BONUS_PER_SEC = 10;
export const WIN_TARGET_SECONDS = 300;

/* ── Stars: the mastery ladder (design doc §4.4) ────────────────────── */
/** Peak streak required for ★★★ (4 → ×2.5). */
export const STAR3_MIN_COMBO = 4;

/* ── Engine limits ──────────────────────────────────────────────────── */
export const UNDO_LIMIT = 20; // bounded stack
export const SHUFFLE_MAX_ATTEMPTS = 60; // bounded retry
