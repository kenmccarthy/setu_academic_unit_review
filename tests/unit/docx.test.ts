import JSZip from 'jszip';
import { Packer } from 'docx';
import { buildQepDocument, buildSerDocument } from '../../src/utils/exportDocx';
import { DRAFT_LABEL, composeSer } from '../../src/features/ser/composeSer';
import { createSampleWorkspace } from '../../src/data/sampleWorkspace';
import { emptyReflection } from '../../src/models/workspace';

async function documentXml(buf: Buffer) {
  const zip = await JSZip.loadAsync(buf);
  return zip.file('word/document.xml')!.async('string');
}

describe('DOCX export', () => {
  it('generates a SER with Unicode punctuation and long paragraphs', async () => {
    const ws = createSampleWorkspace();
    const long = 'Reflection “quoted” — en–dash, ellipsis… Irish fada: Éire, Gaelscoil. & <tags> '.repeat(400);
    ws.questions['SD-02'] = { ...emptyReflection('SD-02'), response: `${long}\n\nSecond paragraph.` };
    ws.ser.executiveSummary = 'Summary with ‘smart quotes’.';
    const buf = await Packer.toBuffer(buildSerDocument(composeSer(ws, '2026-10-19')));
    expect(buf.length).toBeGreaterThan(5000);
    const xml = await documentXml(buf);
    expect(xml).toContain(DRAFT_LABEL);
    expect(xml).toContain('Reflection “quoted” — en–dash, ellipsis… Irish fada: Éire');
    expect(xml).toContain('&amp; &lt;tags&gt;');
    expect(xml).toContain('Second paragraph.');
    expect(xml).toContain('Summary with ‘smart quotes’.');
    expect(xml).toContain('Evidence index');
    expect(xml).toContain('[Not yet written]');
    const zip = await JSZip.loadAsync(buf);
    const footers = Object.keys(zip.files).filter((f) => /footer\d*\.xml$/.test(f));
    const footerXml = (await Promise.all(footers.map((f) => zip.file(f)!.async('string')))).join('');
    expect(footerXml).toContain('2026-10-19');
    expect(footerXml).toContain(ws.policyVersion);
  });

  it('generates a QEP working document', async () => {
    const buf = await Packer.toBuffer(buildQepDocument(createSampleWorkspace(), '2026-10-19'));
    const xml = await documentXml(buf);
    expect(xml).toContain('Provisional improvement suggestions (pre-review)');
    expect(xml).toContain('Quality enhancement plan actions (post-review)');
    expect(xml).toContain('Programme-level assessment calendar');
  });
});
