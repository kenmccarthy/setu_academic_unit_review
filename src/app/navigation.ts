export interface NavItem {
  to: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview' },
  { to: '/getting-started', label: 'Getting Started' },
  { to: '/areas', label: 'Review Areas' },
  { to: '/evidence', label: 'Evidence Register' },
  { to: '/engagement', label: 'Stakeholder Engagement' },
  { to: '/findings', label: 'Findings & Gaps' },
  { to: '/ser', label: 'SER Builder' },
  { to: '/peer-review', label: 'Peer Review Preparation' },
  { to: '/qep', label: 'Quality Enhancement Plan' },
  { to: '/monitoring', label: 'Monitoring' },
  { to: '/exports', label: 'Exports & Settings' },
  { to: '/help', label: 'Help & Policy' },
];
