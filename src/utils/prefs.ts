/**
 * Non-sensitive UI preferences only. Workspace content never goes in
 * localStorage. Every access is guarded because storage can be blocked.
 */
const PREFIX = 'setu-aur:';

export function getPref(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function setPref(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, value);
  } catch {
    /* preference simply not remembered */
  }
}
