import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { deleteWorkspace, loadWorkspace, saveWorkspace } from '../../src/db/indexedDb';
import { createSampleWorkspace } from '../../src/data/sampleWorkspace';
import { parseImport, serializeWorkspace } from '../../src/utils/exportJson';

async function renderAt(hash: string) {
  window.location.hash = hash;
  const utils = render(<App />);
  await screen.findByRole('heading', { level: 1 });
  return utils;
}

beforeEach(async () => {
  localStorage.clear();
  localStorage.setItem('setu-aur:privacyAcknowledged', 'yes');
  await deleteWorkspace();
});

describe('integration', () => {
  it('shows the privacy warning on first run', async () => {
    localStorage.removeItem('setu-aur:privacyAcknowledged');
    await renderAt('#/');
    expect(screen.getByRole('heading', { name: 'Before you start' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'I understand' }));
    expect(localStorage.getItem('setu-aur:privacyAcknowledged')).toBe('yes');
  });

  it('answer → link evidence → reload → persisted', async () => {
    const user = userEvent.setup();
    const first = await renderAt('#/areas/SD/SD-01');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SD-01');
    await user.type(screen.getByLabelText('Response'), 'Our plan is reviewed annually.');
    await user.type(screen.getByLabelText('Add new evidence item and link it'), 'Strategic plan');
    await user.click(screen.getByRole('button', { name: 'Add and link' }));
    expect(screen.getByRole('button', { name: /Unlink Strategic plan/ })).toBeInTheDocument();
    await waitFor(async () => {
      const stored = await loadWorkspace();
      expect(stored?.questions['SD-01']?.response).toBe('Our plan is reviewed annually.');
    }, { timeout: 3000 });
    first.unmount();

    await renderAt('#/areas/SD/SD-01');
    expect(screen.getByLabelText('Response')).toHaveValue('Our plan is reviewed annually.');
    expect(screen.getByRole('button', { name: /Unlink Strategic plan/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Workflow status')).toHaveValue('draft');
    const stored = await loadWorkspace();
    expect(stored!.evidence[0].questionIds).toEqual(['SD-01']);
  });

  it('export JSON → delete workspace → import → identical records', async () => {
    const ws = createSampleWorkspace();
    await saveWorkspace(ws);
    const backup = serializeWorkspace((await loadWorkspace())!);
    await deleteWorkspace();
    expect(await loadWorkspace()).toBeNull();
    const { workspace } = parseImport(backup);
    await saveWorkspace(workspace);
    expect(await loadWorkspace()).toEqual(ws);
  });

  it('rejects a corrupt import without replacing existing data', async () => {
    const ws = createSampleWorkspace();
    await saveWorkspace(ws);
    await renderAt('#/exports');
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    const file = new File(['{"format":"setu-aur-workspace","schemaVersion":1,"appVersion":"x","exportedAt":"x","workspace":{"name":5}}'], 'bad.json', { type: 'application/json' });
    await act(async () => {
      await userEvent.upload(input, file);
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Import rejected');
    expect((await loadWorkspace())!.name).toBe(ws.name);
  });

  it('navigates every sidebar section', async () => {
    const user = userEvent.setup();
    await renderAt('#/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const links = Array.from(nav.querySelectorAll('a'));
    expect(links).toHaveLength(12);
    for (const link of links) {
      await user.click(link);
      expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(link).toHaveAttribute('aria-current', 'page');
    }
  });

  it('opens all nine areas and 45 question pages', async () => {
    await renderAt('#/areas');
    const { QUESTIONS } = await import('../../src/data/questionBank');
    for (const q of QUESTIONS) {
      act(() => {
        window.location.hash = `#/areas/${q.areaId}/${q.id}`;
      });
      await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(q.id));
    }
  });
});
