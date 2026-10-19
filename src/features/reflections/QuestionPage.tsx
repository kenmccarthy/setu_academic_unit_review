import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { QUESTIONS, getArea, getQuestion, questionsForArea } from '../../data/questionBank';
import { useWorkspace } from '../../state/WorkspaceContext';
import { Page } from '../../components/Page';
import { SelectField, TextArea, TextField, labelled } from '../../components/Fields';
import { Badge, Notice, evidenceTone } from '../../components/Status';
import { APPLICABILITY, CONFIDENCE, WORKFLOW_STATUS, type Reflection } from '../../models/schema';
import {
  APPLICABILITY_LABELS,
  CONFIDENCE_LABELS,
  EVIDENCE_STATUS_LABELS,
  WORKFLOW_LABELS,
} from '../../models/labels';
import { getReflection, linkEvidence, newEvidence, unlinkEvidence } from '../../models/workspace';
import { formatDateTime, nowIso } from '../../utils/dates';

export function QuestionPage() {
  const { areaId = '', questionId = '' } = useParams();
  const navigate = useNavigate();
  const { workspace: ws, update } = useWorkspace();
  const [newTitle, setNewTitle] = useState('');
  const [toLink, setToLink] = useState('');
  const q = getQuestion(questionId);
  const area = getArea(areaId);
  if (!q || !area || q.areaId !== area.id) return <Navigate to="/areas" replace />;

  const r = getReflection(ws, q.id);
  const areaQs = questionsForArea(area.id);
  const globalIndex = QUESTIONS.findIndex((x) => x.id === q.id);
  const prev = QUESTIONS[globalIndex - 1];
  const next = QUESTIONS[globalIndex + 1];

  const patch = (p: Partial<Reflection>) =>
    update((w) => {
      const cur = getReflection(w, q.id);
      const merged = { ...cur, ...p, updatedAt: nowIso() };
      // Typing into a not-started question moves it to draft automatically.
      if (cur.status === 'not_started' && !('status' in p)) merged.status = 'draft';
      return { ...w, questions: { ...w.questions, [q.id]: merged } };
    });

  const linked = ws.evidence.filter((e) => r.evidenceIds.includes(e.id));
  const unlinked = ws.evidence.filter((e) => !r.evidenceIds.includes(e.id));
  const na = r.applicability === 'not_applicable';

  return (
    <Page
      title={`${q.id}: ${q.question}`}
      breadcrumb={
        <ol>
          <li>
            <Link to="/areas">Review Areas</Link>
          </li>
          <li>
            <Link to={`/areas/${area.id}`}>{area.title}</Link>
          </li>
          <li aria-current="page">{q.id}</li>
        </ol>
      }
      intro={
        <>
          <p className="muted">
            Suggested question {areaQs.findIndex((x) => x.id === q.id) + 1} of {areaQs.length} in {area.title}. Not
            mandatory.
          </p>
          <p>
            <strong>Reflective guidance:</strong> {q.purpose}
          </p>
        </>
      }
    >
      <div className="question-layout">
        <div className="question-main">
          <details className="guidance">
            <summary>Why this matters</summary>
            <p>{area.purpose}</p>
            <ul>
              {q.policyReferences.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </details>
          <details className="guidance">
            <summary>Prompts to consider</summary>
            <ul>
              {q.prompts.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </details>
          <details className="guidance">
            <summary>Example of a reflective response pattern</summary>
            <p>{q.reflectionExample}</p>
            <p className="muted">
              This describes a structure, not model content. Write about your own unit, with your own evidence.
            </p>
          </details>
          <details className="guidance">
            <summary>Evidence suggestions</summary>
            <ul>
              {q.evidenceSuggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </details>

          <SelectField
            label="Does this question apply to the unit?"
            value={r.applicability}
            options={labelled(APPLICABILITY, APPLICABILITY_LABELS)}
            onChange={(v) => patch({ applicability: v })}
          />
          {na && (
            <TextField
              label="Reason it does not apply"
              hint="A short reason helps reviewers understand the decision."
              value={r.notApplicableReason}
              onChange={(v) => patch({ notApplicableReason: v })}
            />
          )}

          <TextArea
            label="Response"
            hint="Describe current practice with a concrete example, its evidence, limitations and dissenting views."
            rows={8}
            value={r.response}
            onChange={(v) => patch({ response: v })}
          />
          <TextArea label="Strengths" rows={3} value={r.strengths} onChange={(v) => patch({ strengths: v })} />
          <TextArea
            label="Challenges or concerns"
            rows={3}
            value={r.challenges}
            onChange={(v) => patch({ challenges: v })}
          />
          <TextArea
            label="Proposed enhancements"
            hint="Provisional ideas only. Formal actions are agreed after peer review."
            rows={3}
            value={r.improvementIdeas}
            onChange={(v) => patch({ improvementIdeas: v })}
          />

          <section aria-labelledby="ev-h" className="linked-evidence">
            <h2 id="ev-h" className="h3">
              Linked evidence
            </h2>
            {linked.length === 0 ? (
              <p className="empty-state">No evidence linked to this question yet.</p>
            ) : (
              <ul>
                {linked.map((e) => (
                  <li key={e.id}>
                    <span>{e.title || 'Untitled evidence'}</span>{' '}
                    <Badge tone={evidenceTone[e.status]}>{EVIDENCE_STATUS_LABELS[e.status]}</Badge>{' '}
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => update((w) => unlinkEvidence(w, q.id, e.id))}
                    >
                      Unlink<span className="visually-hidden"> {e.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {unlinked.length > 0 && (
              <div className="inline-form">
                <SelectField
                  label="Link existing evidence"
                  value={toLink}
                  options={[{ value: '', label: 'Choose evidence…' }, ...unlinked.map((e) => ({ value: e.id, label: e.title || 'Untitled evidence' }))]}
                  onChange={setToLink}
                />
                <button
                  type="button"
                  className="btn"
                  disabled={!toLink}
                  onClick={() => {
                    update((w) => linkEvidence(w, q.id, toLink));
                    setToLink('');
                  }}
                >
                  Link
                </button>
              </div>
            )}
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                const title = newTitle.trim();
                if (!title) return;
                const ev = newEvidence({ title });
                update((w) => linkEvidence({ ...w, evidence: [...w.evidence, ev] }, q.id, ev.id));
                setNewTitle('');
              }}
            >
              <TextField
                label="Add new evidence item and link it"
                hint="Creates an entry in the evidence register with status ‘requested’. Add details there."
                value={newTitle}
                onChange={setNewTitle}
              />
              <button type="submit" className="btn" disabled={!newTitle.trim()}>
                Add and link
              </button>
            </form>
          </section>

          <div className="form-grid">
            <SelectField
              label="Evidence confidence"
              hint="Your judgement of how well evidence supports the response. Not a quality rating."
              value={r.confidence}
              options={labelled(CONFIDENCE, CONFIDENCE_LABELS)}
              onChange={(v) => patch({ confidence: v })}
            />
            <SelectField
              label="Workflow status"
              value={r.status}
              options={labelled(WORKFLOW_STATUS, WORKFLOW_LABELS)}
              onChange={(v) => patch({ status: v })}
            />
            <TextField label="Owner (role)" value={r.owner} onChange={(v) => patch({ owner: v || undefined })} />
          </div>
          <p className="muted">Last edited: {r.updatedAt ? formatDateTime(r.updatedAt) : 'never'}</p>

          {r.response.trim() && r.evidenceIds.length === 0 && !na && (
            <Notice tone="warn">
              <p>This response has no linked evidence. It will be listed as an evidence gap.</p>
            </Notice>
          )}
        </div>

        <aside className="question-aside" aria-labelledby="area-qs">
          <h2 id="area-qs" className="h4">
            Questions in this area
          </h2>
          <ol>
            {areaQs.map((x) => {
              const xr = getReflection(ws, x.id);
              return (
                <li key={x.id}>
                  <Link to={`/areas/${area.id}/${x.id}`} aria-current={x.id === q.id ? 'page' : undefined}>
                    {x.id}
                  </Link>{' '}
                  <span className="muted">{WORKFLOW_LABELS[xr.status]}</span>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      <nav className="pager" aria-label="Question navigation">
        {prev ? (
          <button type="button" className="btn" onClick={() => navigate(`/areas/${prev.areaId}/${prev.id}`)}>
            ← Previous: {prev.id}
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/areas/${next.areaId}/${next.id}`)}>
            Next: {next.id} →
          </button>
        ) : (
          <Link className="btn btn-primary" to="/findings">
            Review findings &amp; gaps →
          </Link>
        )}
      </nav>
    </Page>
  );
}
