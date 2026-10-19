import { useState } from 'react';
import { useWorkspace } from '../../state/WorkspaceContext';
import { EmptyState, Page } from '../../components/Page';
import { SelectField, TextArea, TextField, labelled } from '../../components/Fields';
import { QuestionPicker } from '../../components/QuestionPicker';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Badge, Notice } from '../../components/Status';
import { IMPROVEMENT_STATUS, type ApprovalRecord, type Improvement, type PeerRecommendation } from '../../models/schema';
import { IMPROVEMENT_STATUS_LABELS } from '../../models/labels';
import { deleteImprovement, deletePeerRecommendation, newImprovement } from '../../models/workspace';
import { formatDate, optionalDate } from '../../utils/dates';
import { newId } from '../../utils/ids';
import { DOCX_MIME, downloadBlob, safeFilename } from '../../utils/download';
import { todayDate } from '../../utils/dates';

type Pending = { kind: 'action'; item: Improvement } | { kind: 'rec'; item: PeerRecommendation } | { kind: 'approval'; item: ApprovalRecord };

function ActionEditor({ a, recs }: { a: Improvement; recs: PeerRecommendation[] }) {
  const { update } = useWorkspace();
  const patch = (p: Partial<Improvement>) =>
    update((w) => ({ ...w, improvements: w.improvements.map((i) => (i.id === a.id ? { ...i, ...p } : i)) }));
  return (
    <div className="editor">
      <div className="form-grid">
        <TextField label="Title" value={a.title} onChange={(v) => patch({ title: v })} />
        <TextField label="Owner (role)" value={a.owner} onChange={(v) => patch({ owner: v })} />
        <TextField label="Target date" type="date" value={a.targetDate} onChange={(v) => patch({ targetDate: optionalDate(v) })} />
        <SelectField label="Status" value={a.status} options={labelled(IMPROVEMENT_STATUS, IMPROVEMENT_STATUS_LABELS)} onChange={(v) => patch({ status: v })} />
        {a.origin === 'peer_review' && (
          <SelectField
            label="Peer review recommendation"
            value={a.recommendationId ?? ''}
            options={[{ value: '', label: 'Not linked' }, ...recs.map((r, n) => ({ value: r.id, label: `Recommendation ${n + 1}: ${r.recommendation.slice(0, 60) || 'untitled'}` }))]}
            onChange={(v) => patch({ recommendationId: v || undefined })}
          />
        )}
      </div>
      <TextArea label="Rationale" rows={3} value={a.rationale} onChange={(v) => patch({ rationale: v })} />
      <TextArea label="Resource implications" rows={2} value={a.resourceImplications} onChange={(v) => patch({ resourceImplications: v })} />
      <TextArea label="Success measure" rows={2} value={a.measureOfSuccess} onChange={(v) => patch({ measureOfSuccess: v })} />
      <QuestionPicker legend="Related questions" selected={a.relatedQuestionIds} onChange={(ids) => patch({ relatedQuestionIds: ids })} />
    </div>
  );
}

function ActionList({ items, recs, onDelete }: { items: Improvement[]; recs: PeerRecommendation[]; onDelete: (a: Improvement) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!items.length) return <EmptyState>None recorded.</EmptyState>;
  return (
    <ul className="card-list">
      {items.map((a) => (
        <li key={a.id} className="card">
          <div className="card-head">
            <h3>{a.title || 'Untitled action'}</h3>
            <Badge tone={a.status === 'completed' ? 'good' : a.status === 'in_progress' ? 'info' : 'neutral'}>{IMPROVEMENT_STATUS_LABELS[a.status]}</Badge>
          </div>
          <p className="muted">
            Owner: {a.owner || '—'} · Target: {formatDate(a.targetDate)}
            {a.recommendationId && ` · Linked to recommendation ${recs.findIndex((r) => r.id === a.recommendationId) + 1}`}
          </p>
          <div className="button-row">
            <button type="button" className="btn btn-small" aria-expanded={openId === a.id} onClick={() => setOpenId(openId === a.id ? null : a.id)}>
              {openId === a.id ? 'Close editor' : 'Edit'}<span className="visually-hidden"> {a.title}</span>
            </button>
            <button type="button" className="btn btn-small btn-danger" onClick={() => onDelete(a)}>
              Delete<span className="visually-hidden"> {a.title}</span>
            </button>
          </div>
          {openId === a.id && <ActionEditor a={a} recs={recs} />}
        </li>
      ))}
    </ul>
  );
}

