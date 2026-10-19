// Regenerate samples/fictional-workspace.json: npx vite-node scripts/write-sample.ts
import { writeFileSync } from 'node:fs';
import { createSampleWorkspace } from '../src/data/sampleWorkspace';
import { serializeWorkspace } from '../src/utils/exportJson';

writeFileSync(new URL('../samples/fictional-workspace.json', import.meta.url), `${serializeWorkspace(createSampleWorkspace())}\n`);
console.log('Wrote samples/fictional-workspace.json');
