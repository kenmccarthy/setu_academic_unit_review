import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { QUESTIONS, getArea, type Question } from '../../data/questionBank';
import { useWorkspace } from '../../state/WorkspaceContext';
import { Page, EmptyState } from '../../components/Page';
import { TextArea } from '../../components/Fields';
import { Badge, Notice, evidenceTone } from '../../components/Status';
import { CONFIDENCE_LABELS, EVIDENCE_STATUS_LABELS } from '../../models/labels';
import type { Reflection, Workspace } from '../../models/schema';
import { getReflection, newImprovement } from '../../models/workspace';
import { evidenceNeedingAttention, hasEvidenceGap } from '../../utils/progress';

type Key = 'strengths' | 'challenges' | 'improvementIdeas';

function collect(ws: Workspace, key: Key) {
  return QUESTIONS.map((q) => ({ q, r: getReflection(ws, q.id) })).filter(
    ({ r }) => r.applicability !== 'not_applicable' && r[key].trim(),
  );
}

function QLink({ q }: { q: Question }) {
  return (
    <Link to={`/areas/${q.areaId}/${q.id}`}>
      {q.id}
      <span className="visually-hidden"> {q.question}</span>
    </Link>
  );
}

function EvidenceList({ ws, r }: { ws: Workspace; r: Reflection }) {
  const items = ws.evidence.filter((e) => r.evidenceIds.includes(e.id));
  if (!items.length) return <span className="muted">No linked evidence</span>;
  return <span>{items.map((e) => e.title || 'Untitled').join('; ')}</span>;
}

function FindingTable({
  caption,
  rows,
  ws,
  field,
  action,
}: {
  caption: string;
  rows: { q: Question; r: Reflection }[];
  ws: Workspace;
  field: Key;
  action?: (q: Question, r: Reflection) => ReactNode;
}) {
  if (!rows.length) return <EmptyState>Nothing recorded yet. Entries appear here as you complete questions.</EmptyState>;
  return (
    <div className="table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Question</th>
            <th scope="col">Recorded text</th>
            <th scope="col">Evidence</th>
            {action && <th scope="col">Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ q, r }) => (
            <tr key={q.id}>
              <th scope="row">
                <QLink q={q} />
                <br />
                <span className="muted">{getArea(q.areaId)?.title}</span>
              </th>
              <td className="pre-wrap">{r[field]}</td>
              <td>
                <EvidenceList ws={ws} r={r} />
              </td>
              {action && <td>{action(q, r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FindingsPage() {
  const { workspace: ws, update } = useWorkspace();
  const gaps = QUESTIONS.map((q) => ({ q, r: getReflection(ws, q.id) })).filter(({ r }) => hasEvidenceGap(r));
  const evAttention = evidenceNeedingAttention(ws);
  const provisionalFor = (qid: string) => ws.improvements.some((i) => i.origin === 'self_evaluation' && i.relatedQuestionIds.includes(qid));

  return (
    <Page
      title="Findings & Gaps"
      intro={
        <p>
          A consolidated view of what you have written, traced back to each question and its evidence. Nothing here
          is generated: empty fields stay empty.
        </p>
      }
    >
      <section aria-labelledby="str-h">
        <h2 id="str-h">Strengths</h2>
        <FindingTable caption="Strengths by question" rows={collect(ws, 'strengths')} ws={ws} field="strengths" />
      </section>
      <section aria-labelledby="con-h">
        <h2 id="con-h">Challenges and concerns</h2>
        <FindingTable caption="Challenges by question" rows={collect(ws, 'challenges')} ws={ws} field="challenges" />
      </section>
      <section aria-labelledby="opp-h">
        <h2 id="opp-h">Opportunities and proposed enhancements</h2>
        <FindingTable
          caption="Proposed enhancements by question"
          rows={collect(ws, 'improvementIdeas')}
          ws={ws}
          field="improvementIdeas"
          action={(q, r) =>
            provisionalFor(q.id) ? (
              <Link to="/qep#provisional">Provisional improvement recorded</Link>
            ) : (
              <button
                type="button"
                className="btn btn-small"
                onClick={() =>
                  update((w) => ({
                    ...w,
                    improvements: [
                      ...w.improvements,
                      newImprovement('self_evaluation', {
                        title: `Enhancement from ${q.id}`,
                        rationale: r.improvementIdeas,
                        relatedQuestionIds: [q.id],
                      }),
                    ],
                  }))
                }
              >
                Track as provisional improvement<span className="visually-hidden"> for {q.id}</span>
              </button>
            )
          }
        />
      </section>
      <section aria-labelledby="gap-h">
        <h2 id="gap-h">Evidence gaps</h2>
        <h3>Questions</h3>
        {gaps.length === 0 ? (
          <EmptyState>No question-level evidence gaps recorded.</EmptyState>
        ) : (
          <ul>
            {gaps.map(({ q, r }) => (
              <li key={q.id}>
                <QLink q={q} /> {q.question} —{' '}
                {r.confidence === 'gap' ? (
                  <Badge tone="bad">{CONFIDENCE_LABELS.gap}</Badge>
                ) : (
                  <Badge tone="warn">Response with no linked evidence</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
        <h3>Evidence items not yet available</h3>
        {evAttention.length === 0 ? (
          <EmptyState>All registered evidence is marked available.</EmptyState>
        ) : (
          <ul>
            {evAttention.map((e) => (
              <li key={e.id}>
                <Link to="/evidence">{e.title || 'Untitled evidence'}</Link>{' '}
                <Badge tone={evidenceTone[e.status]}>{EVIDENCE_STATUS_LABELS[e.status]}</Badge>
                {e.questionIds.length > 0 && <span className="muted"> supports {e.questionIds.join(', ')}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="syn-h">
        <h2 id="syn-h">Cross-cutting synthesis</h2>
        <Notice tone="info">
          <p>Write your own synthesis of themes that run across areas. It is used in the draft SER.</p>
        </Notice>
        <TextArea
          label="Cross-cutting findings"
          rows={8}
          value={ws.ser.sectionNarratives.cross_cutting}
          onChange={(v) =>
            update((w) => ({ ...w, ser: { ...w.ser, sectionNarratives: { ...w.ser.sectionNarratives, cross_cutting: v } } }))
          }
        />
      </section>
    </Page>
  );
}
