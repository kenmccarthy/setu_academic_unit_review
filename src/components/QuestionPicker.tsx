import { AREAS, questionsForArea } from '../data/questionBank';

/** Grouped native checkboxes for linking records to questions. */
export function QuestionPicker({
  legend,
  selected,
  onChange,
}: {
  legend: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const set = new Set(selected);
  const toggle = (id: string, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(id);
    else next.delete(id);
    onChange(Array.from(next));
  };
  return (
    <details className="picker">
      <summary>
        {legend} <span className="muted">({selected.length} selected)</span>
      </summary>
      <fieldset>
        <legend className="visually-hidden">{legend}</legend>
        {AREAS.map((a) => (
          <fieldset key={a.id} className="picker-group">
            <legend>{a.title}</legend>
            {questionsForArea(a.id).map((q) => (
              <label key={q.id} className="picker-item">
                <input type="checkbox" checked={set.has(q.id)} onChange={(e) => toggle(q.id, e.target.checked)} />
                <span>
                  <strong>{q.id}</strong> {q.question}
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </fieldset>
    </details>
  );
}