export function QepPage() {
  const { workspace: ws, update } = useWorkspace();
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string>();
  const provisional = ws.improvements.filter((i) => i.origin === 'self_evaluation');
  const formal = ws.improvements.filter((i) => i.origin === 'peer_review');
  const recs = ws.peerRecommendations;
  const patchRec = (id: string, p: Partial<PeerRecommendation>) =>
    update((w) => ({ ...w, peerRecommendations: w.peerRecommendations.map((r) => (r.id === id ? { ...r, ...p } : r)) }));
  const patchApproval = (id: string, p: Partial<ApprovalRecord>) =>
    update((w) => ({ ...w, approvals: w.approvals.map((r) => (r.id === id ? { ...r, ...p } : r)) }));

  const addAction = (origin: Improvement['origin'], partial: Partial<Improvement> = {}) =>
    update((w) => ({ ...w, improvements: [...w.improvements, newImprovement(origin, { title: 'New action', ...partial })] }));

  return (
    <Page
      title="Quality Enhancement Plan"
      intro={
        <p>
          Keep pre-review ideas separate from what happens after peer review: recommendations, the unit and executive
          responses, formal QEP actions and the approval decisions you record.
        </p>
      }
    >
      <div className="button-row">
        <button
          type="button"
          className="btn"
          onClick={async () => {
            setError(undefined);
            try {
              const blob = await (await import('../../utils/exportDocx')).qepDocxBlob(ws);
              downloadBlob(new Blob([blob], { type: DOCX_MIME }), `${safeFilename(ws.name)}-QEP-working-${todayDate()}.docx`);
            } catch (e) {
              setError(`The Word document could not be generated: ${(e as Error).message}`);
            }
          }}
        >
          Download QEP working document (.docx)
        </button>
      </div>
      {error && <Notice tone="error" role="alert"><p>{error}</p></Notice>}

      <section aria-labelledby="provisional-h" id="provisional">
        <h2 id="provisional-h">1. Provisional improvements (pre-review)</h2>
        <p>Ideas from self-evaluation. These are proposals, not approved actions.</p>
        <ActionList items={provisional} recs={recs} onDelete={(a) => setPending({ kind: 'action', item: a })} />
        <button type="button" className="btn btn-primary" onClick={() => addAction('self_evaluation', { title: 'New provisional improvement' })}>
          Add provisional improvement
        </button>
      </section>

      <section aria-labelledby="recs-h">
        <h2 id="recs-h">2. Peer review recommendations and responses</h2>
        <p>Enter recommendations as they appear in the peer review report, then record the responses.</p>
        {recs.length === 0 ? (
          <EmptyState>No recommendations recorded. These are entered after the peer review report is received.</EmptyState>
        ) : (
          <ol className="card-list">
            {recs.map((r, n) => (
              <li key={r.id} className="card">
                <h3>Recommendation {n + 1}</h3>
                <TextArea label="Recommendation (as worded in the report)" rows={3} value={r.recommendation} onChange={(v) => patchRec(r.id, { recommendation: v })} />
                <TextField label="Report reference" value={r.reportReference} onChange={(v) => patchRec(r.id, { reportReference: v })} />
                <TextArea label="Unit response" rows={3} value={r.unitResponse} onChange={(v) => patchRec(r.id, { unitResponse: v })} />
                <TextArea label="Executive response" hint="Record the executive response as received." rows={3} value={r.executiveResponse} onChange={(v) => patchRec(r.id, { executiveResponse: v })} />
                <TextArea label="Financial implications" rows={2} value={r.financialImplications} onChange={(v) => patchRec(r.id, { financialImplications: v })} />
                <div className="button-row">
                  <button type="button" className="btn btn-small" onClick={() => addAction('peer_review', { title: `Action for recommendation ${n + 1}`, recommendationId: r.id })}>
                    Add QEP action for this recommendation
                  </button>
                  <button type="button" className="btn btn-small btn-danger" onClick={() => setPending({ kind: 'rec', item: r })}>
                    Delete recommendation {n + 1}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => update((w) => ({ ...w, peerRecommendations: [...w.peerRecommendations, { id: newId(), recommendation: '' }] }))}
        >
          Add peer review recommendation
        </button>
      </section>

      <section aria-labelledby="formal-h">
        <h2 id="formal-h">3. QEP actions (post-review)</h2>
        <ActionList items={formal} recs={recs} onDelete={(a) => setPending({ kind: 'action', item: a })} />
        <button type="button" className="btn btn-primary" onClick={() => addAction('peer_review', { title: 'New QEP action' })}>
          Add QEP action
        </button>
      </section>

      <section aria-labelledby="approvals-h" id="approvals">
        <h2 id="approvals-h">4. Approval records</h2>
        <Notice tone="info">
          <p>
            Record decisions made by the relevant bodies (for example Academic Council or Governing Body) as facts.
            Entering a record here does not approve anything.
          </p>
        </Notice>
        {ws.approvals.length === 0 ? (
          <EmptyState>No approval decisions recorded.</EmptyState>
        ) : (
          <ul className="card-list">
            {ws.approvals.map((a) => (
              <li key={a.id} className="card">
                <div className="form-grid">
                  <TextField label="Body" value={a.body} onChange={(v) => patchApproval(a.id, { body: v })} />
                  <TextField label="Decision date" type="date" value={a.decisionDate} onChange={(v) => patchApproval(a.id, { decisionDate: optionalDate(v) })} />
                  <TextField label="Reference (e.g. minute number)" value={a.reference} onChange={(v) => patchApproval(a.id, { reference: v })} />
                  <TextField label="Entered by (role)" value={a.enteredBy} onChange={(v) => patchApproval(a.id, { enteredBy: v })} />
                </div>
                <TextArea label="Decision as recorded" rows={2} value={a.decision} onChange={(v) => patchApproval(a.id, { decision: v })} />
                <button type="button" className="btn btn-small btn-danger" onClick={() => setPending({ kind: 'approval', item: a })}>
                  Delete approval record
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => update((w) => ({ ...w, approvals: [...w.approvals, { id: newId(), body: '' }] }))}
        >
          Add approval record
        </button>
      </section>

      <ConfirmDialog
        open={!!pending}
        title="Delete this record?"
        confirmLabel="Delete"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind === 'action') update((w) => deleteImprovement(w, pending.item.id));
          if (pending?.kind === 'rec') update((w) => deletePeerRecommendation(w, pending.item.id));
          if (pending?.kind === 'approval') update((w) => ({ ...w, approvals: w.approvals.filter((a) => a.id !== pending.item.id) }));
          setPending(null);
        }}
      >
        <p>This cannot be undone except by restoring a backup. Links to this record are removed.</p>
      </ConfirmDialog>
    </Page>
  );
}
