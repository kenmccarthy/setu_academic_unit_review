import { useState } from 'react';
import { useWorkspace } from '../../state/WorkspaceContext';
import { EmptyState, Page } from '../../components/Page';
import { Checkbox, TextArea, TextField } from '../../components/Fields';
import { Badge } from '../../components/Status';
import type { AnnualUpdate } from '../../models/schema';
import { IMPROVEMENT_STATUS_LABELS } from '../../models/labels';
import { formatDate, optionalDate, sortByDate, todayDate } from '../../utils/dates';
import { newId } from '../../utils/ids';
import { outstandingActions } from '../../utils/progress';

function ProgressNote({ actionId }: { actionId: string }) {
  const { update } = useWorkspace();
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayDate());
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!note.trim()) return;
        update((w) => ({
          ...w,
          improvements: w.improvements.map((i) =>
            i.id === actionId ? { ...i, updates: [...i.updates, { date: date || todayDate(), note: note.trim() }] } : i,
          ),
        }));
        setNote('');
      }}
    >
      <TextField label="Date" type="date" value={date} onChange={setDate} />
      <TextField label="Progress note" value={note} onChange={setNote} />
      <button type="submit" className="btn btn-small" disabled={!note.trim()}>
        Add note
      </button>
    </form>
  );
}

export function MonitoringPage() {
  const { workspace: ws, update } = useWorkspace();
  const patch = (id: string, p: Partial<AnnualUpdate>) =>
    update((w) => ({ ...w, annualUpdates: w.annualUpdates.map((u) => (u.id === id ? { ...u, ...p } : u)) }));
  const qepActions = ws.improvements.filter((i) => i.origin === 'peer_review');
  const outstanding = outstandingActions(ws);

  return (
    <Page
      title="Monitoring"
      intro={<p>Track progress on actions and prepare annual updates on the quality enhancement plan.</p>}
    >
      <section aria-labelledby="prog-h">
        <h2 id="prog-h">Action progress</h2>
        <p className="muted">{outstanding.length} action(s) not completed or withdrawn (workflow measure).</p>
        {ws.improvements.length === 0 ? (
          <EmptyState>No actions recorded yet. Add them on the Quality Enhancement Plan page.</EmptyState>
        ) : (
          <ul className="card-list">
            {ws.improvements.map((a) => (
              <li key={a.id} className="card">
                <div className="card-head">
                  <h3>{a.title || 'Untitled action'}</h3>
                  <Badge tone="neutral">{a.origin === 'peer_review' ? 'QEP action' : 'Provisional'}</Badge>
                  <Badge tone={a.status === 'completed' ? 'good' : 'info'}>{IMPROVEMENT_STATUS_LABELS[a.status]}</Badge>
                </div>
                {a.updates.length > 0 ? (
                  <ul>
                    {sortByDate(a.updates, (u) => u.date).map((u, i) => (
                      <li key={i}>
                        <strong>{formatDate(u.date)}</strong>: {u.note}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No progress notes.</p>
                )}
                <ProgressNote actionId={a.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="annual-h">
        <h2 id="annual-h">Annual updates</h2>
        {ws.annualUpdates.length === 0 ? (
          <EmptyState>No annual updates recorded.</EmptyState>
        ) : (
          <ul className="card-list">
            {ws.annualUpdates.map((u) => (
              <li key={u.id} className="card">
                <div className="form-grid">
                  <TextField label="Year" hint="E.g. 2027/28" value={u.year} onChange={(v) => patch(u.id, { year: v })} />
                  <TextField label="Submitted date" type="date" value={u.submittedDate} onChange={(v) => patch(u.id, { submittedDate: optionalDate(v) })} />
                </div>
                <TextArea label="Summary of progress" value={u.summary} onChange={(v) => patch(u.id, { summary: v })} />
                <fieldset>
                  <legend>QEP actions covered</legend>
                  {qepActions.length === 0 && <p className="muted">No post-review QEP actions recorded.</p>}
                  {qepActions.map((a) => (
                    <Checkbox
                      key={a.id}
                      label={a.title || 'Untitled action'}
                      checked={u.actionIds.includes(a.id)}
                      onChange={(on) =>
                        patch(u.id, { actionIds: on ? [...u.actionIds, a.id] : u.actionIds.filter((x) => x !== a.id) })
                      }
                    />
                  ))}
                </fieldset>
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => update((w) => ({ ...w, annualUpdates: w.annualUpdates.filter((x) => x.id !== u.id) }))}
                >
                  Delete annual update {u.year}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            update((w) => ({
              ...w,
              annualUpdates: [...w.annualUpdates, { id: newId(), year: String(new Date().getFullYear()), summary: '', actionIds: [] }],
            }))
          }
        >
          Add annual update
        </button>
      </section>
    </Page>
  );
}
