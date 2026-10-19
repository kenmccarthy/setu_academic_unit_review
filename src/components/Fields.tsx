import { useId, type ReactNode } from 'react';

interface BaseProps {
  label: string;
  hint?: ReactNode;
  className?: string;
}

function Hint({ id, children }: { id: string; children?: ReactNode }) {
  return children ? (
    <p id={id} className="hint">
      {children}
    </p>
  ) : null;
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  type = 'text',
  className,
  required,
  autoFocus,
}: BaseProps & {
  value: string | undefined;
  onChange: (v: string) => void;
  type?: 'text' | 'date' | 'url' | 'search';
  required?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <div className={`field ${className ?? ''}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req"> (required)</span>}
      </label>
      <Hint id={`${id}-hint`}>{hint}</Hint>
      <input
        id={id}
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        required={required}
        autoFocus={autoFocus}
      />
    </div>
  );
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 4,
  className,
}: BaseProps & { value: string | undefined; onChange: (v: string) => void; rows?: number }) {
  const id = useId();
  const words = (value ?? '').trim() ? (value ?? '').trim().split(/\s+/).length : 0;
  return (
    <div className={`field ${className ?? ''}`}>
      <label htmlFor={id}>{label}</label>
      <Hint id={`${id}-hint`}>{hint}</Hint>
      <textarea
        id={id}
        rows={rows}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={[hint ? `${id}-hint` : '', `${id}-count`].filter(Boolean).join(' ')}
      />
      <p id={`${id}-count`} className="word-count">
        {words} {words === 1 ? 'word' : 'words'}
      </p>
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
  className,
}: BaseProps & {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[] | readonly { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <div className={`field ${className ?? ''}`}>
      <label htmlFor={id}>{label}</label>
      <Hint id={`${id}-hint`}>{hint}</Hint>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-describedby={hint ? `${id}-hint` : undefined}
      >
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function labelled<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((value) => ({ value, label: labels[value] }));
}

export function Checkbox({
  label,
  checked,
  onChange,
  hint,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="checkbox">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <label htmlFor={id}>{label}</label>
      {hint && (
        <span id={`${id}-hint`} className="hint">
          {hint}
        </span>
      )}
    </div>
  );
}
