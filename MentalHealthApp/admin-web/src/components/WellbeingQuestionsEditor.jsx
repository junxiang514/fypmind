import React from 'react';

export const EMPTY_WELLBEING_QUESTION = {
  category: 'Mood',
  prompt: '',
  answer_type: 'likert_5',
  options_text: '',
  is_active: true,
};

export function serializeOptions(options) {
  if (!Array.isArray(options) || !options.length) return '';
  return options.map((x) => `${x.label}|${x.value}`).join('\n');
}

export function parseOptionsText(text) {
  const rows = String(text || '')
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  return rows
    .map((line) => {
      const [labelPart, valuePart] = line.split('|');
      const label = String(labelPart || '').trim();
      const value = Number(String(valuePart || '').trim());
      if (!label || !Number.isFinite(value)) return null;
      return { label, value };
    })
    .filter(Boolean);
}

export default function WellbeingQuestionsEditor({
  form,
  setForm,
  saving,
  selectedId,
  onSave,
  onDelete,
  onNew,
}) {
  return (
    <>
      <h3>Daily wellbeing question</h3>

      <label>Category</label>
      <input
        value={form.category}
        onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
        placeholder="Mood / Sleep / Stress / Productivity / Social ..."
      />

      <label>Question prompt</label>
      <textarea
        value={form.prompt}
        onChange={(e) => setForm((s) => ({ ...s, prompt: e.target.value }))}
        placeholder="How was your sleep quality last night?"
      />

      <label>Answer type</label>
      <select
        value={form.answer_type}
        onChange={(e) => setForm((s) => ({ ...s, answer_type: e.target.value }))}
      >
        <option value="likert_5">Likert 1-5</option>
        <option value="custom">Custom options</option>
      </select>

      {form.answer_type === 'custom' && (
        <>
          <label>Custom options (one per line: label|value)</label>
          <textarea
            className="tall"
            value={form.options_text}
            onChange={(e) => setForm((s) => ({ ...s, options_text: e.target.value }))}
            placeholder={"Never|1\nSometimes|2\nOften|3\nAlmost always|4\nAlways|5"}
          />
          <div className="tiny">
            Example format: <strong>Good|4</strong>
          </div>
        </>
      )}

      <label className="checks">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
        />
        Active question
      </label>

      <div className="row">
        <button className="btn primary" onClick={onSave} disabled={saving}>Save</button>
        <button className="btn light" onClick={onNew}>New</button>
        {selectedId && <button className="btn danger" onClick={onDelete} disabled={saving}>Delete</button>}
      </div>
    </>
  );
}
