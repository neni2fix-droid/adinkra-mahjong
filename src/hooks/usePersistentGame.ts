import { useEffect, useMemo, useRef, useState } from 'react';
import { recordRun } from '../game/scoring';
import {
  getBrowserStorage,
  loadCodex,
  loadGame,
  loadRecords,
  saveCodex,
  saveGame,
  saveRecords,
} from '../game/storage';
import type { LayoutId, LayoutRecords } from '../game/types';
import { useGame } from './useGame';

/**
 * `useGame` + persistence.
 *
 * Wraps the pure reducer with the four versioned storage keys from `storage.ts`:
 *
 *  - **active game** — restored on boot, saved (debounced) on every change, so a
 *    refresh resumes exactly where the player left off;
 *  - **Codex** — loaded first so a fresh deal inherits unlocked symbols, and
 *    saved whenever it grows;
 *  - **record book** — folded forward once per clear via `recordRun`.
 *
 * Every storage touch is best-effort: when `localStorage` is unavailable
 * (SSR / private mode) the hook degrades to plain in-memory play.
 */
export function usePersistentGame(initialLayoutId: LayoutId = 'classic-turtle') {
  const storage = useMemo(() => getBrowserStorage(), []);

  // Read the persisted blobs once, before the reducer's lazy initialiser runs.
  const restored = useMemo(() => (storage ? loadGame(storage) : null), [storage]);
  const initialCodex = useMemo(() => (storage ? loadCodex(storage) : []), [storage]);

  const { state, actions } = useGame(initialLayoutId, { restored, codex: initialCodex });

  const [records, setRecords] = useState<LayoutRecords>(() =>
    storage ? loadRecords(storage) : {},
  );

  // Persist the active game, debounced so the 1 s timer tick is not a write/sec.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!storage) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveGame(storage, state), 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [storage, state]);

  // Persist the Codex whenever it changes.
  useEffect(() => {
    if (!storage) return;
    saveCodex(storage, state.codex);
  }, [storage, state.codex]);

  // Fold each finished run into the record book exactly once.
  const recordedSeq = useRef(-1);
  useEffect(() => {
    if (!storage) return;
    if (state.status !== 'won') return;
    if (state.eventSeq === recordedSeq.current) return;
    recordedSeq.current = state.eventSeq;

    setRecords((previous) => {
      const next = recordRun(previous, state.layoutId, {
        score: state.score.score,
        stars: state.stars,
        elapsedSeconds: state.elapsedSeconds,
      });
      saveRecords(storage, next);
      return next;
    });
  }, [storage, state.status, state.eventSeq, state.layoutId, state.score.score, state.stars, state.elapsedSeconds]);

  return { state, actions, records };
}
