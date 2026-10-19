import Dexie, { type Table } from 'dexie';
import { WorkspaceSchema, type Workspace } from '../models/schema';

interface WorkspaceRow {
  key: string;
  data: Workspace;
}

interface BackupRow {
  id?: number;
  createdAt: string;
  reason: string;
  raw: string;
}

class AurDatabase extends Dexie {
  workspaces!: Table<WorkspaceRow, string>;
  backups!: Table<BackupRow, number>;

  constructor() {
    super('setu-aur-prototype');
    this.version(1).stores({ workspaces: 'key', backups: '++id, createdAt' });
  }
}

const CURRENT = 'current';
let db: AurDatabase | null = null;

function getDb(): AurDatabase {
  if (!db) db = new AurDatabase();
  return db;
}

export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
  }
}

function describe(e: unknown): string {
  const name = (e as { name?: string })?.name ?? '';
  if (name === 'QuotaExceededError' || /quota/i.test(String(e)))
    return 'Browser storage is full (quota exceeded). Download a backup and free space.';
  if (name === 'MissingAPIError' || name === 'InvalidStateError' || name === 'SecurityError')
    return 'Browser storage is unavailable (private mode or blocked site data). Changes cannot be saved.';
  return `Saving failed: ${(e as Error)?.message ?? String(e)}`;
}

export async function loadWorkspace(): Promise<Workspace | null> {
  try {
    const row = await getDb().workspaces.get(CURRENT);
    if (!row) return null;
    const parsed = WorkspaceSchema.safeParse(row.data);
    if (!parsed.success) {
      throw new StorageError('The stored workspace could not be read (it does not match the expected format).');
    }
    return parsed.data;
  } catch (e) {
    if (e instanceof StorageError) throw e;
    throw new StorageError(describe(e), e);
  }
}

export async function saveWorkspace(ws: Workspace): Promise<void> {
  try {
    await getDb().workspaces.put({ key: CURRENT, data: ws });
  } catch (e) {
    throw new StorageError(describe(e), e);
  }
}

export async function deleteWorkspace(): Promise<void> {
  try {
    await getDb().workspaces.delete(CURRENT);
  } catch (e) {
    throw new StorageError(describe(e), e);
  }
}

/** Keep a raw copy of data before a migration or replacement, so nothing is destroyed silently. */
export async function storeBackup(raw: string, reason: string): Promise<void> {
  try {
    const t = getDb().backups;
    await t.add({ createdAt: new Date().toISOString(), reason, raw });
    // Keep the five most recent internal backups.
    const keys = await t.orderBy('createdAt').primaryKeys();
    if (keys.length > 5) await t.bulkDelete(keys.slice(0, keys.length - 5));
  } catch (e) {
    throw new StorageError(describe(e), e);
  }
}

export async function listBackups(): Promise<BackupRow[]> {
  try {
    return (await getDb().backups.orderBy('createdAt').reverse().toArray());
  } catch {
    return [];
  }
}

export async function clearBackups(): Promise<void> {
  await getDb().backups.clear();
}
