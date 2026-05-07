import React from 'react';
import EventsEditor, { EMPTY_EVENT } from './EventsEditor';
import EventsGrid from './EventsGrid';
import EducationalContentEditor, {
  EMPTY_CONTENT,
} from './EducationalContentEditor';
import UserEditor from './UserEditor';
import WellbeingQuestionsEditor, {
  EMPTY_WELLBEING_QUESTION,
} from './WellbeingQuestionsEditor';
import ClinicalToolsEditor, { EMPTY_CLINICAL_TOOL } from './ClinicalToolsEditor';
import AdminRecordList from './AdminRecordList';

function KpiMetric({ icon, label, value, onClick }) {
  return (
    <div className="kpi-metric" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="kpi-metric-icon">
        {icon}
      </div>
      <div className="kpi-metric-content">
        <div className="kpi-metric-value">{value}</div>
        <div className="kpi-metric-label">{label}</div>
      </div>
    </div>
  );
}

function KpiCategoryCard({ title, metrics, layout = 'single', onMetricClick }) {
  return (
    <article className="kpi-category-card">
      <h3>{title}</h3>
      <div className={`kpi-metrics-list kpi-metrics-${layout}`}>
        {metrics.map((metric, idx) => (
          <KpiMetric 
            key={idx} 
            {...metric} 
            onClick={() => onMetricClick && metric.tab && onMetricClick(metric.tab)}
          />
        ))}
      </div>
    </article>
  );
}

