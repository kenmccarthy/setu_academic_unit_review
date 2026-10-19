import { ImportError, MAX_IMPORT_BYTES, MIGRATIONS, migrate, parseImport, serializeWorkspace } from '../../src/utils/exportJson';
import { createSampleWorkspace } from '../../src/data/sampleWorkspace';
import { createWorkspace } from '../../src/models/workspace';
import { SCHEMA_VERSION, WorkspaceSchema } from '../../src/models/schema';

describe('JSON backup', () => {
  it('round-trips the fictional sample exactly', () => {
    const ws = createSampleWorkspace();
    const { workspace, warnings, migratedFrom } = parseImport(serializeWorkspace(ws));
    expect(warnings).toEqual([]);
    expect(migratedFrom).toBeUndefined();
    expect(workspace).toEqual(ws);
  });

  it('writes the envelope header', () => {
    const env = JSON.parse(serializeWorkspace(createWorkspace()));
    expect(env.format).toBe('setu-aur-workspace');
    expect(env.schemaVersion).toBe(SCHEMA_VERSION);
    expect(typeof env.appVersion).toBe('string');
    expect(new Date(env.exportedAt).toISOString()).toBe(env.exportedAt);
  });

  it('the sample validates against the schema', () => {
    expect(WorkspaceSchema.safeParse(createSampleWorkspace()).success).toBe(true);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseImport('{not json')).toThrow(/not valid JSON/);
  });

  it('rejects files without the format header', () => {
    expect(() => parseImport(JSON.stringify({ name: 'x' }))).toThrow(/not a workspace backup/);
  });

  it('rejects oversized files', () => {
    expect(() => parseImport('{}', MAX_IMPORT_BYTES + 1)).toThrow(ImportError);
  });

  it('rejects newer schema versions', () => {
    const env = JSON.parse(serializeWorkspace(createWorkspace()));
    env.schemaVersion = SCHEMA_VERSION + 1;
    expect(() => parseImport(JSON.stringify(env))).toThrow(/newer than this tool supports/);
  });

  it('rejects schema violations with a readable path', () => {
    const env = JSON.parse(serializeWorkspace(createWorkspace()));
    env.workspace.evidence = [{ id: 'e1', title: 'x', status: 'lost', confidentiality: 'public', questionIds: [] }];
    try {
      parseImport(JSON.stringify(env));
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ImportError);
      expect((e as Error).message).toContain('evidence.0.status');
    }
  });

  it('rejects malformed dates', () => {
    const env = JSON.parse(serializeWorkspace(createWorkspace()));
    env.workspace.reviewStart = '01/09/2025';
    expect(() => parseImport(JSON.stringify(env))).toThrow(/YYYY-MM-DD/);
  });

  it('applies migrations step by step and refuses gaps', () => {
    expect(() => migrate({}, 0)).toThrow(/No migration/);
    MIGRATIONS[0] = (raw) => ({ ...raw, migrated: true });
    try {
      if (SCHEMA_VERSION === 1) expect(migrate({ a: 1 }, 0)).toEqual({ a: 1, migrated: true, schemaVersion: 1 });
    } finally {
      delete MIGRATIONS[0];
    }
  });

  it('repairs dangling links on import and reports them', () => {
    const ws = createWorkspace();
    ws.questions['SD-01'] = {
      questionId: 'SD-01', applicability: 'applicable', response: 'r', strengths: '', challenges: '',
      improvementIdeas: '', evidenceIds: ['ghost'], confidence: 'not_assessed', status: 'draft', updatedAt: '',
    };
    const { workspace, warnings } = parseImport(serializeWorkspace(ws));
    expect(workspace.questions['SD-01'].evidenceIds).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});

describe('committed sample file', () => {
  it('samples/fictional-workspace.json imports without warnings', async () => {
    const { readFileSync } = await import('node:fs');
    const text = readFileSync('samples/fictional-workspace.json', 'utf8');
    const { workspace, warnings } = parseImport(text);
    expect(warnings).toEqual([]);
    expect(workspace.name).toContain('FICTIONAL');
  });
});
