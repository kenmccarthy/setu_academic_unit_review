import { Page } from '../../components/Page';
import { Notice } from '../../components/Status';
import { NOT_PROVIDED_BY_POLICY, POLICY_MAPPING, POLICY_SOURCE } from '../../data/policyMapping';
import { LIFECYCLE_STAGES } from '../../models/schema';
import { LIFECYCLE_LABELS } from '../../models/labels';
import { PRIVACY_WARNING } from '../../data/copy';

export function HelpPage() {
  return (
    <Page title="Help & Policy" intro={<p>What this tool is, what it is not, and how it relates to the policy.</p>}>
      <Notice tone="warn" title="A support tool, not an official process">
        <p>
          This prototype does not decide academic quality, conduct a review, approve a report or replace
          institutional processes. Status changes describe preparation work; they are never approvals.
        </p>
      </Notice>

      <h2>Source of authority</h2>
      <p>{POLICY_SOURCE.label}. Consult the policy itself; the summaries below are short paraphrases.</p>
      <div className="table-wrap" role="region" aria-label="Policy mapping table" tabIndex={0}>
        <table>
          <caption className="visually-hidden">Policy anchors and how the tool responds</caption>
          <thead>
            <tr>
              <th scope="col">Policy anchor</th>
              <th scope="col">Requirement (summary)</th>
              <th scope="col">What this tool does (a proposal)</th>
            </tr>
          </thead>
          <tbody>
            {POLICY_MAPPING.map((m) => (
              <tr key={m.anchor}>
                <th scope="row">{m.anchor}</th>
                <td>{m.requirement}</td>
                <td>{m.implementation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Not provided by this tool</h2>
      <p>The tool does not invent the following. Obtain current official documents before any live use:</p>
      <ul>
        {NOT_PROVIDED_BY_POLICY.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>

      <h2>Lifecycle stages</h2>
      <p>Stages are descriptive. You can move between them in any order.</p>
      <ol>
        {LIFECYCLE_STAGES.map((s) => (
          <li key={s}>{LIFECYCLE_LABELS[s]}</li>
        ))}
      </ol>

      <h2>Privacy and storage</h2>
      <p>{PRIVACY_WARNING}</p>
      <ul>
        <li>Data is held in this browser’s IndexedDB storage. It is not encrypted by this tool and is not shared.</li>
        <li>Anyone using the same browser profile may be able to read it.</li>
        <li>Clearing site data deletes it. Download backups from Exports &amp; Settings.</li>
        <li>No analytics, telemetry or network requests are made. A Content Security Policy blocks outbound connections.</li>
        <li>Contributors working one after another on the same browser share one workspace. This is not secure multi-user collaboration.</li>
      </ul>

      <h2>Keyboard use</h2>
      <ul>
        <li>Use Tab and Shift+Tab to move between controls; a visible outline shows focus.</li>
        <li>“Skip to main content” is the first item on every page.</li>
        <li>Expandable guidance uses standard disclosure controls: press Enter or Space to open.</li>
        <li>Dialogs close with Escape.</li>
      </ul>
    </Page>
  );
}
