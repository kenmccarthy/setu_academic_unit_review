import type { Block, Chapter } from '../features/ser/composeSer';

function Paras({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split(/\n\s*\n/).map((p, i) => (
        <p key={i} className={className}>
          {p}
        </p>
      ))}
    </>
  );
}

/** Renders composed document blocks as plain React text (never as HTML). */
export function BlockView({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return b.level === 3 ? <h4 key={i}>{b.text}</h4> : <h5 key={i}>{b.text}</h5>;
          case 'paragraph':
            return <Paras key={i} text={b.text} className={b.missing ? 'missing' : b.note ? 'muted' : undefined} />;
          case 'field':
            return (
              <div key={i} className="doc-field">
                <p className="doc-label">{b.label}</p>
                <Paras text={b.text} className={b.missing ? 'missing' : undefined} />
              </div>
            );
          case 'bullets':
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            );
          case 'table':
            return (
              <div key={i} className="table-wrap" role="region" aria-label={`Table: ${b.headers.join(", ")}`} tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      {b.headers.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k}>{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
        return null;
      })}
    </>
  );
}

export function ChapterView({ chapter, prefix = '' }: { chapter: Chapter; prefix?: string }) {
  return (
    <section className="doc-chapter" aria-labelledby={`ch-${chapter.id}`}>
      <h3 id={`ch-${chapter.id}`}>
        {prefix}
        {chapter.number}. {chapter.title}
      </h3>
      <BlockView blocks={chapter.blocks} />
    </section>
  );
}
