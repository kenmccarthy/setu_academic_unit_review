import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuestion } from '../../data/questionBank';
import { useWorkspace } from '../../state/WorkspaceContext';
import { EmptyState, Page } from '../../components/Page';
import { SelectField, TextArea, TextField, labelled } from '../../components/Fields';
import { QuestionPicker } from '../../components/QuestionPicker';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Reference } from '../../components/Reference';
import { Badge, Notice, evidenceTone } from '../../components/Status';
import { CONFIDENTIALITY, EVIDENCE_STATUS, type Evidence, type EvidenceStatus } from '../../models/schema';
import { CONFIDENTIALITY_LABELS, EVIDENCE_STATUS_LABELS } from '../../models/labels';
import { deleteEvidence, newEvidence, setEvidenceQuestions } from '../../models/workspace';
import { formatDate, optionalDate } from '../../utils/dates';
import { shortRef } from '../../utils/ids';

export function EvidenceRegister() {
  const { workspace: ws, update } = useWorkspace();
  const [filter, setFilter] = useState<'all' | EvidenceStatus>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Evidence | null>(null);

  const patch = (id: string, p: Partial<Evidence>) =>
    update((w) => ({ ...w, evidence: w.evidence.map((e) => (e.id === id ? { ...e, ...p } : e)) }));

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return ws.evidence.filter(
      (e) =>
        (filter === 'all' || e.status === filter) &&
        (!s || [e.title, e.description, e.source, e.type, e.reference].some((x) => x?.toLowerCase().includes(s))),
    );
  }, [ws.evidence, filter, search]);

  return (
    <Page
      title="Evidence Register"
      intro={
        <p>
          Record what evidence exists, where it is held and which questions it supports. The tool stores
          references only; it never stores or uploads files and does not check that links work.
        </p>
      }
    >
      <Notice tone="warn">
        <p>
          Describe evidence at aggregate level. Do not paste confidential content, personal data or individual
          performance information. Mark sensitive items so they are handled through approved channels.
        </p>
      </Notice>

      <div className="toolbar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            const e = newEvidence({ title: 'New evidence item' });
            update((w) => ({ ...w, evidence: [...w.evidence, e] }));
            setOpenId(e.id);
            setFilter('all');
          }}
        >
          Add evidence item
        </button>
        <SelectField
          label="Show"
          value={filter}
          options={[{ value: 'all', label: 'All statuses' }, ...labelled(EVIDENCE_STATUS, EVIDENCE_STATUS_LABELS)]}
          onChange={setFilter}
        />
        <TextField label="Search" type="search" value={search} onChange={setSearch} />
      </div>
      <p role="status" className="muted">
        Showing {shown.length} of {ws.evidence.length} evidence items.
      </p>

      {ws.evidence.length === 0 ? (
        <EmptyState>No evidence recorded yet. Add an item, or add evidence while answering a question.</EmptyState>
      ) : (
        <ul className="card-list">
          {shown.map((e) => {
            const open = openId === e.id;
            return (
              <li key={e.id} className="card">
                <div className="card-head">
                  <h2 className="h3">
                    <span className="muted">{shortRef('E', e.id)}</span> {e.title || 'Untitled evidence'}
                  </h2>
                  <Badge tone={evidenceTone[e.status]}>{EVIDENCE_STATUS_LABELS[e.status]}</Badge>
                  {e.confidentiality === 'sensitive' && <Badge tone="warn">Sensitive</Badge>}
                </div>
                <p className="muted">
                  {e.source || 'No source'} · {formatDate(e.evidenceDate)} · Supports:{' '}
                  {e.questionIds.length
                    ? e.questionIds.map((qid, i) => {
                        const q = getQuestion(qid);
                        return (
                          <span key={qid}>
                            {i > 0 && ', '}
                            {q ? <Link to={`/areas/${q.areaId}/${qid}`}>{qid}</Link> : qid}
                          </span>
                        );
                      })
                    : 'no questions yet'}
                </p>
                <p>
                  Reference: <Reference value={e.reference} />
                </p>
                <button
                  type="button"
                  className="btn btn-small"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : e.id)}
                >
                  {open ? 'Close editor' : 'Edit'}
                  <span className="visually-hidden"> {e.title}</span>
                </button>
                {open && (
                  <div className="editor">
                    <div className="form-grid">
                      <TextField label="Title" value={e.title} onChange={(v) => patch(e.id, { title: v })} />
                      <TextField label="Source" hint="E.g. office, system or committee holding it" value={e.source} onChange={(v) => patch(e.id, { source: v })} />
                      <TextField label="Evidence category" hint="E.g. minutes, survey, data report" value={e.type} onChange={(v) => patch(e.id, { type: v })} />
                      <TextField label="Relevant period" hint="E.g. 2021/22–2025/26" value={e.period} onChange={(v) => patch(e.id, { period: v })} />
                      <TextField label="Owner (role)" value={e.owner} onChange={(v) => patch(e.id, { owner: v })} />
                      <TextField label="Date" type="date" value={e.evidenceDate} onChange={(v) => patch(e.id, { evidenceDate: optionalDate(v) })} />
                      <SelectField label="Status" value={e.status} options={labelled(EVIDENCE_STATUS, EVIDENCE_STATUS_LABELS)} onChange={(v) => patch(e.id, { status: v })} />
                      <SelectField label="Confidentiality" value={e.confidentiality} options={labelled(CONFIDENTIALITY, CONFIDENTIALITY_LABELS)} onChange={(v) => patch(e.id, { confidentiality: v })} />
                    </div>
                    <TextField
                      label="Link or reference"
                      hint="A URL, file path or document reference. Recorded as you enter it; not checked."
                      value={e.reference}
                      onChange={(v) => patch(e.id, { reference: v })}
                    />
                    <TextArea label="Description" rows={3} value={e.description} onChange={(v) => patch(e.id, { description: v })} />
                    <TextArea label="Limitations" hint="Gaps, age, coverage or reliability concerns." rows={2} value={e.limitations} onChange={(v) => patch(e.id, { limitations: v })} />
                    <QuestionPicker
                      legend="Questions this evidence supports"
                      selected={e.questionIds}
                      onChange={(ids) => update((w) => setEvidenceQuestions(w, e.id, ids))}
                    />
                    <button type="button" className="btn btn-danger btn-small" onClick={() => setToDelete(e)}>
                      Delete evidence item
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete evidence item?"
        confirmLabel="Delete"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) update((w) => deleteEvidence(w, toDelete.id));
          setToDelete(null);
          setOpenId(null);
        }}
      >
        <p>
          “{toDelete?.title}” will be removed from the register and unlinked from{' '}
          {toDelete?.questionIds.length ?? 0} question(s). This cannot be undone except by restoring a backup.
        </p>
      </ConfirmDialog>
    </Page>
  );
}
