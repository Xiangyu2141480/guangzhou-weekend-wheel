import { YUWAN_ALT, YUWAN_SOURCES, type YuwanState } from '../constants/mascot';

export type YuwanMascotSize = 'sm' | 'md' | 'lg';

interface YuwanMascotProps {
  state: YuwanState;
  alt?: string;
  className?: string;
  size?: YuwanMascotSize;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}

function resolveState(state: YuwanState): YuwanState {
  return Object.hasOwn(YUWAN_SOURCES, state) ? state : 'idle';
}

export function YuwanMascot({
  state,
  alt,
  className = '',
  size = 'md',
  loading = 'lazy',
  fetchPriority = 'low',
}: YuwanMascotProps) {
  const resolvedState = resolveState(state);
  return (
    <img
      className={`yuwan-mascot dog-mascot yuwan-mascot--${size} ${className}`.trim()}
      src={YUWAN_SOURCES[resolvedState]}
      alt={alt ?? YUWAN_ALT[resolvedState]}
      data-mascot-state={resolvedState}
      width={512}
      height={512}
      decoding="async"
      loading={loading}
      fetchPriority={fetchPriority}
      draggable={false}
    />
  );
}
