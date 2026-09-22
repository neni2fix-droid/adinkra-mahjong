import { useCallback, useEffect, useRef, useState } from 'react';
import { LAYOUT_BY_ID } from './data/layouts';
import { loadSettings, saveSettings } from './game/storage';
import type { GameEvent, LayoutId } from './game/types';
import Footer from './components/Footer';
import GameBoard from './components/GameBoard';
import GameStats from './components/GameStats';
import Help from './components/Help';
import Landing from './components/Landing';
import LiveRegion from './components/LiveRegion';
import NoMovesModal from './components/NoMovesModal';
import PauseOverlay from './components/PauseOverlay';
import SettingsPanel from './components/SettingsPanel';
import Toolbar from './components/Toolbar';
import WinModal from './components/WinModal';
import { useAnnouncer } from './hooks/useAnnouncer';
import { useGame } from './hooks/useGame';
import { useSound } from './hooks/useSound';
import { useTheme } from './hooks/useTheme';
import { useTimer } from './hooks/useTimer';

type Screen = 'landing' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [layoutId, setLayoutId] = useState<LayoutId>(() => {
    if (typeof window === 'undefined') return 'classic-turtle';
    return loadSettings(window.localStorage).layoutId;
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const { state, actions } = useGame(layoutId);
  const { theme, toggle: toggleTheme } = useTheme();
  const { muted: soundMuted, init: initSound, play, toggle: toggleSound } = useSound();
  const { polite, assertive, announce } = useAnnouncer();
  const { seconds, reset: resetTimer } = useTimer(state.status === 'playing');

  const prevEventRef = useRef<GameEvent | null>(null);
  const initializedRef = useRef(false);

  const handleInteraction = useCallback(() => {
    if (!initializedRef.current) {
      initSound();
      initializedRef.current = true;
    }
  }, [initSound]);

  useEffect(() => {
    const ev = state.lastEvent;
    if (!ev || ev === prevEventRef.current) return;
    prevEventRef.current = ev;

    switch (ev.kind) {
      case 'matched':
        announce(`Matched. Combo ${ev.combo}.`);
        play('match', ev.combo);
        break;
      case 'blocked':
        announce('That tile is blocked.', 'assertive');
        play('error');
        break;
      case 'invalid':
        announce('No match. Flow broken.', 'assertive');
        play('error');
        break;
      case 'hint':
        announce('Hint shown.');
        play('hint');
        break;
      case 'shuffle':
        announce(ev.failed ? 'Shuffle failed.' : 'Board shuffled.');
        play('shuffle');
        break;
      case 'undo':
        announce('Undo.');
        break;
      case 'won':
        announce(`You win! Score ${ev.score}. ${ev.stars} stars.`, 'assertive');
        play('win');
        break;
      case 'no-moves':
        announce('No moves left.', 'assertive');
        play('lose');
        break;
      case 'select':
        play('select');
        break;
    }
  }, [state.lastEvent, state.eventSeq, announce, play]);

  useEffect(() => {
    if (state.status === 'playing') {
      actions.tick(1);
    }
  }, [seconds, state.status, actions]);

  const startGame = useCallback(() => {
    handleInteraction();
    setScreen('game');
    actions.newGame(layoutId);
    resetTimer();
  }, [handleInteraction, layoutId, actions, resetTimer]);

  const handleNewGame = useCallback(() => {
    actions.newGame(layoutId);
    resetTimer();
  }, [actions, layoutId, resetTimer]);

  const handleSelect = useCallback(
    (key: string) => {
      handleInteraction();
      actions.select(key);
    },
    [actions, handleInteraction],
  );

  const layout = LAYOUT_BY_ID[layoutId] ?? LAYOUT_BY_ID['classic-turtle'];

  if (screen === 'landing') {
    return (
      <>
        <Landing onPlay={startGame} />
        <LiveRegion polite={polite} assertive={assertive} />
      </>
    );
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <LiveRegion polite={polite} assertive={assertive} />

      <div className="sticky top-0 z-40 border-b border-ink-faint/10 bg-parchment/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-1 py-2">
          <h1 className="font-display text-xl font-bold text-ink">
            <span className="text-accent-red">Adinkra</span> Mahjong
          </h1>
          <GameStats state={state} />
          <Toolbar
            state={state}
            onNewGame={handleNewGame}
            onUndo={actions.undo}
            onHint={actions.hint}
            onShuffle={actions.shuffle}
            onPause={actions.pause}
            onHelp={() => setHelpOpen(true)}
            onSettings={() => setSettingsOpen(true)}
            soundMuted={soundMuted}
            onToggleSound={toggleSound}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>
      </div>

      <main className="flex-1 overflow-auto py-4">
        <GameBoard state={state} layout={layout} onSelect={handleSelect} />
      </main>

      <Footer />

      <PauseOverlay
        open={state.status === 'paused'}
        onResume={actions.resume}
        onNewGame={handleNewGame}
      />

      <WinModal
        open={state.status === 'won'}
        score={state.score.score}
        timeSeconds={state.elapsedSeconds}
        stars={0}
        onPlayAgain={handleNewGame}
      />

      <NoMovesModal
        open={state.status === 'no-moves'}
        onRescue={actions.rescue}
        onNewGame={handleNewGame}
      />

      <Help open={helpOpen} onClose={() => setHelpOpen(false)} />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        layoutId={layoutId}
        onChangeLayout={(id) => {
          setLayoutId(id);
          if (typeof window !== 'undefined') {
            const s = loadSettings(window.localStorage);
            saveSettings(window.localStorage, { ...s, layoutId: id });
          }
        }}
        reduceMotion={reduceMotion}
        onChangeMotion={setReduceMotion}
      />
    </div>
  );
}
