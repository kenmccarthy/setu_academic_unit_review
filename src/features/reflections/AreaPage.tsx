import { Link, Navigate, useParams } from 'react-router-dom';
import { getArea, questionsForArea } from '../../data/questionBank';
import { useWorkspace } from '../../state/WorkspaceContext';
import { Page } from '../../components/Page';
import { Badge, confidenceTone, workflowTone } from '../../components/Status';
import { CONFIDENCE_LABELS, WORKFLOW_LABELS } from '../../models/labels';
import { getReflection } from '../../models/workspace';

export function AreaPage() {
  const { areaId = '' } = useParams();
  const { workspace: ws } = useWorkspace();
  const area = getArea(areaId);
  if (!area) return <Navigate to="/areas" replace />;
  const qs = questionsForArea(area.id);

  return (
    <Page
      title={`${area.order}. ${area.title}`}
      breadcrumb={
        <ol>
          <li>
            <Link to="/areas">Review Areas</Link>
          </li>
          <li aria-current="page">{area.title}</li>
        </ol>
      }
      intro={
        <>
          <p>{area.introduction}</p>
          <details>
            <summary>Why this area matters</summary>
            <p>{area.purpose}</p>
            <ul>
              {area.policyReferences.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </details>
        </>
      }
    >
      <h2>Suggested questions</h2>
      <ol className="question-list">
        {qs.map((q) => {
          const r = getReflection(ws, q.id);
          return (
            <li key={q.id} className="card">
              <p className="q-id">{q.id}</p>
              <h3 className="h4">
                <Link to={`/areas/${area.id}/${q.id}`}>{q.question}</Link>
              </h3>
              <p className="badges">
                <Badge tone={workflowTone[r.status]}>{WORKFLOW_LABELS[r.status]}</Badge>
                {r.applicability === 'not_applicable' ? (
                  <Badge tone="neutral">Not applicable</Badge>
                ) : (
                  <Badge tone={confidenceTone[r.confidence]}>{CONFIDENCE_LABELS[r.confidence]}</Badge>
                )}
                <Badge tone="neutral">
                  {r.evidenceIds.length} evidence link{r.evidenceIds.length === 1 ? '' : 's'}
                </Badge>
              </p>
            </li>
          );
        })}
      </ol>
      <p>
        <Link className="btn btn-primary" to={`/areas/${area.id}/${qs[0].id}`}>
          Start with {qs[0].id}
        </Link>
      </p>
    </Page>
  );
}
