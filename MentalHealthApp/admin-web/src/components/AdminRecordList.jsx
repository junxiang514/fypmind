import React from 'react';

const MENTAL_HEALTH_ROLES = new Set(['Mental Health Consultant', 'Head of Mental Health Consultant']);
const APPLICATION_MANAGER_ROLES = new Set(['Application Manager', 'Head of Application Manager']);

export default function AdminRecordList({
  signedInRole,
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
  toggleQuestion,
  onEditContent,
  onEditUser,
  onEditQuestion,
  onEditClinicalTool,
}) {
  const shortText = (value, max = 120) => {
    const text = String(value || '').trim();
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
  };

  const getYouTubeThumbnail = (url) => {
    const text = String(url || '').trim();
    if (!text) return '';

    const patterns = [
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }

    return '';
  };

  const resolveProfileName = (userId) => {
    if (!userId) return '—';
    const found = Array.isArray(filteredUsers) ? filteredUsers.find((u) => String(u?.id) === String(userId)) : null;
    return found?.full_name || found?.email || '—';
  };

  return (
    <div className={`list ${tab === 'contents' ? 'contents-list' : ''} ${tab === 'questions' ? 'questions-list' : ''} ${tab === 'clinical-tools' ? 'clinical-tools-list' : ''}`}>
      {tab === 'contents' && filteredContents.map((item) => {
        const thumbnail = getYouTubeThumbnail(item.video_url);

        return (
          <div key={item.id} className={`list-item ${item.id === selectedContentId ? 'active' : ''}`}>
            <div className="list-item-media">
              {thumbnail ? (
                <img src={thumbnail} alt={item.title} />
              ) : (
                <div className="list-item-media-fallback">
                  <span>📚</span>
                </div>
              )}
            </div>
            <button className="list-item-main" type="button" onClick={() => setSelectedContentId(item.id)}>
              <strong>{item.title}</strong>
              <small>{shortText(item.summary, 80) || 'N/A'}</small>
              <div className="list-item-meta">
                <span>{item.category || 'General'}</span>
                <span>{Array.isArray(item.quiz_payload) ? `${item.quiz_payload.length} Quiz` : '0 Quiz'}</span>
                <span>{Array.isArray(item.activity_payload) ? `${item.activity_payload.length} activities` : '0 activities'}</span>
              </div>
            </button>
                  {APPLICATION_MANAGER_ROLES.has(signedInRole) && (
                    <button type="button" className="btn light tiny-btn" onClick={() => { setSelectedContentId(item.id); onEditContent && onEditContent(item.id); }}>Edit</button>
                  )}
          </div>
        );
      })}

      {tab === 'users' && filteredUsers.map((item) => (
        <div key={item.id} className={`list-item ${item.id === selectedUserId ? 'active' : ''}`}>
          <button className="list-item-main" type="button" onClick={() => setSelectedUserId(item.id)}>
            <strong>{item.full_name || item.email || item.id}</strong>
            <small>{item.email || 'No email'} • {item.role || 'user'}{item.is_admin ? ' • admin' : ''}</small>
            <div className="list-item-meta">
              <span>{item.phone || 'No phone'}</span>
              <span>{item.gender || 'No gender'}</span>
              <span>{item.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            {/* medical_history preview removed */}
          </button>
          {APPLICATION_MANAGER_ROLES.has(signedInRole) && (
            <button type="button" className="btn light tiny-btn" onClick={() => { setSelectedUserId(item.id); onEditUser && onEditUser(item.id); }}>Edit</button>
          )}
        </div>
      ))}

      {tab === 'questions' && filteredQuestions.map((item) => (
        <div key={item.id} className={`list-item ${item.id === selectedQuestionId ? 'active' : ''}`}>
          <button className="list-item-main" type="button" onClick={() => setSelectedQuestionId(item.id)}>
            <strong>{item.prompt}</strong>
            <small>
              Author: {resolveProfileName(item.created_by)} • Verified by: {resolveProfileName(item.verified_by)}
            </small>
            <div className="list-item-meta">
              <span>{item.answer_type === 'custom' && Array.isArray(item.options) ? `${item.options.length} options` : 'Likert 1-5'}</span>
              <span>{item.category || 'General'}</span>
            </div>
          </button>
            {MENTAL_HEALTH_ROLES.has(signedInRole) && (
              <button type="button" className="btn light tiny-btn" onClick={() => { setSelectedQuestionId(item.id); onEditQuestion && onEditQuestion(item.id); }}>Edit</button>
            )}
        </div>
      ))}

      {tab === 'clinical-tools' && filteredClinicalTools.map((item) => {
        const stat = clinicalSubmissionStatsByToolId.get(String(item.id));
        const submissionCount = stat?.count || 0;
        const questionCount = clinicalQuestionCountByToolId.get(String(item.id)) || 0;
        return (
          <div
            key={item.id}
            className={`list-item ${item.id === selectedClinicalToolId ? 'active' : ''}`}
          >
            <button className="list-item-main" type="button" onClick={() => setSelectedClinicalToolId(item.id)}>
              <strong>{item.code} — {item.name}</strong>
              {shortText(item.description) && <small>{shortText(item.description)}</small>}
              <div className="list-item-meta">
                <span>{item.is_active ? 'Enabled' : 'Disabled'}</span>
                <span>{questionCount} Questions</span>
                <span>{submissionCount} Submissions</span>
              </div>
            </button>
            {MENTAL_HEALTH_ROLES.has(signedInRole) && (
              <button
                type="button"
                className="btn light tiny-btn"
                onClick={() => { setSelectedClinicalToolId(item.id); onEditClinicalTool && onEditClinicalTool(item.id); }}
              >
                Edit
              </button>
            )}
          </div>
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
