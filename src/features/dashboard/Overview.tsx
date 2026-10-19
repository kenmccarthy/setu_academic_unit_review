import { Link } from 'react-router-dom';
import { AREAS } from '../../data/questionBank';
import { useWorkspace } from '../../state/WorkspaceContext';
import { Page } from '../../components/Page';
import { Badge, Notice } from '../../components/Status';
import { LIFECYCLE_LABELS } from '../../models/labels';
import { formatDate } from '../../utils/dates';
import { getPref } from '../../utils/prefs';
import {
  evidenceNeedingAttention,
  nextMilestone,
  outstandingActions,
  overallProgress,
  unresolvedConsultations,
} from '../../utils/progress';
import { serReadiness } from '../ser/composeSer';

function Stat({ label, value, to, note }: { label: string; value: string | number; to: string; note?: string }) {
  return (
    <li className="stat">
      <Link to={to}>
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {note && <span className="stat-note">{note}</span>}
      </Link>
    </li>
  );
}

export function Overview() {
  const { workspace: ws } = useWorkspace();
  const p = overallProgress(ws);
  const next = nextMilestone(ws);
  const lastPath = getPref('lastPath');
  const ser = serReadiness(ws);

  return (
    <Page
      title="Overview"
      intro={
        <p>
          A summary of preparation work for <strong>{ws.name}</strong>. Every count below is a{' '}
          <strong>workflow measure</strong> (how much has been recorded), never a rating of academic quality.
        </p>
      }
    >
      {lastPath && lastPath !== '/' && (
        <p>
          <Link className="btn btn-primary" to={lastPath}>
            Resume where you left off
          </Link>
        </p>
      )}

      <dl className="meta-grid">
        <div>
          <dt>Lifecycle stage (descriptive)</dt>
          <dd>{LIFECYCLE_LABELS[ws.lifecycleStage]}</dd>
        </div>
        <div>
          <dt>Review period</dt>
          <dd>
            {formatDate(ws.reviewStart)} to {formatDate(ws.reviewEnd)}
          </dd>
        </div>
        <div>
          <dt>Policy source</dt>
          <dd>{ws.policyVersion}</dd>
        </div>
        <div>
          <dt>Next milestone</dt>
          <dd>
            {next ? (
              <>
                {next.title} — {formatDate(next.dueDate)} {next.overdue && <Badge tone="bad">Overdue</Badge>}
              </>
            ) : (
              <Link to="/getting-started#milestones">No open milestones recorded</Link>
            )}
          </dd>
        </div>
      </dl>

      <h2>Workflow measures</h2>
      <ul className="stats">
        <Stat label="questions with a recorded response" value={`${p.withResponse} / ${p.total}`} to="/areas" />
        <Stat label="questions marked complete" value={p.complete} to="/areas" />
        <Stat label="questions marked not applicable" value={p.notApplicable} to="/areas" />
        <Stat
          label="questions with an evidence gap"
          value={p.questionEvidenceGaps}
          to="/findings"
          note="marked 'gap', or a response with no linked evidence"
        />
        <Stat label="evidence items not yet available" value={evidenceNeedingAttention(ws).length} to="/evidence" />
        <Stat label="consultations not completed" value={unresolvedConsultations(ws).length} to="/engagement" />
        <Stat
          label="draft SER sections with content"
          value={`${ser.withContent} / ${ser.included}`}
          to="/ser"
        />
        <Stat label="outstanding actions" value={outstandingActions(ws).length} to="/qep" />
      </ul>

      <h2>Section completion</h2>
      <div className="table-wrap" role="region" aria-label="Section completion table" tabIndex={0}>
        <table>
          <caption className="visually-hidden">Questions by workflow status for each review area</caption>
          <thead>
            <tr>
              <th scope="col">Review area</th>
              <th scope="col">Not started</th>
              <th scope="col">Draft</th>
              <th scope="col">Ready for review</th>
              <th scope="col">Complete</th>
              <th scope="col">Not applicable</th>
              <th scope="col">Evidence gaps</th>
            </tr>
          </thead>
          <tbody>
            {p.areas.map((a) => {
              const area = AREAS.find((x) => x.id === a.areaId)!;
              return (
                <tr key={a.areaId}>
                  <th scope="row">
                    <Link to={`/areas/${a.areaId}`}>{area.title}</Link>
                  </th>
                  <td>{a.byStatus.not_started}</td>
                  <td>{a.byStatus.draft}</td>
                  <td>{a.byStatus.ready_for_review}</td>
                  <td>{a.byStatus.complete}</td>
                  <td>{a.notApplicable}</td>
                  <td>{a.evidenceGaps}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Notice tone="info" title="Status changes are descriptive">
        <p>
          Moving between lifecycle stages or marking work complete records where your preparation is. It is not an
          institutional approval and does not submit anything.
        </p>
      </Notice>
    </Page>
  );
}
