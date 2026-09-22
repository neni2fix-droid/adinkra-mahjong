import { useCallback, useRef, useState } from 'react';
import { createSoundEngine } from '../game/audio';
import type { SoundEngine, SoundName } from '../game/types';

export function useSound() {
  const engineRef = useRef<SoundEngine>(createSoundEngine());
  const [muted, setMuted] = useState(false);

  const init = useCallback(() => {
    engineRef.current.init();
  }, []);

  const play = useCallback((name: SoundName, combo = 0) => {
    engineRef.current.play(name, combo);
  }, []);

  const toggle = useCallback(() => {
    const next = !engineRef.current.isMuted();
    engineRef.current.setMuted(next);
    setMuted(next);
  }, []);

  const setMutedState = useCallback((m: boolean) => {
    engineRef.current.setMuted(m);
    setMuted(m);
  }, []);

  return { muted, init, play, toggle, setMuted: setMutedState };
}
