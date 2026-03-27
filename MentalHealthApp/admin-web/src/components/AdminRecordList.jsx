import React from 'react';

export default function AdminRecordList({
  tab,
  filteredEvents,
  filteredContents,
  filteredUsers,
  filteredQuestions,
  filteredClinicalTools,
  selectedEventId,
  selectedContentId,
  selectedUserId,
  selectedQuestionId,
  selectedClinicalToolId,
  setSelectedEventId,
  setSelectedContentId,
  setSelectedUserId,
  setSelectedQuestionId,
  setSelectedClinicalToolId,
  clinicalSubmissionStatsByToolId,
  clinicalQuestionCountByToolId,
  saving,
  toggleClinicalTool,
}) {
  return (
    <div className="card list">
      {tab === 'events' && filteredEvents.map((item) => (
        <button key={item.id} className={`list-item ${item.id === selectedEventId ? 'active' : ''}`} onClick={() => setSelectedEventId(item.id)}>
          <strong>{item.title}</strong>
          <small>{item.category || 'N/A'} • {item.location || 'No location'}</small>
        </button>
      ))}

      {tab === 'contents' && filteredContents.map((item) => (
        <button key={item.id} className={`list-item ${item.id === selectedContentId ? 'active' : ''}`} onClick={() => setSelectedContentId(item.id)}>
          <strong>{item.title}</strong>
          <small>{item.category || 'N/A'}</small>
        </button>
      ))}

      {tab === 'users' && filteredUsers.map((item) => (
        <button key={item.id} className={`list-item ${item.id === selectedUserId ? 'active' : ''}`} onClick={() => setSelectedUserId(item.id)}>
          <strong>{item.full_name || item.email || item.id}</strong>
          <small>{item.email || 'No email'} • {item.role || 'user'}{item.is_admin ? ' • admin' : ''}</small>
        </button>
      ))}

      {tab === 'questions' && filteredQuestions.map((item) => (
        <button
          key={item.id}
          className={`list-item ${item.id === selectedQuestionId ? 'active' : ''}`}
          onClick={() => setSelectedQuestionId(item.id)}
        >
          <strong>{item.prompt}</strong>
          <small>{item.category || 'General'} • {item.answer_type || 'likert_5'} • {item.is_active ? 'active' : 'inactive'}</small>
        </button>
      ))}

      {tab === 'clinical-tools' && filteredClinicalTools.map((item) => {
        const stat = clinicalSubmissionStatsByToolId.get(String(item.id));
        const submissionCount = stat?.count || 0;
        const questionCount = clinicalQuestionCountByToolId.get(String(item.id)) || 0;
        return (
          <button
            key={item.id}
            className={`list-item ${item.id === selectedClinicalToolId ? 'active' : ''}`}
            onClick={() => setSelectedClinicalToolId(item.id)}
          >
            <div className="list-item-head">
              <strong>{item.code} — {item.name}</strong>
              <button
                type="button"
                className={`btn tiny-btn ${item.is_active ? 'light' : 'danger'}`}
                disabled={saving}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleClinicalTool(item, !item.is_active);
                }}
              >
                {item.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
            <small className="clinical-meta-row">
              <span><strong>Status:</strong> {item.is_active ? 'Enabled' : 'Disabled'}</span>
              <span><strong>Questions:</strong> {questionCount}</span>
              <span><strong>Submissions:</strong> {submissionCount}</span>
            </small>
          </button>
        );
      })}

      {tab === 'events' && filteredEvents.length === 0 && (
        <div className="muted">No events found.</div>
      )}
      {tab === 'contents' && filteredContents.length === 0 && (
        <div className="muted">No educational contents found.</div>
      )}
      {tab === 'users' && filteredUsers.length === 0 && (
        <div className="muted">No users found. Check profiles RLS or create your profile row first.</div>
      )}
      {tab === 'questions' && filteredQuestions.length === 0 && (
        <div className="muted">No wellbeing questions found.</div>
      )}
      {tab === 'clinical-tools' && filteredClinicalTools.length === 0 && (
        <div className="muted">No self-assessment tools found.</div>
      )}
    </div>
  );
}
