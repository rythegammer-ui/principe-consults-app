import { useSyncExternalStore } from 'react';

const getSnapshot = (breakpoint) => () =>
  typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches;

const getServerSnapshot = () => false;

const subscribe = (breakpoint) => (onChange) => {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

export function useIsMobile(breakpoint = 768) {
  return useSyncExternalStore(subscribe(breakpoint), getSnapshot(breakpoint), getServerSnapshot);
}
