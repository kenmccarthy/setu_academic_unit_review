import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../state/WorkspaceContext';
import { Page } from '../../components/Page';
import { ConfirmDialog, Dialog } from '../../components/ConfirmDialog';
import { Notice } from '../../components/Status';
import { ImportError, MAX_IMPORT_BYTES, parseImport, serializeWorkspace, type ImportResult } from '../../utils/exportJson';
import { actionsCsv, engagementCsv, evidenceCsv, milestonesCsv } from '../../utils/exportCsv';
import { DOCX_MIME, downloadBlob, downloadText, safeFilename } from '../../utils/download';
import { formatDateTime, todayDate } from '../../utils/dates';
import { getPref, setPref } from '../../utils/prefs';
import { createSampleWorkspace } from '../../data/sampleWorkspace';

type Msg = { tone: 'info' | 'error'; text: string; details?: string[] } | null;

export function ExportsPage() {
  const { workspace: ws, replace, reset, saveState } = useWorkspace();
  const [msg, setMsg] = useState<Msg>(null);
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSample, setConfirmSample] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const base = safeFilename(ws.name);
  const lastBackup = getPref('lastBackupAt');

  const downloadBackup = () => {
    downloadText(serializeWorkspace(ws), `${base}-backup-${todayDate()}.json`, 'application/json');
    setPref('lastBackupAt', new Date().toISOString());
    setMsg({ tone: 'info', text: 'Backup downloaded. Keep it somewhere appropriate for the data it contains.' });
  };

  const run = async (label: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
    } catch (e) {
      setMsg({ tone: 'error', text: `${label} failed: ${(e as Error).message}` });
    }
  };

  const onFile = async (file: File | undefined) => {
    setMsg(null);
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setMsg({ tone: 'error', text: `The file is too large (limit ${MAX_IMPORT_BYTES / 1024 / 1024} MB). Nothing was changed.` });
      return;
    }
    try {
      const result = parseImport(await file.text(), file.size);
      setPendingImport(result);
    } catch (e) {
      const text = e instanceof ImportError ? e.message : `Could not read the file: ${(e as Error).message}`;
      setMsg({ tone: 'error', text: `Import rejected. Your current workspace has not been changed.\n${text}` });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Page title="Exports & Settings" intro={<p>Back up, restore and export your work. Everything happens in this browser.</p>}>
      {msg && (
        <Notice tone={msg.tone === 'error' ? 'error' : 'info'} role={msg.tone === 'error' ? 'alert' : 'status'}>
          <p className="pre-wrap">{msg.text}</p>
          {msg.details && msg.details.length > 0 && (
            <ul>
              {msg.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </Notice>
      )}

      <section aria-labelledby="backup-h">
        <h2 id="backup-h">Workspace backup (JSON)</h2>
        <p>
          A full, reversible copy of the workspace, including links and workflow statuses. Download one regularly:
          clearing browser data deletes the workspace. Last backup from this browser:{' '}
          {lastBackup ? formatDateTime(lastBackup) : 'none recorded'}.
        </p>
        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={downloadBackup}>
            Download backup (.json)
          </button>
          <label className="btn file-btn">
            Import backup…
            <input ref={fileRef} type="file" accept="application/json,.json" className="visually-hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
        </div>
        <p className="hint">Imports are checked against the format and a {MAX_IMPORT_BYTES / 1024 / 1024} MB size limit before anything is replaced.</p>
      </section>

      <section aria-labelledby="docs-h">
        <h2 id="docs-h">Documents</h2>
        <ul className="link-list">
          <li>
            <button type="button" className="btn" onClick={() => run('SER export', async () => downloadBlob(new Blob([await (await import('../../utils/exportDocx')).serDocxBlob(ws)], { type: DOCX_MIME }), `${base}-draft-SER-${todayDate()}.docx`))}>
              Draft SER (.docx)
            </button>{' '}
            <span className="muted">Configure sections in the <Link to="/ser">SER Builder</Link>.</span>
          </li>
          <li>
            <button type="button" className="btn" onClick={() => run('QEP export', async () => downloadBlob(new Blob([await (await import('../../utils/exportDocx')).qepDocxBlob(ws)], { type: DOCX_MIME }), `${base}-QEP-working-${todayDate()}.docx`))}>
              QEP working document (.docx)
            </button>
          </li>
          <li>
            <Link className="btn" to="/readiness-report">
              Readiness report (print or save as PDF)
            </Link>{' '}
            <span className="muted">Uses your browser’s print dialog; choose “Save as PDF”. This tool has no built-in PDF generator.</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="csv-h">
        <h2 id="csv-h">Spreadsheets (CSV)</h2>
        <p className="hint">Cells that begin with = + - or @ are prefixed with an apostrophe to stop spreadsheet formulas running.</p>
        <div className="button-row">
          <button type="button" className="btn" onClick={() => downloadText(evidenceCsv(ws), `${base}-evidence-${todayDate()}.csv`, 'text/csv;charset=utf-8')}>Evidence (.csv)</button>
          <button type="button" className="btn" onClick={() => downloadText(engagementCsv(ws), `${base}-engagement-${todayDate()}.csv`, 'text/csv;charset=utf-8')}>Engagement (.csv)</button>
          <button type="button" className="btn" onClick={() => downloadText(actionsCsv(ws), `${base}-actions-${todayDate()}.csv`, 'text/csv;charset=utf-8')}>Actions (.csv)</button>
          <button type="button" className="btn" onClick={() => downloadText(milestonesCsv(ws), `${base}-milestones-${todayDate()}.csv`, 'text/csv;charset=utf-8')}>Milestones (.csv)</button>
        </div>
      </section>

      <section aria-labelledby="sample-h">
        <h2 id="sample-h">Fictional sample workspace</h2>
        <p>Load an invented unit with example reflections, evidence and actions to explore the tool.</p>
        <button type="button" className="btn" onClick={() => setConfirmSample(true)}>
          Load fictional sample…
        </button>
      </section>

      <section aria-labelledby="delete-h">
        <h2 id="delete-h">Delete workspace</h2>
        <p>Permanently remove the workspace from this browser and start an empty one.</p>
        <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
          Delete workspace…
        </button>
        {saveState === 'error' && (
          <Notice tone="error">
            <p>Saving is currently failing. Download a backup before doing anything else.</p>
          </Notice>
        )}
      </section>

      <Dialog
        open={!!pendingImport}
        title="Replace the current workspace?"
        onClose={() => setPendingImport(null)}
        actions={
          <>
            <button type="button" className="btn" onClick={() => setPendingImport(null)}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={downloadBackup}>
              Download backup of current first
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                run('Import', async () => {
                  const r = pendingImport!;
                  setPendingImport(null);
                  await replace(r.workspace, r.migratedFrom ? `before import (migrated from v${r.migratedFrom})` : 'before import');
                  setMsg({
                    tone: 'info',
                    text: `Imported “${r.workspace.name}”. A copy of the previous workspace was kept internally.`,
                    details: r.warnings,
                  });
                })
              }
            >
              Replace workspace
            </button>
          </>
        }
      >
        <p>
          The backup “{pendingImport?.workspace.name}” passed validation. Importing replaces “{ws.name}” in this
          browser.
        </p>
        {pendingImport && pendingImport.warnings.length > 0 && (
          <>
            <p>The following links were repaired during validation:</p>
            <ul>
              {pendingImport.warnings.slice(0, 10).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmSample}
        title="Load the fictional sample?"
        confirmLabel="Replace with sample"
        onCancel={() => setConfirmSample(false)}
        onConfirm={() =>
          run('Loading sample', async () => {
            setConfirmSample(false);
            await replace(createSampleWorkspace(), 'before loading sample');
            setMsg({ tone: 'info', text: 'Fictional sample loaded. A copy of the previous workspace was kept internally.' });
          })
        }
      >
        <p>This replaces “{ws.name}”. Download a backup first if you want to keep it.</p>
        <button type="button" className="btn" onClick={downloadBackup}>
          Download backup first
        </button>
      </ConfirmDialog>

      <Dialog
        open={confirmDelete}
        title="Delete this workspace?"
        onClose={() => setConfirmDelete(false)}
        actions={
          <>
            <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={downloadBackup}>
              Download backup first
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() =>
                run('Delete', async () => {
                  setConfirmDelete(false);
                  await reset();
                  setMsg({ tone: 'info', text: 'Workspace deleted. A new empty workspace has been created.' });
                })
              }
            >
              Delete permanently
            </button>
          </>
        }
      >
        <p>
          “{ws.name}” and all its reflections, evidence, engagement records and actions will be removed from this
          browser. This cannot be undone without a backup file.
        </p>
      </Dialog>
    </Page>
  );
}
