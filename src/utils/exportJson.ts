import { ZodError } from 'zod';
import {
  ExportEnvelopeSchema,
  SCHEMA_VERSION,
  WorkspaceSchema,
  type ExportEnvelope,
  type Workspace,
} from '../models/schema';
import { enforceIntegrity } from '../models/workspace';
import { nowIso } from './dates';

export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export function toExportEnvelope(ws: Workspace): ExportEnvelope {
  return {
    format: 'setu-aur-workspace',
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: nowIso(),
    workspace: ws,
  };
}

export function serializeWorkspace(ws: Workspace): string {
  return JSON.stringify(toExportEnvelope(ws), null, 2);
}

export class ImportError extends Error {}

export interface ImportResult {
  workspace: Workspace;
  warnings: string[];
  /** Set when the file needed migrating; the caller stores it as a backup. */
  migratedFrom?: number;
}

/**
 * Explicit, step-by-step migrations. Each entry upgrades a raw workspace
 * object from version N to N+1. Version 1 is the first released schema, so
 * the table is empty; it exists so future versions add a step here rather
 * than silently reshaping data.
 */
export const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {};

export function migrate(raw: Record<string, unknown>, fromVersion: number): Record<string, unknown> {
  let current = raw;
  for (let v = fromVersion; v < SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) throw new ImportError(`No migration is available from schema version ${v}.`);
    current = { ...step(current), schemaVersion: v + 1 };
  }
  return current;
}

function describeZodError(err: ZodError): string {
  const first = err.issues.slice(0, 5).map((i) => `• ${i.path.join('.') || '(root)'}: ${i.message}`);
  const more = err.issues.length > 5 ? `\n…and ${err.issues.length - 5} more problem(s).` : '';
  return `The file does not match the workspace format:\n${first.join('\n')}${more}`;
}

/** Parse, validate, migrate and integrity-check an imported backup. Never mutates stored data. */
export function parseImport(textContent: string, byteSize = textContent.length): ImportResult {
  if (byteSize > MAX_IMPORT_BYTES) {
    throw new ImportError(
      `The file is ${(byteSize / 1024 / 1024).toFixed(1)} MB; the limit is ${MAX_IMPORT_BYTES / 1024 / 1024} MB.`,
    );
  }
  let data: unknown;
  try {
    data = JSON.parse(textContent);
  } catch {
    throw new ImportError('The file is not valid JSON. It may be corrupt or not a workspace backup.');
  }
  const env = ExportEnvelopeSchema.safeParse(data);
  if (!env.success) {
    throw new ImportError('This is not a workspace backup exported from this tool (missing format header).');
  }
  const { schemaVersion } = env.data;
  if (schemaVersion > SCHEMA_VERSION) {
    throw new ImportError(
      `The backup uses schema version ${schemaVersion}, which is newer than this tool supports (${SCHEMA_VERSION}). Use a newer version of the tool.`,
    );
  }
  if (typeof env.data.workspace !== 'object' || env.data.workspace === null) {
    throw new ImportError('The backup does not contain a workspace.');
  }
  const raw = migrate(env.data.workspace as Record<string, unknown>, schemaVersion);
  const parsed = WorkspaceSchema.safeParse(raw);
  if (!parsed.success) throw new ImportError(describeZodError(parsed.error));
  try {
    const { workspace, warnings } = enforceIntegrity(parsed.data);
    return { workspace, warnings, migratedFrom: schemaVersion < SCHEMA_VERSION ? schemaVersion : undefined };
  } catch (e) {
    throw new ImportError((e as Error).message);
  }
}
