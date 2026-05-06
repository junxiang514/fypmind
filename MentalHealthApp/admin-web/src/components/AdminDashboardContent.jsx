import React from 'react';
import EventsEditor, { EMPTY_EVENT } from './EventsEditor';
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
    { icon: '❓', label: 'Check-Ins Questions', value: kpis.questions, tab: 'questions' },
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
          <div className="dashboard-home-eyebrow">Dashboard</div>
          <h2>All KPI metrics in one place</h2>
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
  eventForm,
  setEventForm,
  saveEvent,
  deleteEvent,
  contentForm,
  setContentForm,
  saveContent,
  deleteContent,
  userForm,
  setUserForm,
  saveUser,
  deleteUserProfile,
  questionForm,
  setQuestionForm,
  saveQuestion,
  deleteQuestion,
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

  const recordList = (
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
    />
  );

  const editorPanel = (
    <div className="card form">
      {tab === 'events' && (
        <EventsEditor
          eventForm={eventForm}
          setEventForm={setEventForm}
          saving={saving}
          selectedEventId={selectedEventId}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onNew={() => {
            setSelectedEventId(null);
            setEventForm(EMPTY_EVENT);
          }}
        />
      )}

      {tab === 'contents' && (
        <EducationalContentEditor
          contentForm={contentForm}
          setContentForm={setContentForm}
          saving={saving}
          selectedContentId={selectedContentId}
          onSave={saveContent}
          onDelete={deleteContent}
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
          onSave={saveUser}
          onDelete={deleteUserProfile}
        />
      )}

      {tab === 'questions' && (
        <WellbeingQuestionsEditor
          form={questionForm}
          setForm={setQuestionForm}
          saving={saving}
          selectedId={selectedQuestionId}
          onSave={saveQuestion}
          onDelete={deleteQuestion}
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
          onSave={saveClinicalTool}
          questions={selectedToolQuestions}
          selectedQuestionId={selectedToolQuestionId}
          onSelectQuestion={setSelectedToolQuestionId}
          questionForm={toolQuestionForm}
          setQuestionForm={setToolQuestionForm}
          onSaveQuestion={saveSelectedToolQuestion}
        />
      )}
    </div>
  );

  return (
    <section className="admin-content">
      <div className="admin-panel card">{recordList}</div>
      <div className="admin-panel">{editorPanel}</div>
    </section>
  );
}
