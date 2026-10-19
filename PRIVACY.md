# Privacy and data handling

**This prototype stores information on this device/browser. It is not an approved repository for
confidential institutional, staff or student data. Use fictional or non-sensitive material for testing.
Export backups regularly.**

## Where data is stored

- All workspace content is stored in the browser’s **IndexedDB** for the site’s origin
  (database `setu-aur-prototype`). The five most recent internal copies of a replaced workspace are kept
  in the same database so an import or sample load never silently destroys data.
- `localStorage` holds only non-sensitive UI preferences, prefixed `setu-aur:`: privacy notice
  acknowledged, high-contrast mode, last page visited, time of last backup download.
- Nothing is sent to any server. There is no telemetry, analytics, remote font, CDN or API call. The
  production build sets a Content Security Policy with `connect-src 'none'`, and an automated test checks
  that no off-site requests are made.

## What this means

- Data is **not encrypted** by this tool. Anyone using the same browser profile on the same device may be
  able to read it.
- Data is **lost** if site data is cleared, the browser profile is removed, or private/incognito mode ends.
- Contributors working one after another in one browser share one workspace. This is **not** secure
  multi-user collaboration and there is no access control or audit log.
- JSON backups contain everything in the workspace. Store them according to the data they contain.

## What not to enter

- Names of students or staff, student numbers or other identifiers
- Individual performance, disciplinary, health or wellbeing information
- Special-category personal data
- Verbatim interview or focus-group transcripts (record anonymised themes instead)
- Confidential documents or their contents (record a reference to where they are held)

Mark sensitive evidence with the *Sensitive* confidentiality level and keep the material itself in an
approved institutional system.

## Deleting data

**Exports & Settings → Delete workspace** removes the workspace (it offers a backup download first).
To remove everything, including internal copies and preferences, clear site data for this site in the
browser settings.

## External links

References entered in the evidence register are shown as typed. Only `http(s)` URLs become links; they
open in a new tab with `rel="noopener noreferrer"` and are never fetched or checked by the tool.
