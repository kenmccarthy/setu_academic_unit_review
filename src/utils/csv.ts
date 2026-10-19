const BOM = String.fromCharCode(0xfeff);
const DANGEROUS_LEADING = /^[=+\-@\t\r]/;

/**
 * Neutralise spreadsheet formula injection: a cell beginning with = + - @
 * (or tab/CR) is prefixed with an apostrophe so spreadsheet software treats
 * it as text.
 */
export function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = Array.isArray(value) ? value.join('; ') : String(value);
  return DANGEROUS_LEADING.test(s) ? `'${s}` : s;
}

export function quoteCell(value: unknown): string {
  const s = sanitizeCell(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(quoteCell).join(','));
  // BOM so Excel detects UTF-8; CRLF per RFC 4180.
  return `${BOM}${lines.join('\r\n')}\r\n`;
}
