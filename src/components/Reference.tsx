/** Show a user-supplied reference. Only http(s) URLs become links; nothing is fetched or validated. */
export function Reference({ value }: { value?: string }) {
  if (!value?.trim()) return <span className="muted">No reference recorded</span>;
  let url: URL | null = null;
  try {
    url = new URL(value.trim());
  } catch {
    url = null;
  }
  if (url && (url.protocol === 'https:' || url.protocol === 'http:')) {
    return (
      <a href={url.href} target="_blank" rel="noopener noreferrer">
        {value}
        <span className="visually-hidden"> (opens in a new tab; user-supplied link, not checked)</span>
      </a>
    );
  }
  return <span>{value}</span>;
}
