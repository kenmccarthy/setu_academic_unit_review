import { Link } from 'react-router-dom';
import { useWorkspace } from '../../state/WorkspaceContext';
import { Page, EmptyState } from '../../components/Page';
import { SelectField, TextArea, TextField, labelled } from '../../components/Fields';
import { Badge, Notice, milestoneTone } from '../../components/Status';
import {
  LIFECYCLE_STAGES,
  MILESTONE_STATUS,
  UNIT_TYPES,
  type Milestone,
} from '../../models/schema';
import { LIFECYCLE_LABELS, MILESTONE_STATUS_LABELS, UNIT_TYPE_LABELS } from '../../models/labels';
import { newMilestone } from '../../models/workspace';
import { optionalDate, sortByDate, todayDate } from '../../utils/dates';

const SUGGESTED_MILESTONES = [
  'Agree review timeline',
  'Stakeholder consultation completed',
  'Draft SER circulated within unit',
  'SER finalised by unit management',
  'Peer review visit',
  'Peer review report received',
  'Unit response and QEP drafted',
  'Approval decisions recorded',
  'First annual update',
];

export function GettingStarted() {
  const { workspace: ws, update } = useWorkspace();
  const set = <K extends keyof typeof ws>(key: K, value: (typeof ws)[K]) => update((w) => ({ ...w, [key]: value }));
  const setMilestone = (id: string, patch: Partial<Milestone>) =>
    update((w) => ({ ...w, milestones: w.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const today = todayDate();

  return (
    <Page
      title="Getting Started"
      intro={
        <p>
          Set up the workspace for one academic unit, record the review timeline and choose where you are in the
          lifecycle. Nothing here is mandatory and nothing is submitted anywhere.
        </p>
      }
    >
      <section aria-labelledby="how-h">
        <h2 id="how-h">How to use this tool</h2>
        <ol>
          <li>Describe the unit and review period below.</li>
          <li>
            Work through the <Link to="/areas">nine review areas</Link>. Each question is a suggestion; answer, skip,
            or mark it not applicable with a reason.
          </li>
          <li>
            Register supporting material in the <Link to="/evidence">evidence register</Link> and link it to
            questions. The tool stores references only, never files.
          </li>
          <li>
            Record <Link to="/engagement">stakeholder engagement</Link> as anonymised summaries.
          </li>
          <li>
            Review <Link to="/findings">findings and gaps</Link>, then assemble a <Link to="/ser">draft SER</Link>.
          </li>
          <li>
            Download a <Link to="/exports">backup</Link> regularly. Data lives only in this browser.
          </li>
        </ol>
        <Notice tone="warn" title="Use fictional or non-sensitive material">
          <p>
            Do not enter names, student numbers, individual performance information or special-category personal
            data. To explore the tool, load the fictional sample workspace from{' '}
            <Link to="/exports">Exports &amp; Settings</Link>.
          </p>
        </Notice>
      </section>

      <section aria-labelledby="unit-h">
        <h2 id="unit-h">Academic unit</h2>
        <div className="form-grid">
          <TextField label="Unit name" value={ws.name} onChange={(v) => set('name', v)} />
          <SelectField
            label="Unit type"
            value={ws.unitType}
            options={labelled(UNIT_TYPES, UNIT_TYPE_LABELS)}
            onChange={(v) => set('unitType', v)}
          />
          <TextField
            label="Review period start"
            type="date"
            value={ws.reviewStart}
            onChange={(v) => set('reviewStart', optionalDate(v))}
          />
          <TextField
            label="Review period end"
            type="date"
            value={ws.reviewEnd}
            onChange={(v) => set('reviewEnd', optionalDate(v))}
          />
          <TextField
            label="Coordinator (role, not a personal name, is enough)"
            value={ws.coordinator}
            onChange={(v) => set('coordinator', v || undefined)}
          />
          <TextField
            label="Policy source"
            hint="Recorded on every export. Update only if a newer approved policy applies."
            value={ws.policyVersion}
            onChange={(v) => set('policyVersion', v)}
          />
        </div>
        <TextArea
          label="Scope of the review"
          hint="E.g. which departments, programmes, sub-units, partners or third-party arrangements are included."
          value={ws.scope}
          onChange={(v) => set('scope', v)}
        />
      </section>

      <section aria-labelledby="stage-h">
        <h2 id="stage-h">Lifecycle stage</h2>
        <p>
          Choose the stage that best describes your preparation. You can move in any order; this is a description,
          not an approval.
        </p>
        <fieldset className="stage-list">
          <legend className="visually-hidden">Current lifecycle stage</legend>
          {LIFECYCLE_STAGES.map((s, i) => (
            <label key={s} className={`stage ${ws.lifecycleStage === s ? 'current' : ''}`}>
              <input
                type="radio"
                name="lifecycle"
                value={s}
                checked={ws.lifecycleStage === s}
                onChange={() => set('lifecycleStage', s)}
              />
              <span>
                {i + 1}. {LIFECYCLE_LABELS[s]}
              </span>
            </label>
          ))}
        </fieldset>
        {ws.lifecycleStage === 'approval_recorded' && ws.approvals.length === 0 && (
          <Notice tone="info">
            <p>
              No approval decisions have been entered yet. Record them as facts on the{' '}
              <Link to="/qep#approvals">Quality Enhancement Plan</Link> page.
            </p>
          </Notice>
        )}
      </section>

      <section aria-labelledby="milestones" id="milestones">
        <h2 id="milestones-h">Milestones</h2>
        <p>
          Record the timeline agreed for your review. The policy does not set deadlines in this tool; enter the dates
          you have agreed.
        </p>
        {ws.milestones.length === 0 ? (
          <EmptyState>No milestones yet.</EmptyState>
        ) : (
          <ul className="card-list">
            {sortByDate(ws.milestones, (m) => m.dueDate).map((m) => (
              <li key={m.id} className="card">
                <div className="card-head">
                  <h3>{m.title || 'Untitled milestone'}</h3>
                  <Badge tone={milestoneTone[m.status]}>{MILESTONE_STATUS_LABELS[m.status]}</Badge>
                  {m.status !== 'completed' && m.dueDate && m.dueDate < today && <Badge tone="bad">Overdue</Badge>}
                </div>
                <div className="form-grid">
                  <TextField label="Title" value={m.title} onChange={(v) => setMilestone(m.id, { title: v })} />
                  <TextField
                    label="Due date"
                    type="date"
                    value={m.dueDate}
                    onChange={(v) => setMilestone(m.id, { dueDate: optionalDate(v) })}
                  />
                  <TextField label="Owner (role)" value={m.owner} onChange={(v) => setMilestone(m.id, { owner: v })} />
                  <SelectField
                    label="Status"
                    value={m.status}
                    options={labelled(MILESTONE_STATUS, MILESTONE_STATUS_LABELS)}
                    onChange={(v) => setMilestone(m.id, { status: v })}
                  />
                </div>
                <TextArea label="Notes" rows={2} value={m.notes} onChange={(v) => setMilestone(m.id, { notes: v })} />
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={() => update((w) => ({ ...w, milestones: w.milestones.filter((x) => x.id !== m.id) }))}
                >
                  Delete milestone “{m.title || 'Untitled'}”
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="button-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => update((w) => ({ ...w, milestones: [...w.milestones, newMilestone({ title: 'New milestone' })] }))}
          >
            Add milestone
          </button>
          {ws.milestones.length === 0 && (
            <button
              type="button"
              className="btn"
              onClick={() =>
                update((w) => ({
                  ...w,
                  milestones: SUGGESTED_MILESTONES.map((title) => newMilestone({ title })),
                }))
              }
            >
              Add suggested milestones (no dates)
            </button>
          )}
        </div>
      </section>
    </Page>
  );
}
