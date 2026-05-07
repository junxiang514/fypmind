import React from 'react';

export const EMPTY_CONTENT = {
  title: '',
  summary: '',
  category: '',
  video_url: '',
  quiz_payload: [],
  activity_payload: [],
  body: '',
};

export function createEmptyQuizQuestion() {
  return {
    question: '',
    options: ['', ''],
    answer: 0,
  };
}

export function createEmptyActivity() {
  return {
    key: '',
    label: '',
  };
}

export function normalizeQuizPayload(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.map((q) => {
    const options = Array.isArray(q?.options) ? q.options.map((x) => String(x || '')) : ['', ''];
    return {
      question: String(q?.question || ''),
      options: options.length >= 2 ? options : [...options, ''],
      answer: Number.isInteger(q?.answer) ? q.answer : 0,
    };
  });
}

export function normalizeActivityPayload(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.map((a) => ({
    key: String(a?.key || ''),
    label: String(a?.label || ''),
  }));
}

export default function EducationalContentEditor({
  contentForm,
  setContentForm,
  saving,
  selectedContentId,
  onSave,
  onDelete,
  isEditingContent,
  onCloseEditor,
}) {
  if (!isEditingContent) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onCloseEditor}>
      <div className="modal-content modal-editor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{selectedContentId ? 'Edit Educational Content' : 'Create Educational Content'}</h2>
          <button className="modal-close" onClick={onCloseEditor}>✕</button>
        </div>
        <div className="modal-body">
      <label>Title</label>
      <input value={contentForm.title} onChange={(e) => setContentForm((s) => ({ ...s, title: e.target.value }))} />
      <label>Summary</label>
      <textarea value={contentForm.summary} onChange={(e) => setContentForm((s) => ({ ...s, summary: e.target.value }))} />
      <label>Category</label>
      <input value={contentForm.category} onChange={(e) => setContentForm((s) => ({ ...s, category: e.target.value }))} />
      <label>Video URL (YouTube preferred)</label>
      <input value={contentForm.video_url} onChange={(e) => setContentForm((s) => ({ ...s, video_url: e.target.value }))} />

      <div className="editor-block">
        <div className="editor-head">
          <label>Edit Quiz</label>
          <button
            className="btn light"
            type="button"
            onClick={() => setContentForm((s) => ({ ...s, quiz_payload: [...(s.quiz_payload || []), createEmptyQuizQuestion()] }))}
          >
            Add Question
          </button>
        </div>

        {(contentForm.quiz_payload || []).length === 0 && (
          <div className="muted">No quiz question yet.</div>
        )}

        {(contentForm.quiz_payload || []).map((q, qIndex) => (
          <div key={`quiz-${qIndex}`} className="editor-card">
            <div className="editor-head">
              <strong>Question {qIndex + 1}</strong>
              <button
                className="btn danger"
                type="button"
                onClick={() =>
                  setContentForm((s) => ({
                    ...s,
                    quiz_payload: (s.quiz_payload || []).filter((_, idx) => idx !== qIndex),
                  }))
                }
              >
                Remove
              </button>
            </div>

            <input
              placeholder="Question text"
              value={q.question || ''}
              onChange={(e) =>
                setContentForm((s) => ({
                  ...s,
                  quiz_payload: (s.quiz_payload || []).map((item, idx) => idx === qIndex ? { ...item, question: e.target.value } : item),
                }))
              }
            />

            <label className="tiny">Correct answer</label>
            <select
              value={Number.isInteger(q.answer) ? q.answer : 0}
              onChange={(e) => {
                const nextAnswer = Number(e.target.value);
                setContentForm((s) => ({
                  ...s,
                  quiz_payload: (s.quiz_payload || []).map((item, idx) => idx === qIndex ? { ...item, answer: nextAnswer } : item),
                }));
              }}
            >
              {(q.options || []).map((_, optIndex) => (
                <option key={`a-${qIndex}-${optIndex}`} value={optIndex}>
                  Option {optIndex + 1}
                </option>
              ))}
            </select>

            <div className="editor-subhead">Options</div>
            {(q.options || []).map((opt, optIndex) => (
              <div key={`opt-${qIndex}-${optIndex}`} className="inline-row">
                <input
                  value={opt || ''}
                  placeholder={`Option ${optIndex + 1}`}
                  onChange={(e) =>
                    setContentForm((s) => ({
                      ...s,
                      quiz_payload: (s.quiz_payload || []).map((item, idx) => {
                        if (idx !== qIndex) return item;
                        const nextOptions = [...(item.options || [])];
                        nextOptions[optIndex] = e.target.value;
                        return { ...item, options: nextOptions };
                      }),
                    }))
                  }
                />
                <button
                  className="btn light"
                  type="button"
                  onClick={() =>
                    setContentForm((s) => ({
                      ...s,
                      quiz_payload: (s.quiz_payload || []).map((item, idx) => {
                        if (idx !== qIndex) return item;
                        if ((item.options || []).length <= 2) return item;
                        const nextOptions = (item.options || []).filter((_, i) => i !== optIndex);
                        const nextAnswer = Math.max(0, Math.min(item.answer || 0, nextOptions.length - 1));
                        return { ...item, options: nextOptions, answer: nextAnswer };
                      }),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="btn light"
              type="button"
              onClick={() =>
                setContentForm((s) => ({
                  ...s,
                  quiz_payload: (s.quiz_payload || []).map((item, idx) => idx === qIndex ? { ...item, options: [...(item.options || []), ''] } : item),
                }))
              }
            >
              Add Option
            </button>
          </div>
        ))}
      </div>

      <div className="editor-block">
        <div className="editor-head">
          <label>Edit Activity</label>
          <button
            className="btn light"
            type="button"
            onClick={() => setContentForm((s) => ({ ...s, activity_payload: [...(s.activity_payload || []), createEmptyActivity()] }))}
          >
            Add Activity
          </button>
        </div>

        {(contentForm.activity_payload || []).length === 0 && (
          <div className="muted">No activity yet.</div>
        )}

        {(contentForm.activity_payload || []).map((a, index) => (
          <div key={`act-${index}`} className="editor-card">
            <div className="inline-row">
              <input
                value={a.key || ''}
                placeholder="Key (e.g. breathe)"
                onChange={(e) =>
                  setContentForm((s) => ({
                    ...s,
                    activity_payload: (s.activity_payload || []).map((item, idx) => idx === index ? { ...item, key: e.target.value } : item),
                  }))
                }
              />
              <button
                className="btn danger"
                type="button"
                onClick={() =>
                  setContentForm((s) => ({
                    ...s,
                    activity_payload: (s.activity_payload || []).filter((_, idx) => idx !== index),
                  }))
                }
              >
                Remove
              </button>
            </div>
            <input
              value={a.label || ''}
              placeholder="Activity label"
              onChange={(e) =>
                setContentForm((s) => ({
                  ...s,
                  activity_payload: (s.activity_payload || []).map((item, idx) => idx === index ? { ...item, label: e.target.value } : item),
                }))
              }
            />
          </div>
        ))}
      </div>

      <label>Body</label>
      <textarea className="tall" value={contentForm.body} onChange={(e) => setContentForm((s) => ({ ...s, body: e.target.value }))} />
        </div>
        <div className="modal-footer">
          <button className="btn light" onClick={onCloseEditor}>Cancel</button>
          <button className="btn primary" onClick={onSave} disabled={saving}>Save</button>
          {selectedContentId && <button className="btn danger" onClick={onDelete} disabled={saving}>Delete</button>}
        </div>
      </div>
    </div>  );
}