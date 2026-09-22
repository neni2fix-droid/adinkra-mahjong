import { useCallback, useRef, useState } from 'react';

export function useAnnouncer() {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') setAssertive(message);
    else setPolite(message);

    const t = setTimeout(() => {
      if (priority === 'assertive') setAssertive('');
      else setPolite('');
    }, 3000);
    timers.current.push(t);
  }, []);

  return { polite, assertive, announce };
}
