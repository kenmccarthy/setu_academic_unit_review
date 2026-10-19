# SETU Academic Unit Review Preparation Tool (prototype)

A static, browser-local web app to help an academic unit prepare for an academic unit review: reflective
self-evaluation, evidence gathering, stakeholder engagement, a draft Self-Evaluation Report (SER), and
tracking of provisional improvements and post-review quality enhancement actions.

> **Status: a product proposal and prototype.** It is not an approved SETU procedure, SER template or
> quality assurance standard. It does not decide academic quality, conduct a review, approve a report or
> replace institutional processes. The source of policy authority is the SETU *Academic Unit Reviews
> Policy* v1.0 (approved 23 September 2025). See [POLICY_MAPPING.md](POLICY_MAPPING.md).

> **Privacy:** This prototype stores information on this device/browser. It is not an approved repository
> for confidential institutional, staff or student data. Use fictional or non-sensitive material for
> testing. Export backups regularly. See [PRIVACY.md](PRIVACY.md).

## Features

| Area | What it does |
|---|---|
| Overview | Workflow measures (never quality ratings): responses recorded, evidence gaps, unresolved consultations, SER readiness, outstanding actions, next milestone, resume last section |
| Getting Started | Unit details, review period, scope, descriptive lifecycle stage, milestone register |
| Review Areas | 9 proposed areas × 5 suggested questions (45, stable IDs such as `SD-01`). Each question has guidance, prompts, evidence suggestions, response / strengths / challenges / proposed enhancements, applicability with reason, evidence links, confidence, status, owner, last edited, previous/next |
| Evidence Register | Reference-only register (no files stored), status, confidentiality, limitations, links to many questions |
| Stakeholder Engagement | Anonymised summaries by group, planned/completed dates, explicit “not yet consulted” |
| Findings & Gaps | Consolidated strengths, challenges, enhancements and evidence gaps, traced to questions and evidence; user-written cross-cutting synthesis |
| SER Builder | Include/exclude sections, executive summary, section narratives, evidence appendix selection, preview, **DOCX export**. Always labelled *Draft — structure pending confirmation against official SETU SER template* |
| Peer Review Preparation | Information-only readiness checklist; no panel appointment or approval controls |
| Quality Enhancement Plan | Pre-review provisional improvements kept separate from peer recommendations, unit/executive responses, post-review QEP actions and manually entered approval records; **QEP DOCX** |
| Monitoring | Dated progress notes per action and annual updates |
| Exports & Settings | Versioned JSON backup/restore with validation, CSV (evidence, engagement, actions, milestones), printable readiness report (browser *Save as PDF*), fictional sample, delete workspace |

Persistence is IndexedDB with debounced autosave (750 ms), an honest save indicator (it shows *Not
saved* with the reason when storage fails), and a `beforeunload` warning only while writes are pending.

## Local development

Requires Node.js 20+ (22 recommended).

```bash
npm ci
npm run dev          # http://localhost:5173
npm run lint
npm run typecheck
npm test             # unit + integration tests (Vitest, jsdom, fake-indexeddb)
npm run test:e2e     # Playwright + axe; builds and serves the production bundle
npm run build        # outputs dist/
npm run preview      # serve dist/
```

First-time Playwright users may need `npx playwright install chromium`.

To explore with data, open **Exports & Settings → Load fictional sample**, or import
[`samples/fictional-workspace.json`](samples/fictional-workspace.json). Regenerate that file with
`npx vite-node scripts/write-sample.ts`.

## Publishing to GitHub Pages

1. In the repository on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs lint, typecheck,
   unit and E2E tests, builds with `BASE_PATH=/<repository-name>/`, and deploys.
3. The site is served at `https://<owner>.github.io/<repository-name>/`.

The app uses hash routing (`#/areas/SD/SD-01`) so refreshes and deep links work without a server-side
404 fallback. Without `BASE_PATH` the build uses relative asset URLs and can be hosted from any folder.

## Architecture

- Vite + React 18 + TypeScript, static assets only; `react-router-dom` `HashRouter`.
- Data model and runtime validation: Zod (`src/models/schema.ts`), documented in
  [DATA_DICTIONARY.md](DATA_DICTIONARY.md).
- Storage: Dexie over IndexedDB (`src/db/indexedDb.ts`). localStorage holds only UI preferences
  (privacy notice acknowledged, high contrast, last page, last backup time).
- Exports: `docx` (lazy-loaded) for Word; CSV with formula-injection protection; print stylesheet.
- No remote fonts, analytics, CDNs or API calls. Production builds carry a Content Security Policy with
  `connect-src 'none'`.

```
src/app/            shell, navigation, routes
src/components/     accessible form fields, dialogs, badges, document preview
src/data/           question bank, policy mapping, fictional sample, copy
src/db/             IndexedDB persistence
src/models/         schema, labels, workspace operations and integrity checks
src/state/          workspace context with autosave
src/features/*      one folder per screen; SER and QEP composition logic
src/utils/          JSON/CSV/DOCX export, progress measures, dates, preferences
tests/unit/         Vitest unit and integration tests
tests/e2e/          Playwright end-to-end and axe accessibility tests
```

## Implemented vs deferred

Implemented: everything in the table above, the 45-question bank, persistence, JSON round-trip with
schema validation and an explicit migration framework, referential-integrity repair on import, internal
backup of the previous workspace before import/replace, CRUD for evidence, engagement, milestones,
improvements, recommendations, approvals and annual updates, DOCX/CSV/print exports, privacy notices,
high-contrast mode, automated tests.

Not implemented (by design for the prototype, or deferred):

- **No true PDF generator** — use the browser’s print dialog and *Save as PDF*.
- **No mapping to the official SER template** — it has not been supplied. The SER structure is a proposal.
  The unit can record that it checked the structure, which changes the draft label but not the content.
- Unknown fields in imported files are **dropped**, not preserved (safer than round-tripping unvalidated data).
- No multi-user collaboration, accounts, server storage, file uploads, emailing or AI.
- Word’s table of contents field is filled when the document is opened in Word (a static contents list is also included).
- `npm audit` reports two **moderate** advisories in React Router v6 (GHSA-wrjc-x8rr-h8h6, GHSA-337j-9hxr-rhxg),
  fixed only in v7. They concern links built from untrusted URLs and SSR hydration; this app navigates only
  to internal constant routes and has no SSR. Plan the v7 upgrade before production.
- Manual screen-reader testing (NVDA/JAWS/VoiceOver) has not yet been carried out; see [TESTING.md](TESTING.md).

## Before any live use

See specification §14: obtain the approved AUR Procedure and official SER template from OVPAA Teaching
and Learning; agree whether the nine areas should be reorganised; confirm permission to reproduce policy
excerpts and use SETU branding; confirm data classification; pilot with a representative unit; carry out
a security review and dependency scan.

## Licence

MIT for the source code (see [LICENSE](LICENSE)). No rights are granted in SETU names, marks or documents.
