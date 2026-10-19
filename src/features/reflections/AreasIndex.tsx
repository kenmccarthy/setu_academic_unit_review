import { Link } from 'react-router-dom';
import { AREAS } from '../../data/questionBank';
import { useWorkspace } from '../../state/WorkspaceContext';
import { Page } from '../../components/Page';
import { Notice } from '../../components/Status';
import { areaProgress } from '../../utils/progress';

export function AreasIndex() {
  const { workspace: ws } = useWorkspace();
  return (
    <Page
      title="Review Areas"
      intro={
        <p>
          Nine proposed thematic areas with five suggested questions each. Answer in any order. None of the questions
          is mandatory, and the structure is not the official SETU SER template.
        </p>
      }
    >
      <ol className="area-grid">
        {AREAS.map((a) => {
          const p = areaProgress(ws, a.id);
          return (
            <li key={a.id} className="card">
              <h2 className="h3">
                <Link to={`/areas/${a.id}`}>
                  {a.order}. {a.title}
                </Link>
              </h2>
              <p>{a.introduction}</p>
              <p className="muted">
                {p.withResponse} of {p.total} with a response · {p.byStatus.complete} complete · {p.notApplicable} not
                applicable · {p.evidenceGaps} evidence gap{p.evidenceGaps === 1 ? '' : 's'}
              </p>
            </li>
          );
        })}
      </ol>
      <Notice tone="info">
        <p>Progress figures describe recorded work only. They are not quality scores.</p>
      </Notice>
    </Page>
  );
}
