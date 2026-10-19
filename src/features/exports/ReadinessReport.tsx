import { Link } from 'react-router-dom';
import { getArea } from '../../data/questionBank';
import { useWorkspace } from '../../state/WorkspaceContext';
import { Page } from '../../components/Page';
import { EVIDENCE_STATUS_LABELS, MILESTONE_STATUS_LABELS, STAKEHOLDER_LABELS } from '../../models/labels';
import { STAKEHOLDER_GROUPS } from '../../models/schema';
import { formatDate, todayDate } from '../../utils/dates';
import {
  evidenceNeedingAttention,
  groupsNotEngaged,
  missingResponses,
  overallProgress,
  unresolvedConsultations,
  upcomingMilestones,
} from '../../utils/progress';

export function ReadinessReport() {
  const { workspace: ws } = useWorkspace();
  const p = overallProgress(ws);
  const missing = missingResponses(ws);
  const ev = evidenceNeedingAttention(ws);
  const cons = unresolvedConsultations(ws);
  const groups = groupsNotEngaged(ws, STAKEHOLDER_GROUPS.filter((g) => g !== 'other'));
  const ms = upcomingMilestones(ws).slice(0, 10);

  return (
    <Page
      title="Readiness report"
      breadcrumb={
        <ol>
          <li>
            <Link to="/exports">Exports &amp; Settings</Link>
          </li>
          <li aria-current="page">Readiness report</li>
        </ol>
      }
    >
      <div className="no-print button-row">
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
      <div className="report">
        <p>
          <strong>{ws.name}</strong> · generated {formatDate(todayDate())} · policy source: {ws.policyVersion}
        </p>
        <p className="report-disclaimer">
          This report lists outstanding preparation work. It is not a pass/fail verdict and does not rate academic
          quality.
        </p>
        <h2>Summary of recorded work</h2>
        <ul>
          <li>{p.withResponse} of {p.total} suggested questions have a response; {p.notApplicable} marked not applicable.</li>
          <li>{p.questionEvidenceGaps} question(s) show an evidence gap.</li>
          <li>{ev.length} evidence item(s) not yet available.</li>
          <li>{cons.length} consultation(s) not marked complete.</li>
        </ul>

        <h2>Questions without a response ({missing.length})</h2>
        {missing.length ? (
          <ul className="columns">
            {missing.map((q) => (
              <li key={q.id}>
                {q.id} <span className="muted">({getArea(q.areaId)?.title})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>None.</p>
        )}

        <h2>Evidence not yet available ({ev.length})</h2>
        {ev.length ? (
          <table>
            <thead>
              <tr><th scope="col">Evidence</th><th scope="col">Status</th><th scope="col">Owner</th><th scope="col">Supports</th></tr>
            </thead>
            <tbody>
              {ev.map((e) => (
                <tr key={e.id}>
                  <td>{e.title || 'Untitled'}</td>
                  <td>{EVIDENCE_STATUS_LABELS[e.status]}</td>
                  <td>{e.owner || '—'}</td>
                  <td>{e.questionIds.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>None.</p>
        )}

        <h2>Incomplete consultations ({cons.length})</h2>
        {cons.length ? (
          <ul>
            {cons.map((g) => (
              <li key={g.id}>
                {STAKEHOLDER_LABELS[g.stakeholderGroup]}: {g.method || 'method not recorded'}
                {g.notYetConsulted ? ' — not yet consulted' : g.plannedDate ? ` — planned ${formatDate(g.plannedDate)}` : ' — not scheduled'}
              </li>
            ))}
          </ul>
        ) : (
          <p>None.</p>
        )}
        {groups.length > 0 && (
          <p>Groups with no recorded engagement: {groups.map((g) => STAKEHOLDER_LABELS[g as keyof typeof STAKEHOLDER_LABELS]).join(', ')}.</p>
        )}

        <h2>Upcoming milestones</h2>
        {ms.length ? (
          <table>
            <thead>
              <tr><th scope="col">Milestone</th><th scope="col">Due</th><th scope="col">Owner</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              {ms.map((m) => (
                <tr key={m.id}>
                  <td>{m.title}</td>
                  <td>{formatDate(m.dueDate)}{m.overdue ? ' (overdue)' : ''}</td>
                  <td>{m.owner || '—'}</td>
                  <td>{MILESTONE_STATUS_LABELS[m.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No open milestones recorded.</p>
        )}
      </div>
    </Page>
  );
}
