import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { Workspace } from '../models/schema';
import { composeSer, type Block, type Chapter, type SerDocument } from '../features/ser/composeSer';
import { composeQep, QEP_STATUS_LABEL } from '../features/enhancement/composeQep';
import { formatDate } from './dates';

type Child = Paragraph | Table | TableOfContents;

/** Split user text into paragraphs on blank lines and keep single line breaks. */
function textParagraphs(textValue: string, opts: { italics?: boolean; color?: string } = {}): Paragraph[] {
  return textValue.split(/\n\s*\n/).map(
    (chunk) =>
      new Paragraph({
        spacing: { after: 120 },
        children: chunk.split('\n').map((line, i) => new TextRun({ text: line, break: i > 0 ? 1 : 0, ...opts })),
      }),
  );
}

const MISSING_COLOR = '8A4B00';

function cell(textValue: string, header = false): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: textValue, bold: header })] })],
  });
}

function blocksToDocx(blocks: Block[]): Child[] {
  const out: Child[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'heading':
        out.push(new Paragraph({ text: b.text, heading: b.level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4 }));
        break;
      case 'paragraph':
        out.push(...textParagraphs(b.text, b.missing ? { italics: true, color: MISSING_COLOR } : b.note ? { italics: true } : {}));
        break;
      case 'field': {
        const [first, ...rest] = textParagraphs(b.text, b.missing ? { italics: true, color: MISSING_COLOR } : {});
        out.push(new Paragraph({ children: [new TextRun({ text: b.label, bold: true })], spacing: { before: 120 } }), first, ...rest);
        break;
      }
      case 'bullets':
        for (const item of b.items) out.push(new Paragraph({ text: item, bullet: { level: 0 } }));
        break;
      case 'table':
        out.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ tableHeader: true, children: b.headers.map((h) => cell(h, true)) }),
              ...b.rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) })),
            ],
          }),
          new Paragraph({ text: '' }),
        );
        break;
    }
  }
  return out;
}

function chapterToDocx(ch: Chapter, prefix: string): Child[] {
  return [
    new Paragraph({ text: `${prefix}${ch.number}. ${ch.title}`, heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
    ...blocksToDocx(ch.blocks),
  ];
}

function statusBanner(textValue: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    border: {
      top: { style: BorderStyle.SINGLE, size: 12, color: 'B00020', space: 4 },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: 'B00020', space: 4 },
    },
    spacing: { before: 240, after: 240 },
    children: [new TextRun({ text: textValue, bold: true, color: 'B00020' })],
  });
}

function footer(policyVersion: string, exportDate: string, label: string): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${label} · Source policy: ${policyVersion} · Exported ${exportDate} · Page `, size: 16 }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16 }),
        ],
      }),
    ],
  });
}

const STYLES = {
  default: { document: { run: { font: 'Calibri', size: 22 } } },
};

export function buildSerDocument(ser: SerDocument): Document {
  const cover: Child[] = [
    new Paragraph({ text: ser.title, heading: HeadingLevel.TITLE, spacing: { before: 1200 } }),
    new Paragraph({ text: ser.unitName, heading: HeadingLevel.HEADING_1 }),
    statusBanner(ser.statusLabel),
    ...blocksToDocx([
      { type: 'field', label: 'Unit type', text: ser.unitType },
      { type: 'field', label: 'Review period', text: ser.period },
      { type: 'field', label: 'Scope', text: ser.scope || '[Scope not recorded]', missing: !ser.scope },
      { type: 'field', label: 'Lifecycle stage (descriptive)', text: ser.lifecycleStage },
      { type: 'field', label: 'Source policy', text: ser.policyVersion },
      { type: 'field', label: 'Exported', text: formatDate(ser.exportDate) },
    ]),
    new Paragraph({
      spacing: { before: 240 },
      children: [
        new TextRun({
          italics: true,
          text: 'Prepared with a prototype support tool. This draft is not the official SETU SER template and has not been approved by any institutional body. Missing content is labelled rather than filled in.',
        }),
      ],
    }),
  ];
  const contents: Child[] = [
    new Paragraph({ text: 'Contents', heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
    new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-2' }),
    new Paragraph({
      children: [new TextRun({ italics: true, text: 'If the contents list is empty, right-click it in Word and choose “Update field”.' })],
    }),
    ...[...ser.chapters.map((c) => `${c.number}. ${c.title}`), ...ser.appendices.map((a) => `Appendix ${a.number}. ${a.title}`)].map(
      (line) => new Paragraph({ text: line }),
    ),
  ];
  const summary: Child[] = [
    new Paragraph({ text: 'Executive summary', heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
    ...blocksToDocx(ser.executiveSummary),
  ];
  return new Document({
    creator: 'AUR Preparation Tool (prototype)',
    title: `${ser.title} — ${ser.unitName}`,
    description: ser.statusLabel,
    features: { updateFields: true },
    styles: STYLES,
    sections: [
      {
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: ser.statusLabel, size: 16, color: 'B00020' })] })] }) },
        footers: { default: footer(ser.policyVersion, ser.exportDate, 'DRAFT SER') },
        children: [
          ...cover,
          ...contents,
          ...summary,
          ...ser.chapters.flatMap((c) => chapterToDocx(c, '')),
          ...ser.appendices.flatMap((a) => chapterToDocx(a, 'Appendix ')),
        ],
      },
    ],
  });
}

export function buildQepDocument(ws: Workspace, exportDate = new Date().toISOString().slice(0, 10)): Document {
  const chapters = composeQep(ws);
  return new Document({
    creator: 'AUR Preparation Tool (prototype)',
    title: `Quality enhancement working document — ${ws.name}`,
    styles: STYLES,
    sections: [
      {
        footers: { default: footer(ws.policyVersion, exportDate, 'QEP WORKING DOCUMENT') },
        children: [
          new Paragraph({ text: 'Quality enhancement working document', heading: HeadingLevel.TITLE }),
          new Paragraph({ text: ws.name, heading: HeadingLevel.HEADING_1 }),
          statusBanner(QEP_STATUS_LABEL),
          ...chapters.flatMap((c) => chapterToDocx(c, 'Part ')),
        ],
      },
    ],
  });
}

export async function serDocxBlob(ws: Workspace): Promise<Blob> {
  return Packer.toBlob(buildSerDocument(composeSer(ws)));
}

export async function qepDocxBlob(ws: Workspace): Promise<Blob> {
  return Packer.toBlob(buildQepDocument(ws));
}
