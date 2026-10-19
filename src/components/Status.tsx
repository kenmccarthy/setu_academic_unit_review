import type { ReactNode } from 'react';

export type Tone = 'neutral' | 'info' | 'good' | 'warn' | 'bad';

const SYMBOL: Record<Tone, string> = { neutral: '○', info: '◐', good: '●', warn: '▲', bad: '✕' };

/** Status text always appears alongside a shape, so meaning never depends on colour. */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span aria-hidden="true">{SYMBOL[tone]} </span>
      {children}
    </span>
  );
}

export function Notice({
  tone = 'info',
  title,
  children,
  role,
}: {
  tone?: 'info' | 'warn' | 'error' | 'draft';
  title?: string;
  children?: ReactNode;
  role?: 'status' | 'alert';
}) {
  return (
    <div className={`notice notice-${tone}`} role={role}>
      {title && <p className="notice-title">{title}</p>}
      {children}
    </div>
  );
}

export const workflowTone = {
  not_started: 'neutral',
  draft: 'info',
  ready_for_review: 'warn',
  complete: 'good',
} as const satisfies Record<string, Tone>;

export const confidenceTone = {
  not_assessed: 'neutral',
  strong: 'good',
  partial: 'info',
  gap: 'bad',
} as const satisfies Record<string, Tone>;

export const evidenceTone = {
  available: 'good',
  requested: 'info',
  missing: 'bad',
  outdated: 'warn',
} as const satisfies Record<string, Tone>;

export const milestoneTone = {
  not_started: 'neutral',
  in_progress: 'info',
  completed: 'good',
  blocked: 'bad',
} as const satisfies Record<string, Tone>;
