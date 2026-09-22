import { useCallback, useReducer } from 'react';
import { LAYOUT_BY_ID } from '../data/layouts';
import {
  applyHint,
  applyRescueShuffle,
  applySelect,
  applyShuffle,
  applyTick,
  applyUndo,
  clearHint,
  createGame,
  pauseGame,
  resumeGame,
  startNewGame,
} from '../game/state';
import type { GameState, LayoutDefinition, LayoutId, TileKey } from '../game/types';

type GameAction =
  | { type: 'new-game'; layoutId: LayoutId; seed?: number }
  | { type: 'restart'; layoutId: LayoutId; seed?: number }
  | { type: 'select'; key: TileKey; now: number }
  | { type: 'undo' }
  | { type: 'hint' }
  | { type: 'shuffle' }
  | { type: 'rescue' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'tick'; seconds: number }
  | { type: 'clear-hint' };

function getLayout(id: LayoutId): LayoutDefinition {
  return LAYOUT_BY_ID[id] ?? LAYOUT_BY_ID['classic-turtle'];
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'new-game': {
      const layout = getLayout(action.layoutId);
      const seed = action.seed ?? Date.now();
      return createGame(layout, seed);
    }
    case 'restart': {
      const layout = getLayout(action.layoutId);
      const seed = action.seed ?? Date.now();
      return startNewGame(state, layout, seed);
    }
    case 'select':
      return applySelect(state, action.key, action.now);
    case 'undo':
      return applyUndo(state);
    case 'hint':
      return applyHint(state);
    case 'shuffle':
      return applyShuffle(state);
    case 'rescue':
      return applyRescueShuffle(state);
    case 'pause':
      return pauseGame(state);
    case 'resume':
      return resumeGame(state);
    case 'tick':
      return applyTick(state, action.seconds);
    case 'clear-hint':
      return clearHint(state);
    default:
      return state;
  }
}

export function useGame(initialLayoutId: LayoutId = 'classic-turtle') {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => {
      const layout = getLayout(initialLayoutId);
      return createGame(layout, Date.now());
    },
  );

  const newGame = useCallback(
    (layoutId: LayoutId, seed?: number) => dispatch({ type: 'new-game', layoutId, seed }),
    [],
  );
  const restart = useCallback(
    (layoutId: LayoutId, seed?: number) => dispatch({ type: 'restart', layoutId, seed }),
    [],
  );
  const select = useCallback(
    (key: TileKey) => dispatch({ type: 'select', key, now: Date.now() }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const hint = useCallback(() => dispatch({ type: 'hint' }), []);
  const shuffle = useCallback(() => dispatch({ type: 'shuffle' }), []);
  const rescue = useCallback(() => dispatch({ type: 'rescue' }), []);
  const pause = useCallback(() => dispatch({ type: 'pause' }), []);
  const resume = useCallback(() => dispatch({ type: 'resume' }), []);
  const tick = useCallback(
    (seconds: number) => dispatch({ type: 'tick', seconds }),
    [],
  );
  const clearHintAction = useCallback(() => dispatch({ type: 'clear-hint' }), []);

  return {
    state,
    actions: {
      newGame,
      restart,
      select,
      undo,
      hint,
      shuffle,
      rescue,
      pause,
      resume,
      tick,
      clearHint: clearHintAction,
    },
  };
}
