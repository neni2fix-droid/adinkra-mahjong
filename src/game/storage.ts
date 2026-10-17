/**
 * Storage — versioned, injectable persistence.
 *
 * Three versioned keys (`SCHEMA_VERSION` namespaces them) hold the active game,
 * the player's settings, the per-layout record book and the Codex. Everything is
 * serialised to JSON through `StorageLike`, so the module is pure and testable
 * against a fake backend rather than `localStorage`.
 *
 * Migration is the only seam: when a stored blob's version differs from the
 * current one, {@link loadGame} routes it through {@link migrate}. On v2 there is
 * no prior schema in the wild (the game was never playable before this release),
 * so a version mismatch discards the game cleanly rather than silently loading a
 * shape we cannot trust.
 *
 * Pure module: no DOM, no React, no `window`.
 */
import { SCHEMA_VERSION } from './types';
import type {
  CodexState,
  GameState,
  LayoutId,
  LayoutRecords,
  PersistedEnvelope,
  Settings,
  StorageLike,
} from './types';

/**
 * Resolve the host `localStorage`, or `null` when it is unavailable (SSR, or a
 * browser that throws on access in private mode). Callers treat `null` as
 * "persistence disabled" and fall back to in-memory behaviour.
 */
export function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Namespaced, versioned storage keys. */
export const STORAGE_KEYS = {
  game: `adinkra-mahjong:v${SCHEMA_VERSION}:game`,
  settings: `adinkra-mahjong:v${SCHEMA_VERSION}:settings`,
  records: `adinkra-mahjong:v${SCHEMA_VERSION}:records`,
  codex: `adinkra-mahjong:v${SCHEMA_VERSION}:codex`,
} as const;

/** Defaults applied over any partial settings blob, so legacy/partial files parse. */
export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  theme: 'light',
  layoutId: 'classic-turtle',
  reduceMotion: false,
  showSymbolNames: true,
  showFamilyBadge: true,
};

/**
 * The single migration seam. Unknown versions throw; v1 (predating the live
 * release) is intentionally discarded — better an empty board than a corrupted
 * one.
 */
export function migrate(raw: PersistedEnvelope<unknown>, toVersion: number): unknown {
  if (raw.version === 1) {
    // No playable v1 ever shipped; drop the game, keep nothing game-stateful.
    throw new Error(`[adinkra] unsupported stored version ${raw.version}`);
  }
  if (raw.version === toVersion) return raw.data;
  throw new Error(`[adinkra] unsupported stored version ${raw.version}`);
}

/** Read and parse one key. Returns `null` on absence or any parse failure. */
function readJson<T>(backend: StorageLike, key: string): T | null {
  const raw = backend.getItem(key);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedEnvelope<T>;
    if (!parsed || typeof parsed !== 'object' || !('version' in parsed)) return null;
    if (parsed.version !== SCHEMA_VERSION) {
      try {
        migrate(parsed, SCHEMA_VERSION);
      } catch {
        return null;
      }
    }
    return parsed.data;
  } catch {
    return null;
  }
}

/** Serialise and write one key. */
function writeJson<T>(backend: StorageLike, key: string, data: T): void {
  const envelope: PersistedEnvelope<T> = { version: SCHEMA_VERSION, data };
  try {
    backend.setItem(key, JSON.stringify(envelope));
  } catch {
    // Disk full / quota / private mode — persistence is best-effort, never fatal.
  }
}

/* ── game ───────────────────────────────────────────────────────────── */

export function loadGame(backend: StorageLike): GameState | null {
  return readJson<GameState>(backend, STORAGE_KEYS.game);
}

export function saveGame(backend: StorageLike, state: GameState): void {
  writeJson(backend, STORAGE_KEYS.game, state);
}

export function clearGame(backend: StorageLike): void {
  try {
    backend.removeItem(STORAGE_KEYS.game);
  } catch {
    /* best-effort */
  }
}

/* ── settings ───────────────────────────────────────────────────────── */

export function loadSettings(backend: StorageLike): Settings {
  const stored = readJson<Partial<Settings>>(backend, STORAGE_KEYS.settings);
  if (!stored) return { ...DEFAULT_SETTINGS };
  // `undefined` fields fall back to defaults so new settings keys are non-breaking.
  return {
    sound: stored.sound ?? DEFAULT_SETTINGS.sound,
    theme: stored.theme ?? DEFAULT_SETTINGS.theme,
    layoutId: stored.layoutId ?? DEFAULT_SETTINGS.layoutId,
    reduceMotion: stored.reduceMotion ?? DEFAULT_SETTINGS.reduceMotion,
    showSymbolNames: stored.showSymbolNames ?? DEFAULT_SETTINGS.showSymbolNames,
    showFamilyBadge: stored.showFamilyBadge ?? DEFAULT_SETTINGS.showFamilyBadge,
  };
}

export function saveSettings(backend: StorageLike, settings: Settings): void {
  writeJson(backend, STORAGE_KEYS.settings, settings);
}

/* ── records & codex ────────────────────────────────────────────────── */

export function loadRecords(backend: StorageLike): LayoutRecords {
  return readJson<LayoutRecords>(backend, STORAGE_KEYS.records) ?? {};
}

export function saveRecords(backend: StorageLike, records: LayoutRecords): void {
  writeJson(backend, STORAGE_KEYS.records, records);
}

export function loadCodex(backend: StorageLike): CodexState {
  return readJson<CodexState>(backend, STORAGE_KEYS.codex) ?? [];
}

export function saveCodex(backend: StorageLike, codex: CodexState): void {
  writeJson(backend, STORAGE_KEYS.codex, codex);
}

/** Resolve a stored layout id, falling back to the default for stale values. */
export function normalizeLayoutId(value: LayoutId | undefined): LayoutId {
  const known: LayoutId[] = ['classic-turtle', 'diamond', 'ghana-star', 'compact-mobile'];
  return value && known.includes(value) ? value : 'classic-turtle';
}
