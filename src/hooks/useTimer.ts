import { useCallback, useEffect, useRef, useState } from 'react';

export function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      ref.current += 1;
      setSeconds(ref.current);
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  const reset = useCallback(() => {
    ref.current = 0;
    setSeconds(0);
  }, []);

  const set = useCallback((s: number) => {
    ref.current = s;
    setSeconds(s);
  }, []);

  return { seconds, reset, set };
}