function ToolSubmissionsChart({ data = [] }) {
  const max = Math.max(1, ...data.map((item) => Number(item.count || 0)));

  return (
    <article className="dashboard-analytics-card">
      <h3>Submissions by Self-Assessment Tool</h3>
      <div className="tool-chart-list">
        {data.length === 0 && <div className="muted">No tool submission data found.</div>}
        {data.map((item) => {
          const widthPercent = Math.max(0, Math.min(100, (Number(item.count || 0) / max) * 100));
          return (
            <div className="tool-chart-row" key={item.id || item.label}>
              <div className="tool-chart-label" title={item.label}>{item.label}</div>
              <div className="tool-chart-bar-wrap">
                <div className="tool-chart-bar" style={{ width: `${widthPercent}%` }} />
              </div>
              <div className="tool-chart-value">{item.count}</div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function TopEducationalContentList({ items = [] }) {
  return (
    <article className="dashboard-analytics-card">
      <h3>Top Performing Educational Content</h3>
      <ol className="top-content-list">
        {items.length === 0 && <li className="muted">No educational submission data found.</li>}
        {items.map((item, index) => (
          <li key={item.id || `${item.title}-${index}`} className="top-content-item">
            <span className="top-content-rank">#{index + 1}</span>
            <span className="top-content-title" title={item.title}>{item.title}</span>
            <span className="top-content-count">{item.count}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function HomeDashboardPage({
  kpis,
  toolSubmissionChartData,
  topEducationalContentBySubmissions,
  onTabChange,
}) {
  const resourcesMetrics = [
    { icon: '📅', label: 'Events', value: kpis.events, tab: 'events' },
    { icon: '📚', label: 'Educational Content', value: kpis.contents, tab: 'contents' },
    { icon: '❓', label: 'Check-ins Question', value: kpis.questions, tab: 'questions' },
    { icon: '🔍', label: 'Self-Assessment Tools', value: kpis.tools, tab: 'clinical-tools' },
  ];

  const usersMetrics = [
    { icon: '👥', label: 'Active Users', value: kpis.users, tab: 'users' },
    { icon: '🆕', label: 'New Users This Month', value: kpis.newUsersThisMonth, tab: 'users' },
  ];    

  return (
    <section className="dashboard-home">
      <div className="dashboard-home-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of MIND Application.</p>
        </div>
      </div>

      <div className="dashboard-home-grid">
        <KpiCategoryCard title="Users" metrics={usersMetrics} layout="horizontal" onMetricClick={onTabChange} />
        <article className="kpi-category-card">
          <h3>Resources</h3>
          <div className="kpi-metrics-list kpi-metrics-grid">
            {resourcesMetrics.map((metric, idx) => (
              <KpiMetric 
                key={idx} 
                {...metric} 
                onClick={() => onTabChange && onTabChange(metric.tab)}
              />
            ))}
          </div>
          <div className="dashboard-analytics-grid" style={{ marginTop: '20px' }}>
            <ToolSubmissionsChart data={toolSubmissionChartData} />
            <TopEducationalContentList items={topEducationalContentBySubmissions} />
          </div>
        </article>
      </div>
    </section>
  );
}

export default function AdminDashboardContent({
  tab,
  setTab,
  kpis,
  saving,
  filteredEvents,
  filteredContents,
  filteredUsers,
  filteredQuestions,
  filteredClinicalTools,
  toolSubmissionChartData,
  topEducationalContentBySubmissions,
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
  toggleClinicalTool,
  toggleQuestion,
  eventForm,
  setEventForm,
  eventFormErrors,
  setEventFormErrors,
  saveEvent,
  isEditingEvent,
  setIsEditingEvent,
  deleteEvent,
  isEditingContent,
  setIsEditingContent,
  contentForm,
  setContentForm,
  saveContent,
  deleteContent,
  isEditingUser,
  setIsEditingUser,
  userForm,
  setUserForm,
  saveUser,
  deleteUserProfile,
  isEditingQuestion,
  setIsEditingQuestion,
  questionForm,
  setQuestionForm,
  saveQuestion,
  deleteQuestion,
  isEditingClinicalTool,
  setIsEditingClinicalTool,
  clinicalToolForm,
  setClinicalToolForm,
  saveClinicalTool,
  selectedToolQuestions,
  selectedToolQuestionId,
  setSelectedToolQuestionId,
  toolQuestionForm,
  setToolQuestionForm,
  saveSelectedToolQuestion,
}) {
  const [selectedQuestionCategory, setSelectedQuestionCategory] = React.useState(null);

  const showFloatingAddButton = tab !== 'dashboard' && tab !== 'users';
  const addButtonLabel = {
    events: 'Add Event',
    contents: 'Add Content',
    questions: 'Add Question',
    'clinical-tools': 'Add Tool',
  }[tab] || 'Add';

  const openAddModal = () => {
    if (tab === 'events') {
      setSelectedEventId(null);
      setEventForm(EMPTY_EVENT);
      setEventFormErrors({});
      setIsEditingEvent(true);
      return;
    }

    if (tab === 'contents') {
      setSelectedContentId(null);
      setContentForm(EMPTY_CONTENT);
      setIsEditingContent(true);
      return;
    }

    if (tab === 'questions') {
      setSelectedQuestionId(null);
      setQuestionForm(EMPTY_WELLBEING_QUESTION);
      setIsEditingQuestion(true);
      return;
    }

    if (tab === 'clinical-tools') {
      setSelectedClinicalToolId(null);
      setClinicalToolForm(EMPTY_CLINICAL_TOOL);
      setSelectedToolQuestionId(null);
      setToolQuestionForm({ question_order: 1, question_text: '', options_text: '' });
      setIsEditingClinicalTool(true);
    }
  };

  const pageMeta = {
    events: { title: 'Events', subtitle: 'Manage upcoming and past events in one place.' },
    contents: { title: 'Educational Content', subtitle: 'Review and update learning resources.' },
    questions: { title: 'Check-ins Question', subtitle: 'Manage the daily wellbeing check-in questions.' },
    'clinical-tools': { title: 'Self-Assessment Tools', subtitle: 'Create and maintain assessment tool sets.' },
    users: { title: 'Users', subtitle: 'View and manage user profiles.' },
  }[tab] || { title: '', subtitle: '' };

  if (tab === 'dashboard') {
    return (
      <HomeDashboardPage
        kpis={kpis}
        toolSubmissionChartData={toolSubmissionChartData}
        topEducationalContentBySubmissions={topEducationalContentBySubmissions}
        onTabChange={setTab}
      />
    );
  }

  const now = new Date();
  const upcomingEvents = filteredEvents
    .filter((event) => {
      if (!event?.start_at) return true;
      const start = new Date(event.start_at);
      return Number.isNaN(start.getTime()) ? true : start >= now;
    })
    .sort((a, b) => new Date(a.start_at || 0) - new Date(b.start_at || 0));

  const pastEvents = filteredEvents
    .filter((event) => {
      if (!event?.start_at) return false;
      const start = new Date(event.start_at);
      return !Number.isNaN(start.getTime()) && start < now;
    })
    .sort((a, b) => new Date(b.start_at || 0) - new Date(a.start_at || 0));

  const recordList =
    tab === 'events' ? (
      <div className="events-section-wrap">
        <section className="card events-section-card">
          <div className="events-section-head">
            <h3>Upcoming Events</h3>
            <span className="events-section-badge">{upcomingEvents.length}</span>
          </div>
          <EventsGrid
            events={upcomingEvents}
            onEditEvent={(eventId) => {
              setSelectedEventId(eventId);
              setIsEditingEvent(true);
            }}
            saving={saving}
          />
        </section>

        <section className="card events-section-card">
          <div className="events-section-head">
            <h3>Past Events</h3>
            <span className="events-section-badge">{pastEvents.length}</span>
          </div>
          <EventsGrid
            events={pastEvents}
            onEditEvent={(eventId) => {
              setSelectedEventId(eventId);
              setIsEditingEvent(true);
            }}
            saving={saving}
          />
        </section>
      </div>
    ) : tab === 'questions' ? (
      <div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${selectedQuestionCategory === null ? 'primary' : 'light'}`}
            onClick={() => setSelectedQuestionCategory(null)}
          >
            All Categories
          </button>
          {Array.from(new Set(filteredQuestions.map((q) => q.category || 'General'))).map((category) => (
            <button
              key={category}
              className={`btn ${selectedQuestionCategory === category ? 'primary' : 'light'}`}
              onClick={() => setSelectedQuestionCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <AdminRecordList
          tab={tab}
          filteredEvents={filteredEvents}
          filteredContents={filteredContents}
          filteredUsers={filteredUsers}
          filteredQuestions={selectedQuestionCategory ? filteredQuestions.filter((q) => (q.category || 'General') === selectedQuestionCategory) : filteredQuestions}
          filteredClinicalTools={filteredClinicalTools}
          selectedEventId={selectedEventId}
          selectedContentId={selectedContentId}
          selectedUserId={selectedUserId}
          selectedQuestionId={selectedQuestionId}
          selectedClinicalToolId={selectedClinicalToolId}
          setSelectedEventId={setSelectedEventId}
          setSelectedContentId={setSelectedContentId}
          setSelectedUserId={setSelectedUserId}
          setSelectedQuestionId={setSelectedQuestionId}
          setSelectedClinicalToolId={setSelectedClinicalToolId}
          clinicalSubmissionStatsByToolId={clinicalSubmissionStatsByToolId}
          clinicalQuestionCountByToolId={clinicalQuestionCountByToolId}
          saving={saving}
          toggleClinicalTool={toggleClinicalTool}
          onEditContent={() => setIsEditingContent(true)}
          onEditUser={() => setIsEditingUser(true)}
          onEditQuestion={() => setIsEditingQuestion(true)}
          onEditClinicalTool={() => setIsEditingClinicalTool(true)}
        />
      </div>
    ) : (
      <AdminRecordList
        tab={tab}
        filteredEvents={filteredEvents}
        filteredContents={filteredContents}
        filteredUsers={filteredUsers}
        filteredQuestions={filteredQuestions}
        filteredClinicalTools={filteredClinicalTools}
        selectedEventId={selectedEventId}
        selectedContentId={selectedContentId}
        selectedUserId={selectedUserId}
        selectedQuestionId={selectedQuestionId}
        selectedClinicalToolId={selectedClinicalToolId}
        setSelectedEventId={setSelectedEventId}
        setSelectedContentId={setSelectedContentId}
        setSelectedUserId={setSelectedUserId}
        setSelectedQuestionId={setSelectedQuestionId}
        setSelectedClinicalToolId={setSelectedClinicalToolId}
        clinicalSubmissionStatsByToolId={clinicalSubmissionStatsByToolId}
        clinicalQuestionCountByToolId={clinicalQuestionCountByToolId}
        saving={saving}
        toggleClinicalTool={toggleClinicalTool}
        toggleQuestion={toggleQuestion}
        onEditContent={() => setIsEditingContent(true)}
        onEditUser={() => setIsEditingUser(true)}
        onEditQuestion={() => setIsEditingQuestion(true)}
        onEditClinicalTool={() => setIsEditingClinicalTool(true)}
      />
    );

  const editorPanel = (
    <div className="card form">
      {tab === 'contents' && (
        <EducationalContentEditor
          contentForm={contentForm}
          setContentForm={setContentForm}
          saving={saving}
          selectedContentId={selectedContentId}
          onSave={async () => { const ok = await saveContent(); if (ok) setIsEditingContent(false); }}
          onDelete={async () => { const ok = await deleteContent(); if (ok) setIsEditingContent(false); }}
          onNew={() => {
            setSelectedContentId(null);
            setContentForm(EMPTY_CONTENT);
          }}
        />
      )}

      {tab === 'users' && (
        <UserEditor
          userForm={userForm}
          setUserForm={setUserForm}
          saving={saving}
          selectedUserId={selectedUserId}
          onSave={async () => { const ok = await saveUser(); if (ok) setIsEditingUser(false); }}
          onDelete={async () => { const ok = await deleteUserProfile(); if (ok) setIsEditingUser(false); }}
        />
      )}

      {tab === 'questions' && (
        <WellbeingQuestionsEditor
          form={questionForm}
          setForm={setQuestionForm}
          saving={saving}
          selectedId={selectedQuestionId}
          onSave={async () => { const ok = await saveQuestion(); if (ok) setIsEditingQuestion(false); }}
          onDelete={async () => { const ok = await deleteQuestion(); if (ok) setIsEditingQuestion(false); }}
          onNew={() => {
            setSelectedQuestionId(null);
            setQuestionForm(EMPTY_WELLBEING_QUESTION);
          }}
        />
      )}

      {tab === 'clinical-tools' && (
        <ClinicalToolsEditor
          form={clinicalToolForm}
          setForm={setClinicalToolForm}
          saving={saving}
          selectedId={selectedClinicalToolId}
          questionCount={clinicalQuestionCountByToolId.get(String(selectedClinicalToolId || '')) || 0}
          submissionCount={clinicalSubmissionStatsByToolId.get(String(selectedClinicalToolId || ''))?.count || 0}
          lastSubmissionAt={
            clinicalSubmissionStatsByToolId.get(String(selectedClinicalToolId || ''))?.lastAt || null
          }
          questions={selectedToolQuestions}
          selectedQuestionId={selectedToolQuestionId}
          onSelectQuestion={setSelectedToolQuestionId}
          questionForm={toolQuestionForm}
          setQuestionForm={setToolQuestionForm}
          onSaveQuestion={saveSelectedToolQuestion}
          onSave={async () => { const ok = await saveClinicalTool(); if (ok) setIsEditingClinicalTool(false); }}
        />
      )}
    </div>
  );

  return (
    <>
      <section className="dashboard-home" style={{ gap: '8px' }}>
        <div className="dashboard-home-header">
          <div className="dashboard-home-header-main">
            <h2>{pageMeta.title}</h2>
            <p>{pageMeta.subtitle}</p>
          </div>
          {showFloatingAddButton && (
            <button type="button" className="header-add-button" onClick={openAddModal}>
              <span className="header-add-plus">+</span>
              <span>{addButtonLabel}</span>
            </button>
          )}
        </div>

        <section className="admin-content" style={{ gridTemplateColumns: '1fr', marginTop: '6px' }}>
          {recordList}
        </section>
      </section>
      {tab === 'contents' && isEditingContent && (
        <EducationalContentEditor
          contentForm={contentForm}
          setContentForm={setContentForm}
          saving={saving}
          selectedContentId={selectedContentId}
          onSave={async () => { const ok = await saveContent(); if (ok) setIsEditingContent(false); }}
          onDelete={async () => { const ok = await deleteContent(); if (ok) setIsEditingContent(false); }}
          isEditingContent={isEditingContent}
          onCloseEditor={() => setIsEditingContent(false)}
        />
      )}

      {tab === 'users' && isEditingUser && (
        <UserEditor
          userForm={userForm}
          setUserForm={setUserForm}
          saving={saving}
          selectedUserId={selectedUserId}
          onSave={async () => { const ok = await saveUser(); if (ok) setIsEditingUser(false); }}
          onDelete={async () => { const ok = await deleteUserProfile(); if (ok) setIsEditingUser(false); }}
          isEditingUser={isEditingUser}
          onCloseEditor={() => setIsEditingUser(false)}
        />
      )}

      {tab === 'questions' && isEditingQuestion && (
        <WellbeingQuestionsEditor
          form={questionForm}
          setForm={setQuestionForm}
          saving={saving}
          selectedId={selectedQuestionId}
          onSave={async () => { const ok = await saveQuestion(); if (ok) setIsEditingQuestion(false); }}
          onDelete={async () => { const ok = await deleteQuestion(); if (ok) setIsEditingQuestion(false); }}
          isEditingQuestion={isEditingQuestion}
          onCloseEditor={() => setIsEditingQuestion(false)}
        />
      )}

      {tab === 'clinical-tools' && isEditingClinicalTool && (
        <ClinicalToolsEditor
          form={clinicalToolForm}
          setForm={setClinicalToolForm}
          saving={saving}
          selectedId={selectedClinicalToolId}
          onSave={async () => { const ok = await saveClinicalTool(); if (ok) setIsEditingClinicalTool(false); }}
          questionCount={clinicalQuestionCountByToolId.get(String(selectedClinicalToolId)) || 0}
          submissionCount={clinicalSubmissionStatsByToolId.get(String(selectedClinicalToolId))?.count || 0}
          lastSubmissionAt={clinicalSubmissionStatsByToolId.get(String(selectedClinicalToolId))?.lastAt || null}
          questions={selectedToolQuestions}
          selectedQuestionId={selectedToolQuestionId}
          onSelectQuestion={setSelectedToolQuestionId}
          questionForm={toolQuestionForm}
          setQuestionForm={setToolQuestionForm}
          onSaveQuestion={saveSelectedToolQuestion}
          isEditingClinicalTool={isEditingClinicalTool}
          onCloseEditor={() => setIsEditingClinicalTool(false)}
        />
      )}
      {tab === 'events' && isEditingEvent && (
        <EventsEditor
          eventForm={eventForm}
          setEventForm={setEventForm}
          eventFormErrors={eventFormErrors}
          setEventFormErrors={setEventFormErrors}
          saving={saving}
          selectedEventId={selectedEventId}
          onSave={async () => { const ok = await saveEvent(); if (ok) setIsEditingEvent(false); }}
          onDelete={async () => { const ok = await deleteEvent(); if (ok) setIsEditingEvent(false); }}
          isEditingEvent={isEditingEvent}
          onCloseEditor={() => {
            setEventFormErrors({});
            setIsEditingEvent(false);
          }}
        />
      )}

    </>
  );
}
