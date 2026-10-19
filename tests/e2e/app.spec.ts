import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

async function start(page: Page, hash = '#/') {
  await page.addInitScript(() => localStorage.setItem('setu-aur:privacyAcknowledged', 'yes'));
  await page.goto(`./${hash}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function openNav(page: Page) {
  const toggle = page.getByRole('button', { name: 'Menu' });
  if (await toggle.isVisible()) await toggle.click();
}

test('first-run privacy notice is shown and dismissable', async ({ page }) => {
  await page.goto('./');
  const dialog = page.getByRole('dialog', { name: 'Before you start' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('It is not an approved repository for confidential institutional');
  await dialog.getByRole('button', { name: 'I understand' }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Before you start' })).toBeHidden();
});

test('keyboard: skip link and visible focus', async ({ page }) => {
  await start(page);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  const outline = await skip.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('keyboard-only navigation reaches a question and answers it', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'keyboard flow checked on desktop');
  await start(page);
  const link = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Review Areas' });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Review Areas' })).toBeFocused();
  await page.getByRole('link', { name: '2. Teaching, Learning and Assessment' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: /Start with TLA-01/ }).focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('Response').focus();
  await page.keyboard.type('Keyboard typed response.');
  await page.getByRole('button', { name: /Next: TLA-02/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/areas\/TLA\/TLA-02$/);
});

test('question progress persists across reload and deep hash links', async ({ page }) => {
  await start(page, '#/areas/SES/SES-03');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('SES-03');
  await page.getByLabel('Response').fill('Induction has been redesigned for part-time learners.');
  await page.getByLabel('Workflow status').selectOption('ready_for_review');
  await expect(page.getByRole('status').filter({ hasText: 'Saved in this browser' })).toBeVisible({ timeout: 5000 });
  await page.reload();
  await expect(page.getByLabel('Response')).toHaveValue('Induction has been redesigned for part-time learners.');
  await page.goto('./#/areas/SES');
  await expect(page.locator('.question-list li').filter({ hasText: 'SES-03' })).toContainText('Ready for review');
  await page.goto('./#/');
  await expect(page.getByText('questions with a recorded response')).toBeVisible();
});

test('backup download, delete, import round-trip', async ({ page }) => {
  await start(page, '#/exports');
  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Load fictional sample…' }).click();
  await page.getByRole('button', { name: 'Replace with sample' }).click();
  await expect(page.getByText('Fictional sample loaded')).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download backup (.json)' }).click(),
  ]);
  const path = await download.path();
  const original = JSON.parse(readFileSync(path!, 'utf8'));
  expect(original.format).toBe('setu-aur-workspace');

  await page.getByRole('button', { name: 'Delete workspace…' }).click();
  await page.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(page.getByText('Workspace deleted')).toBeVisible();
  await expect(page.locator('.unit-name')).toHaveText('Untitled academic unit');

  await page.locator('input[type=file]').setInputFiles(path!);
  await page.getByRole('button', { name: 'Replace workspace' }).click();
  await expect(page.getByText(/^Imported/)).toBeVisible();
  await expect(page.locator('.unit-name')).toContainText('FICTIONAL SAMPLE');

  const [again] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download backup (.json)' }).click(),
  ]);
  const reimported = JSON.parse(readFileSync((await again.path())!, 'utf8'));
  expect(reimported.workspace.evidence).toEqual(original.workspace.evidence);
  expect(reimported.workspace.questions).toEqual(original.workspace.questions);
  expect(reimported.workspace.improvements).toEqual(original.workspace.improvements);
  expect(reimported.workspace.engagements).toEqual(original.workspace.engagements);
});

test('DOCX and CSV exports download', async ({ page }) => {
  await start(page, '#/exports');
  for (const name of ['Draft SER (.docx)', 'QEP working document (.docx)', 'Evidence (.csv)', 'Milestones (.csv)']) {
    const [d] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name }).click()]);
    expect(d.suggestedFilename()).toMatch(/\.(docx|csv)$/);
  }
});

test('makes no network requests beyond the static site', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const foreign: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(origin) && !u.startsWith('blob:') && !u.startsWith('data:')) foreign.push(u);
  });
  await start(page);
  for (const hash of ['#/areas/SD/SD-01', '#/evidence', '#/ser', '#/exports', '#/help']) {
    await page.goto(`./${hash}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  await page.goto('./#/ser');
  await page.getByRole('button', { name: 'Preview draft' }).click();
  expect(foreign).toEqual([]);
});

test('mobile menu toggles navigation', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  // The sample's long unit name previously forced the whole layout wider than the phone screen.
  await start(page, '#/exports');
  await page.getByRole('button', { name: 'Load fictional sample…' }).click();
  await page.getByRole('button', { name: 'Replace with sample' }).click();
  await expect(page.locator('.unit-name')).toContainText('FICTIONAL SAMPLE');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: 'Evidence Register' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Evidence Register' })).toBeVisible();
  await expect(nav).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

for (const hash of ['#/', '#/getting-started', '#/areas', '#/areas/TLA/TLA-02', '#/evidence', '#/engagement', '#/findings', '#/ser', '#/peer-review', '#/qep', '#/monitoring', '#/exports', '#/readiness-report', '#/help']) {
  test(`axe: no serious accessibility violations on ${hash}`, async ({ page }) => {
    await start(page, hash);
    await openNav(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}
