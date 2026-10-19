import { useEffect, useState } from 'react';
import { HashRouter, NavLink, useLocation } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from '../state/WorkspaceContext';
import { getPref, setPref } from '../utils/prefs';
import { formatDateTime } from '../utils/dates';
import { Dialog } from '../components/ConfirmDialog';
import { NAV_ITEMS } from './navigation';
import { AppRoutes } from './routes';
import { PRIVACY_WARNING } from '../data/copy';


function SaveIndicator() {
  const { saveState, saveError, lastSavedAt } = useWorkspace();
  const text = {
    saved: lastSavedAt ? `Saved in this browser ${formatDateTime(lastSavedAt)}` : 'Saved in this browser',
    pending: 'Unsaved changes…',
    saving: 'Saving…',
    error: 'Not saved',
  }[saveState];
  return (
    <div className={`save-indicator save-${saveState}`} role="status" aria-live="polite">
      <span aria-hidden="true">{saveState === 'error' ? '✕ ' : saveState === 'saved' ? '✓ ' : '… '}</span>
      {text}
      {saveState === 'error' && saveError && <span className="save-error"> — {saveError}</span>}
    </div>
  );
}

function PrivacyNotice() {
  const [open, setOpen] = useState(() => getPref('privacyAcknowledged') !== 'yes');
  return (
    <Dialog
      open={open}
      title="Before you start"
      onClose={() => undefined}
      actions={
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setPref('privacyAcknowledged', 'yes');
            setOpen(false);
          }}
        >
          I understand
        </button>
      }
    >
      <p>
        <strong>{PRIVACY_WARNING}</strong>
      </p>
      <p>
        Anyone using this browser profile may be able to read the data, and it is lost if site data is cleared.
        Nothing is sent to a server. Avoid names, student numbers, individual performance information and
        special-category personal data.
      </p>
      <p>
        This is a support tool and a proposal. It does not conduct a review, approve a report or replace SETU
        processes, and its question structure is not the official SER template.
      </p>
    </Dialog>
  );
}

function RememberLocation() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== '/') setPref('lastPath', pathname);
  }, [pathname]);
  return null;
}

function Shell() {
  const { workspace } = useWorkspace();
  const [navOpen, setNavOpen] = useState(false);
  const [contrast, setContrast] = useState(() => getPref('highContrast') === 'yes');
  const { pathname } = useLocation();

  useEffect(() => setNavOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.dataset.contrast = contrast ? 'high' : 'normal';
    setPref('highContrast', contrast ? 'yes' : null);
  }, [contrast]);

  return (
    <div className="layout">
      <a className="skip-link" href="#main" onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}>
        Skip to main content
      </a>
      <header className="topbar">
        <div className="brand">
          <span className="brand-title">AUR Preparation Tool</span>
          <span className="brand-sub">Prototype · not an official SETU system</span>
        </div>
        <p className="unit-name" title="Current workspace">
          {workspace.name}
        </p>
        <SaveIndicator />
        <div className="topbar-actions">
          <button type="button" className="btn btn-small" aria-pressed={contrast} onClick={() => setContrast((c) => !c)}>
            High contrast
          </button>
          <button
            type="button"
            className="btn btn-small nav-toggle"
            aria-expanded={navOpen}
            aria-controls="sidebar"
            onClick={() => setNavOpen((o) => !o)}
          >
            Menu
          </button>
        </div>
      </header>
      <nav id="sidebar" className={`sidebar ${navOpen ? 'open' : ''}`} aria-label="Main">
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === '/'}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main id="main" tabIndex={-1}>
        <AppRoutes />
      </main>
      <footer className="footer">
        <p>{PRIVACY_WARNING}</p>
        <p>
          Policy source: {workspace.policyVersion}. Counts shown in this tool are workflow measures, not quality
          ratings.
        </p>
      </footer>
      <PrivacyNotice />
      <RememberLocation />
    </div>
  );
}

export function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WorkspaceProvider>
        <Shell />
      </WorkspaceProvider>
    </HashRouter>
  );
}
