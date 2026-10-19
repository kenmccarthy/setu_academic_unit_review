export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Sort ascending by date; undated items go last, ties keep input order. */
export function sortByDate<T>(items: readonly T[], getDate: (item: T) => string | undefined): T[] {
  return items
    .map((item, index) => ({ item, index, date: getDate(item) }))
    .sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) return a.date < b.date ? -1 : 1;
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      return a.index - b.index;
    })
    .map((x) => x.item);
}

export function formatDate(date?: string): string {
  if (!date) return '—';
  const d = new Date(date.length === 10 ? `${date}T00:00:00Z` : date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IE', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Empty string from a date input means "no date". */
export function optionalDate(value: string): string | undefined {
  return value ? value : undefined;
}
