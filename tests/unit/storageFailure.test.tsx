import { render, screen } from '@testing-library/react';
import { App } from '../../src/app/App';

vi.mock('../../src/db/indexedDb', async (orig) => {
  const actual = await orig<typeof import('../../src/db/indexedDb')>();
  const err = new actual.StorageError('Browser storage is unavailable (private mode or blocked site data). Changes cannot be saved.');
  return {
    ...actual,
    loadWorkspace: vi.fn().mockRejectedValue(err),
    saveWorkspace: vi.fn().mockRejectedValue(err),
  };
});

describe('storage denied', () => {
  it('shows a visible error and never claims to have saved', async () => {
    localStorage.setItem('setu-aur:privacyAcknowledged', 'yes');
    window.location.hash = '#/';
    render(<App />);
    expect(await screen.findByText('Not saved')).toBeInTheDocument();
    expect(screen.getByText(/Browser storage is unavailable/)).toBeInTheDocument();
    expect(screen.queryByText(/^Saved/)).not.toBeInTheDocument();
  });
});
