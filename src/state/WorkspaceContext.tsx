import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { deleteWorkspace, loadWorkspace, saveWorkspace, storeBackup } from '../db/indexedDb';
import type { Workspace } from '../models/schema';
import { createWorkspace } from '../models/workspace';
import { nowIso } from '../utils/dates';
import { serializeWorkspace } from '../utils/exportJson';

export const AUTOSAVE_DELAY_MS = 750;

export type SaveState = 'saved' | 'pending' | 'saving' | 'error';

interface WorkspaceContextValue {
  workspace: Workspace;
  saveState: SaveState;
  saveError?: string;
  lastSavedAt?: string;
  /** Apply a change; it is autosaved after a short pause. */
  update: (fn: (ws: Workspace) => Workspace) => void;
  /** Replace the whole workspace (import, sample data). The previous one is kept as an internal backup. */
  replace: (ws: Workspace, reason: string) => Promise<void>;
  /** Delete the stored workspace and start an empty one. */
  reset: () => Promise<void>;
  /** Save immediately. */
  flush: () => Promise<void>;
}

const Ctx = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return v;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState<string>();
  const [lastSavedAt, setLastSavedAt] = useState<string>();
  const latest = useRef<Workspace | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const dirty = useRef(false);

  const persist = useCallback(async () => {
    clearTimeout(timer.current);
    const ws = latest.current;
    if (!ws || !dirty.current) return;
    dirty.current = false;
    setSaveState('saving');
    try {
      await saveWorkspace(ws);
      // A change made while saving leaves us dirty again; that save is already scheduled.
      if (!dirty.current) {
        setSaveState('saved');
        setSaveError(undefined);
        setLastSavedAt(nowIso());
      }
    } catch (e) {
      dirty.current = true;
      setSaveState('error');
      setSaveError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadWorkspace()
      .then(async (stored) => {
        if (cancelled) return;
        const ws = stored ?? createWorkspace();
        latest.current = ws;
        setWorkspace(ws);
        if (!stored) {
          dirty.current = true;
          await persist();
        }
      })
      .catch((e: Error) => {
        if (cancelled) return;
        const ws = createWorkspace();
        latest.current = ws;
        dirty.current = true;
        setWorkspace(ws);
        setSaveState('error');
        setSaveError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [persist]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const update = useCallback(
    (fn: (ws: Workspace) => Workspace) => {
      const prev = latest.current;
      if (!prev) return;
      const next = fn(prev);
      if (next === prev) return;
      const stamped = { ...next, updatedAt: nowIso() };
      latest.current = stamped;
      dirty.current = true;
      setWorkspace(stamped);
      setSaveState((s) => (s === 'error' ? s : 'pending'));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void persist(), AUTOSAVE_DELAY_MS);
    },
    [persist],
  );

  const replace = useCallback(
    async (ws: Workspace, reason: string) => {
      if (latest.current) await storeBackup(serializeWorkspace(latest.current), reason);
      latest.current = ws;
      dirty.current = true;
      setWorkspace(ws);
      await persist();
    },
    [persist],
  );

  const reset = useCallback(async () => {
    clearTimeout(timer.current);
    await deleteWorkspace();
    const ws = createWorkspace();
    latest.current = ws;
    dirty.current = true;
    setWorkspace(ws);
    await persist();
  }, [persist]);

  const value = useMemo<WorkspaceContextValue | null>(
    () =>
      workspace
        ? { workspace, saveState, saveError, lastSavedAt, update, replace, reset, flush: persist }
        : null,
    [workspace, saveState, saveError, lastSavedAt, update, replace, reset, persist],
  );

  if (!value) {
    return (
      <p className="loading" role="status">
        Loading workspace…
      </p>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
