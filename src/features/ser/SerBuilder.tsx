import { useState } from 'react';
import { useWorkspace } from '../../state/WorkspaceContext';
import { Page } from '../../components/Page';
import { Checkbox, TextArea, TextField } from '../../components/Fields';
import { Badge, Notice, evidenceTone } from '../../components/Status';
import { BlockView, ChapterView } from '../../components/BlockView';
import { EVIDENCE_STATUS_LABELS } from '../../models/labels';
import { DOCX_MIME, downloadBlob, safeFilename } from '../../utils/download';
import { todayDate } from '../../utils/dates';
import { SER_SECTIONS, composeSer, serReadiness, statusLabel } from './composeSer';

export function SerBuilder() {
  const { workspace: ws, update } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [preview, setPreview] = useState(false);
  const excluded = new Set(ws.ser.excludedSectionIds);
  const selected = new Set(ws.ser.selectedEvidenceIds);
  const readiness = serReadiness(ws);
  const setSer = (patch: Partial<typeof ws.ser>) => update((w) => ({ ...w, ser: { ...w.ser, ...patch } }));
  const doc = preview ? composeSer(ws) : null;

  const exportDocx = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const blob = await (await import('../../utils/exportDocx')).serDocxBlob(ws);
      downloadBlob(new Blob([blob], { type: DOCX_MIME }), `${safeFilename(ws.name)}-draft-SER-${todayDate()}.docx`);
    } catch (e) {
      setError(`The Word document could not be generated: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page
      title="SER Builder"
      intro={
        <p>
          Assemble an editable draft Self-Evaluation Report from your reflections. Unit management remains
          responsible for the SER; this tool only helps you draft it.
        </p>
      }
    >
      <Notice tone="draft" title={statusLabel(ws)}>
        <p>
          The official SER template is maintained by the Office of the Vice President for Academic Affairs, Teaching
          and Learning. Check the structure against it before use. Missing content is labelled, never filled in.
        </p>
      </Notice>

      <p className="muted">
        Workflow measure: {readiness.withContent} of {readiness.included} included sections have content; executive
        summary {readiness.hasExecutiveSummary ? 'written' : 'not yet written'}; {readiness.appendixItems} evidence
        item(s) in the appendix.
      </p>

      <section aria-labelledby="summary-h">
        <h2 id="summary-h">Executive summary</h2>
        <TextArea
          label="Executive summary"
          hint="Write this yourself once the reflections are mature. The tool does not generate summaries."
          rows={8}
          value={ws.ser.executiveSummary}
          onChange={(v) => setSer({ executiveSummary: v })}
        />
      </section>

      <section aria-labelledby="sections-h">
        <h2 id="sections-h">Sections</h2>
        <p>Choose which proposed sections to include and add any section narrative.</p>
        <ol className="card-list">
          {SER_SECTIONS.map((s) => (
            <li key={s.id} className="card">
              <Checkbox
                label={<strong>{s.title}</strong>}
                checked={!excluded.has(s.id)}
                onChange={(on) =>
                  setSer({
                    excludedSectionIds: on
                      ? ws.ser.excludedSectionIds.filter((x) => x !== s.id)
                      : [...ws.ser.excludedSectionIds, s.id],
                  })
                }
              />
              {!excluded.has(s.id) && (
                <TextArea
                  label={`Narrative: ${s.title}`}
                  hint={s.hint}
                  rows={4}
                  value={ws.ser.sectionNarratives[s.id]}
                  onChange={(v) => setSer({ sectionNarratives: { ...ws.ser.sectionNarratives, [s.id]: v } })}
                />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="appendix-h">
        <h2 id="appendix-h">Evidence appendix</h2>
        {ws.evidence.length === 0 ? (
          <p className="empty-state">No evidence in the register yet.</p>
        ) : (
          <>
            <div className="button-row">
              <button type="button" className="btn btn-small" onClick={() => setSer({ selectedEvidenceIds: ws.evidence.map((e) => e.id) })}>
                Select all
              </button>
              <button type="button" className="btn btn-small" onClick={() => setSer({ selectedEvidenceIds: [] })}>
                Select none
              </button>
            </div>
            <fieldset>
              <legend>Evidence to include in the numbered appendix</legend>
              {ws.evidence.map((e) => (
                <Checkbox
                  key={e.id}
                  label={
                    <>
                      {e.title || 'Untitled evidence'}{' '}
                      <Badge tone={evidenceTone[e.status]}>{EVIDENCE_STATUS_LABELS[e.status]}</Badge>
                    </>
                  }
                  checked={selected.has(e.id)}
                  onChange={(on) =>
                    setSer({
                      selectedEvidenceIds: on
                        ? [...ws.ser.selectedEvidenceIds, e.id]
                        : ws.ser.selectedEvidenceIds.filter((x) => x !== e.id),
                    })
                  }
                />
              ))}
            </fieldset>
          </>
        )}
      </section>

      <section aria-labelledby="template-h">
        <h2 id="template-h">Official template</h2>
        <Checkbox
          label="The unit has checked this structure against the official SETU SER template"
          hint="Records a fact the unit has established; it does not import or apply a template."
          checked={ws.ser.officialTemplateConfirmed}
          onChange={(v) => setSer({ officialTemplateConfirmed: v })}
        />
        {ws.ser.officialTemplateConfirmed && (
          <TextField
            label="Template version checked against"
            value={ws.ser.templateVersion}
            onChange={(v) => setSer({ templateVersion: v || undefined })}
          />
        )}
      </section>

      <section aria-labelledby="export-h">
        <h2 id="export-h">Preview and export</h2>
        <div className="button-row">
          <button type="button" className="btn" aria-expanded={preview} onClick={() => setPreview((p) => !p)}>
            {preview ? 'Hide preview' : 'Preview draft'}
          </button>
          <button type="button" className="btn btn-primary" onClick={exportDocx} disabled={busy}>
            {busy ? 'Generating…' : 'Download draft SER (.docx)'}
          </button>
        </div>
        {error && (
          <Notice tone="error" role="alert">
            <p>{error}</p>
          </Notice>
        )}
        {doc && (
          <div className="doc-preview" aria-label="Draft SER preview">
            <p className="draft-banner">{doc.statusLabel}</p>
            <h3>{doc.title}</h3>
            <p>
              <strong>{doc.unitName}</strong> · {doc.period}
            </p>
            <h3>Contents</h3>
            <ol>
              {doc.chapters.map((c) => (
                <li key={c.id}>
                  <a href={`#ch-${c.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`ch-${c.id}`)?.scrollIntoView(); }}>
                    {c.title}
                  </a>
                </li>
              ))}
              {doc.appendices.map((a) => (
                <li key={a.id}>Appendix {a.number}. {a.title}</li>
              ))}
            </ol>
            <h3>Executive summary</h3>
            <BlockView blocks={doc.executiveSummary} />
            {doc.chapters.map((c) => (
              <ChapterView key={c.id} chapter={c} />
            ))}
            {doc.appendices.map((a) => (
              <ChapterView key={a.id} chapter={a} prefix="Appendix " />
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
