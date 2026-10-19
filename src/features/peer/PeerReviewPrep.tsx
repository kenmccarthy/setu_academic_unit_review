import { Link } from 'react-router-dom';
import { useWorkspace } from '../../state/WorkspaceContext';
import { Page } from '../../components/Page';
import { SelectField, TextArea, labelled } from '../../components/Fields';
import { Badge, Notice, type Tone } from '../../components/Status';
import { CHECK_STATUS, type CheckStatus } from '../../models/schema';
import { CHECK_STATUS_LABELS } from '../../models/labels';
import { evidenceNeedingAttention, missingResponses, unresolvedConsultations } from '../../utils/progress';
import { serReadiness } from '../ser/composeSer';

export const PEER_CHECKLIST = [
  { id: 'ser_version', label: 'SER version identified', hint: 'Which draft or version will be shared, and who in unit management has signed it off.' },
  { id: 'evidence_index', label: 'Evidence index prepared', hint: 'A numbered list of evidence referenced in the SER, with access arrangements.' },
  { id: 'stakeholder_representation', label: 'Stakeholder representation considered', hint: 'Which staff, student and external groups could meet the panel, subject to institutional arrangements.' },
  { id: 'logistics', label: 'Logistical dependencies noted', hint: 'Rooms, scheduling, access and accessibility needs to raise with those organising the visit.' },
  { id: 'briefing_materials', label: 'Briefing materials prepared', hint: 'Context documents for participants; no personal data.' },
  { id: 'discussion_themes', label: 'Possible themes for discussion', hint: 'Topics the unit expects the panel may wish to explore.' },
  { id: 'unresolved_issues', label: 'Unresolved issues recorded', hint: 'Matters still open, so they can be acknowledged honestly.' },
] as const;

const tone: Record<CheckStatus, Tone> = { not_started: 'neutral', in_progress: 'info', done: 'good', not_applicable: 'neutral' };

export function PeerReviewPrep() {
  const { workspace: ws, update } = useWorkspace();
  const ser = serReadiness(ws);
  const hints: Record<string, string> = {
    ser_version: `${ser.withContent} of ${ser.included} draft SER sections have content.`,
    evidence_index: `${ser.appendixItems} evidence item(s) selected for the appendix; ${evidenceNeedingAttention(ws).length} item(s) not yet available.`,
    stakeholder_representation: `${unresolvedConsultations(ws).length} consultation(s) not marked complete.`,
    unresolved_issues: `${missingResponses(ws).length} applicable question(s) have no response yet.`,
  };
  const item = (id: string) => ws.peerReviewChecklist[id] ?? { status: 'not_started' as CheckStatus, notes: '' };
  const setItem = (id: string, patch: Partial<{ status: CheckStatus; notes: string }>) =>
    update((w) => ({
      ...w,
      peerReviewChecklist: { ...w.peerReviewChecklist, [id]: { ...item(id), ...w.peerReviewChecklist[id], ...patch } },
    }));

  return (
    <Page
      title="Peer Review Preparation"
      intro={<p>An information-only checklist to help the unit get ready for independent peer review.</p>}
    >
      <Notice tone="info" title="Who does what">
        <p>
          Under the policy, the peer review group is appointed and approved by the Joint Quality Committee and
          includes a chair, external academic and professional representatives, an external student and a
          secretary. The unit does not appoint panel members or approve the site visit, and nothing on this page does
          either.
        </p>
      </Notice>
      <ol className="card-list">
        {PEER_CHECKLIST.map((c) => {
          const v = item(c.id);
          return (
            <li key={c.id} className="card">
              <div className="card-head">
                <h2 className="h3">{c.label}</h2>
                <Badge tone={tone[v.status]}>{CHECK_STATUS_LABELS[v.status]}</Badge>
              </div>
              <p className="hint">{c.hint}</p>
              {hints[c.id] && <p className="muted">From your workspace: {hints[c.id]}</p>}
              <SelectField
                label={`Status: ${c.label}`}
                value={v.status}
                options={labelled(CHECK_STATUS, CHECK_STATUS_LABELS)}
                onChange={(s) => setItem(c.id, { status: s })}
              />
              <TextArea label={`Notes: ${c.label}`} rows={3} value={v.notes} onChange={(n) => setItem(c.id, { notes: n })} />
            </li>
          );
        })}
      </ol>
      <p>
        Print a <Link to="/readiness-report">readiness report</Link> summarising missing responses, evidence and
        consultations.
      </p>
    </Page>
  );
}
