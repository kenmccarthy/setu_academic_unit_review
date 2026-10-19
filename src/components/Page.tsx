import { useEffect, useRef, type ReactNode } from 'react';

// The first page shown keeps the browser's default focus so the skip link stays first in tab order.
let initialPageShown = false;

/** Page shell: moves focus to the heading on navigation so screen-reader users hear the new page. */
export function Page({
  title,
  intro,
  children,
  breadcrumb,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  breadcrumb?: ReactNode;
}) {
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = `${title} · AUR Preparation Tool (prototype)`;
    if (initialPageShown) h1.current?.focus({ preventScroll: false });
    initialPageShown = true;
  }, [title]);
  return (
    <article className="page">
      {breadcrumb && (
        <nav aria-label="Breadcrumb" className="breadcrumb">
          {breadcrumb}
        </nav>
      )}
      <h1 ref={h1} tabIndex={-1}>
        {title}
      </h1>
      {intro && <div className="page-intro">{intro}</div>}
      {children}
    </article>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}
