import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import '../playful.css';

type Theme = 'sunny' | 'dusk' | 'night';
interface Preferences { theme: Theme; paused: boolean }
const preferenceKey = 'where-to-go:ambience:v1';
const themes: readonly [Theme, string][] = [['sunny', '晴日'], ['dusk', '暮色'], ['night', '夜游']];

function readPreferences(): Preferences {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(preferenceKey) ?? 'null');
    if (value && typeof value === 'object' && 'theme' in value && 'paused' in value &&
      themes.some(([theme]) => theme === value.theme) && typeof value.paused === 'boolean') {
      return value as Preferences;
    }
  } catch { /* Privacy restrictions and malformed preferences use local defaults. */ }
  return { theme: 'sunny', paused: false };
}

export function AmbientBackground({ isSpinning = false }: { isSpinning?: boolean }) {
  const [preferences, setPreferences] = useState(readPreferences);
  const query = useMemo(() => typeof window === 'undefined'
    ? undefined : window.matchMedia?.('(prefers-reduced-motion: reduce)'), []);
  const subscribe = useCallback((listener: () => void) => {
    query?.addEventListener?.('change', listener);
    return () => query?.removeEventListener?.('change', listener);
  }, [query]);
  const getSnapshot = useCallback(() => query?.matches ?? false, [query]);
  const reducedMotion = useSyncExternalStore(subscribe, getSnapshot, () => false);

  useEffect(() => {
    try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); }
    catch { /* The controls remain usable without persistent storage. */ }
  }, [preferences]);

  return (
    <>
      <div className="ambient" data-ambient="" data-theme={preferences.theme}
        data-motion={preferences.paused || reducedMotion ? 'paused' : 'running'}
        data-spinning={isSpinning} aria-hidden="true">
        {['8%', '71%', '3%', '84%', '17%', '92%', '54%'].map((left, index) => (
          <i key={index} style={{ left, top: `${8 + index * 12}%`, animationDelay: `${-index * 3}s` }}>
            {index > 3 ? '✦' : ''}
          </i>
        ))}
      </div>
      <div className="ambient-controls" role="group" aria-label="周末氛围">
        {themes.map(([theme, label]) => (
          <button className="chip" type="button" key={theme} aria-label={label}
            aria-pressed={preferences.theme === theme}
            onClick={() => setPreferences((current) => ({ ...current, theme }))}>{label}</button>
        ))}
        <button className="chip" type="button" aria-pressed={preferences.paused}
          onClick={() => setPreferences((current) => ({ ...current, paused: !current.paused }))}>
          {preferences.paused ? '继续动态' : '暂停动态'}
        </button>
        {reducedMotion && <small>已跟随系统减少动态</small>}
      </div>
    </>
  );
}
