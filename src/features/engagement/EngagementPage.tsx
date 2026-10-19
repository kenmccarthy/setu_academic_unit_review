import { useState } from 'react';
import { useWorkspace } from '../../state/WorkspaceContext';
import { EmptyState, Page } from '../../components/Page';
import { Checkbox, SelectField, TextArea, TextField, labelled } from '../../components/Fields';
import { QuestionPicker } from '../../components/QuestionPicker';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Badge, Notice } from '../../components/Status';
import { STAKEHOLDER_GROUPS, type Engagement } from '../../models/schema';
import { STAKEHOLDER_LABELS } from '../../models/labels';
import { newEngagement } from '../../models/workspace';
import { formatDate, optionalDate, sortByDate } from '../../utils/dates';
import { groupsNotEngaged } from '../../utils/progress';

function engagementStatus(g: Engagement) {
  if (g.notYetConsulted) return <Badge tone="warn">Not yet consulted</Badge>;
  if (g.completedDate) return <Badge tone="good">Completed {formatDate(g.completedDate)}</Badge>;
  if (g.plannedDate) return <Badge tone="info">Planned {formatDate(g.plannedDate)}</Badge>;
  return <Badge tone="neutral">Not scheduled</Badge>;
}

export function EngagementPage() {
  const { workspace: ws, update } = useWorkspace();
  const [openId, setOpenId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Engagement | null>(null);
  const patch = (id: string, p: Partial<Engagement>) =>
    update((w) => ({ ...w, engagements: w.engagements.map((g) => (g.id === id ? { ...g, ...p } : g)) }));
  const missing = groupsNotEngaged(ws, STAKEHOLDER_GROUPS.filter((g) => g !== 'other'));

  return (
    <Page
      title="Stakeholder Engagement"
      intro={
        <p>
          Plan and summarise how staff, students and external stakeholders contribute to self-evaluation. Choose
          methods that suit your unit; this tool does not prescribe any.
        </p>
      }
    >
      <Notice tone="warn" title="Anonymised summaries only">
        <p>
          Record broad themes and outcomes. Do not store interview transcripts, names or comments that could
          identify an individual.
        </p>
      </Notice>
      {missing.length > 0 && (
        <Notice tone="info" title="Groups with no recorded engagement">
          <p>
            {missing.map((g) => STAKEHOLDER_LABELS[g as keyof typeof STAKEHOLDER_LABELS]).join(', ')}. Not every group
            will apply to every unit; you can record a group explicitly as “not yet consulted”.
          </p>
        </Notice>
      )}
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          const g = newEngagement({ method: 'New consultation' });
          update((w) => ({ ...w, engagements: [...w.engagements, g] }));
          setOpenId(g.id);
        }}
      >
        Add engagement activity
      </button>

      {ws.engagements.length === 0 ? (
        <EmptyState>No engagement recorded yet.</EmptyState>
      ) : (
        <ul className="card-list">
          {sortByDate(ws.engagements, (g) => g.plannedDate ?? g.completedDate).map((g) => {
            const open = openId === g.id;
            return (
              <li key={g.id} className="card">
                <div className="card-head">
                  <h2 className="h3">
                    {STAKEHOLDER_LABELS[g.stakeholderGroup]}: {g.method || 'Method not recorded'}
                  </h2>
                  {engagementStatus(g)}
                </div>
                {g.themes && <p>{g.themes}</p>}
                <p className="muted">Linked questions: {g.linkedQuestionIds.join(', ') || 'none'}</p>
                <button type="button" className="btn btn-small" aria-expanded={open} onClick={() => setOpenId(open ? null : g.id)}>
                  {open ? 'Close editor' : 'Edit'}
                  <span className="visually-hidden"> {g.method}</span>
                </button>
                {open && (
                  <div className="editor">
                    <div className="form-grid">
                      <SelectField label="Stakeholder group" value={g.stakeholderGroup} options={labelled(STAKEHOLDER_GROUPS, STAKEHOLDER_LABELS)} onChange={(v) => patch(g.id, { stakeholderGroup: v })} />
                      <TextField label="Method" hint="E.g. focus group, survey, workshop, advisory board" value={g.method} onChange={(v) => patch(g.id, { method: v })} />
                      <TextField label="Planned date" type="date" value={g.plannedDate} onChange={(v) => patch(g.id, { plannedDate: optionalDate(v) })} />
                      <TextField label="Completed date" type="date" value={g.completedDate} onChange={(v) => patch(g.id, { completedDate: optionalDate(v) })} />
                    </div>
                    <Checkbox
                      label="Not yet consulted"
                      hint="Record explicitly that this group has not been consulted."
                      checked={!!g.notYetConsulted}
                      onChange={(v) => patch(g.id, { notYetConsulted: v || undefined })}
                    />
                    <TextArea label="Broad themes" value={g.themes} onChange={(v) => patch(g.id, { themes: v })} />
                    <TextArea label="Consultation findings (anonymised)" value={g.outcomes} onChange={(v) => patch(g.id, { outcomes: v })} />
                    <TextArea label="Follow-up" rows={2} value={g.followUp} onChange={(v) => patch(g.id, { followUp: v })} />
                    <QuestionPicker legend="Related questions" selected={g.linkedQuestionIds} onChange={(ids) => patch(g.id, { linkedQuestionIds: ids })} />
                    <button type="button" className="btn btn-danger btn-small" onClick={() => setToDelete(g)}>
                      Delete engagement activity
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
        title="Delete engagement activity?"
        confirmLabel="Delete"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) update((w) => ({ ...w, engagements: w.engagements.filter((g) => g.id !== toDelete.id) }));
          setToDelete(null);
        }}
      >
        <p>This removes the record and its summary. This cannot be undone except by restoring a backup.</p>
      </ConfirmDialog>
    </Page>
  );
}
