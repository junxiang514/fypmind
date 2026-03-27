import React from 'react';

export const EMPTY_CLINICAL_TOOL = {
  code: '',
  name: '',
  description: '',
  is_active: true,
};

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ClinicalToolsEditor({
  form,
  setForm,
  saving,
  selectedId,
  onSave,
  questionCount,
  submissionCount,
  lastSubmissionAt,
  questions,
  selectedQuestionId,
  onSelectQuestion,
  questionForm,
  setQuestionForm,
  onSaveQuestion,
}) {
  const disabled = !selectedId;

  return (
    <>
      <h3>Self-assessment set</h3>

      {!selectedId && (
        <div className="muted" style={{ marginTop: 0 }}>
          Select a tool set from the left panel.
        </div>
      )}

      <label>Tool code</label>
      <input value={form.code} disabled />

      <label>Tool name</label>
      <input value={form.name} disabled />

      <label>Description</label>
      <textarea value={form.description} disabled />

      <label className="checks">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
          disabled={disabled}
        />
        Enable this questionnaire set
      </label>

      <div className="editor-block">
        <div className="tiny"><strong>Total questions in this set:</strong> {questionCount}</div>
        <div className="tiny"><strong>Total submissions:</strong> {submissionCount}</div>
        <div className="tiny"><strong>Last submission:</strong> {formatDateTime(lastSubmissionAt)}</div>
      </div>

      <div className="row">
        <button className="btn primary" onClick={onSave} disabled={saving || disabled}>Save</button>
      </div>

      <div className="editor-block">
        <h4 style={{ margin: 0 }}>Questions in this set</h4>

        {!questions?.length && <div className="muted">No questions found for this set.</div>}

        {!!questions?.length && (
          <>
            <div className="tool-question-list">
              {questions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={`list-item ${q.id === selectedQuestionId ? 'active' : ''}`}
                  onClick={() => onSelectQuestion(q.id)}
                >
                  <strong>Q{q.question_order}. {q.question_text}</strong>
                </button>
              ))}
            </div>

            {!!selectedQuestionId && (
              <>
                <label>Question order</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={questionForm.question_order}
                  onChange={(e) => setQuestionForm((s) => ({ ...s, question_order: Number(e.target.value || 1) }))}
                />

                <label>Question text</label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm((s) => ({ ...s, question_text: e.target.value }))}
                />

                <label>Answer options (one per line: label|value)</label>
                <textarea
                  className="tall"
                  value={questionForm.options_text}
                  onChange={(e) => setQuestionForm((s) => ({ ...s, options_text: e.target.value }))}
                  placeholder={"Not at all|0\nSeveral days|1\nMore than half the days|2\nNearly every day|3"}
                />

                <div className="row">
                  <button className="btn primary" onClick={onSaveQuestion} disabled={saving || disabled}>Save Question</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
