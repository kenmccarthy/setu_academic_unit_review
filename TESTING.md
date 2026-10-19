# Testing

| Command | What it runs |
|---|---|
| `npm run lint` | ESLint (TypeScript, React hooks; bans `dangerouslySetInnerHTML`) |
| `npm run typecheck` | `tsc -b` across app, tests and config |
| `npm test` | Vitest unit and integration tests in jsdom with `fake-indexeddb` |
| `npm run test:e2e` | Playwright against the production build (desktop Chrome and Pixel 7 profiles), with axe |

## Unit tests (`tests/unit`)

| File | Covers |
|---|---|
| `questionBank.test.ts` | 45 unique stable IDs, nine areas × five, nothing required |
| `workspace.test.ts` | Evidence cross-references (link, unlink, shared evidence, delete), referential-integrity repair, duplicate IDs |
| `progress.test.ts` | Workflow-status computation, evidence-gap rule, empty-state behaviour, milestones, date sorting |
| `csv.test.ts` | Formula-injection protection, quoting, BOM/CRLF, column sets |
| `exportJson.test.ts` | Round-trip, envelope, invalid/oversized/newer/malformed files, migrations, integrity warnings, committed sample file |
| `composeSer.test.ts` | SER and QEP composition: missing-content labels, exclusions, appendix numbering, not-applicable reasons, separation of provisional and post-review actions |
| `docx.test.ts` | DOCX generation with Unicode punctuation, Irish fadas, XML-special characters and very long paragraphs; footer carries policy version and export date |

## Integration tests

| File | Covers |
|---|---|
| `integration.test.tsx` | First-run privacy notice; answer → link evidence → reload → persisted; export → delete → import → identical; corrupt import rejected without changing stored data; every sidebar section; all 45 question pages |
| `storageFailure.test.tsx` | Storage denied → visible “Not saved” with reason; never shows “Saved” |

## End-to-end tests (`tests/e2e`)

Keyboard skip link and visible focus; keyboard-only navigation to and through a question; persistence
across reload and deep hash links; backup download → delete → import round-trip; DOCX and CSV downloads;
no off-origin network requests; mobile menu and no horizontal overflow; axe (WCAG 2.0/2.1/2.2 A and AA
tags) on all 14 screens with zero serious or critical violations.

## Manual checks still required

Automated checks do not replace these. Record results before any pilot.

- [ ] Screen reader smoke test (NVDA + Firefox, JAWS + Chrome, VoiceOver + Safari): navigation landmarks,
      page title announcement after navigation, form labels and hints, save-status announcements, dialogs.
- [ ] Keyboard-only walk-through of every screen, including dialogs and the question picker.
- [ ] 200% and 400% zoom; Windows High Contrast / forced colours; the in-app high-contrast mode.
- [ ] Open exported DOCX files in Microsoft Word and LibreOffice; update the contents field.
- [ ] Print the readiness report and save as PDF in Chrome, Firefox and Safari.
- [ ] Open CSV exports in Excel and confirm formula-like cells show as text.
- [ ] Storage-full behaviour on a real device (quota exceeded) and private browsing modes.
- [ ] Security review and dependency scan before deployment (`npm audit`, Dependabot is configured).
