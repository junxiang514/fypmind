import React, { useEffect, useMemo, useState } from 'react';
import { supabase, supabaseInitError, publicReadClient } from './lib/supabase';
import mindLogo from '../../assets/MindAppLogo.png';
import AdminDashboardContent from './components/AdminDashboardContent';
import AdminLoginPage from './components/AdminLoginPage';
import AdminDashboardLayout from './components/AdminDashboardLayout';
import EventsEditor, { EMPTY_EVENT } from './components/EventsEditor';
import EducationalContentEditor, {
  EMPTY_CONTENT,
  normalizeActivityPayload,
  normalizeQuizPayload,
} from './components/EducationalContentEditor';
import UserEditor from './components/UserEditor';
import WellbeingQuestionsEditor, {
  EMPTY_WELLBEING_QUESTION,
  parseOptionsText,
  serializeOptions,
} from './components/WellbeingQuestionsEditor';
import ClinicalToolsEditor, { EMPTY_CLINICAL_TOOL } from './components/ClinicalToolsEditor';
import {
  toInputDateTime,
  toIso,
  isAdmin,
  nameFromEmail,
  isMissingColumnError,
  serializeClinicalOptions,
  parseClinicalOptionsText,
  buildFallbackProfile,
} from './lib/adminUtils';
export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [query, setQuery] = useState('');

  const [events, setEvents] = useState([]);
  const [contents, setContents] = useState([]);
  const [users, setUsers] = useState([]);
  const [wellbeingQuestions, setWellbeingQuestions] = useState([]);
  const [clinicalTools, setClinicalTools] = useState([]);
  const [clinicalQuestions, setClinicalQuestions] = useState([]);
  const [clinicalResponses, setClinicalResponses] = useState([]);
  const [educationalProgressRows, setEducationalProgressRows] = useState([]);
  const [approvalItems, setApprovalItems] = useState([]);

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [selectedClinicalToolId, setSelectedClinicalToolId] = useState(null);
  const [isEditingClinicalTool, setIsEditingClinicalTool] = useState(false);
  const [selectedToolQuestionId, setSelectedToolQuestionId] = useState(null);

  const signedInName =
    profile?.full_name?.trim() ||
    sessionUser?.user_metadata?.full_name ||
    sessionUser?.user_metadata?.name ||
    nameFromEmail(sessionUser?.email) ||
    sessionUser?.email ||
    'Admin';

  const signedInRole =
    profile?.role?.trim() ||
    (profile?.is_admin ? 'Admin Access' : 'User');

  if (!supabase || supabaseInitError) {
    return (
      <div className="login-wrap">
        <div className="card login-card">
          <h2>Admin app configuration error</h2>
          <p className="muted">The app could not initialize Supabase.</p>
          <div className="banner error">{supabaseInitError || 'Unknown initialization error.'}</div>
          <p className="muted" style={{ marginTop: 8 }}>
            Please check <strong>admin-web/.env.local</strong>, then restart <strong>npm run dev</strong>.
          </p>
        </div>
      </div>
    );
  }

  async function fetchProfile(userId) {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;
    setProfile(data || null);
    return data || null;
  }

  function isHeadRole(role) {
    const headRoles = new Set(['Head of Mental Health Consultant', 'Head of Application Manager']);
    return headRoles.has(role);
  }

  async function createOrApproveQueueEntry(operationType, tableName, recordId, recordData, currentUser, currentProfile) {
    const userIsHead = isHeadRole(currentProfile?.role);
    const now = new Date().toISOString();

    const queueEntry = {
      user_id: currentUser.id,
      operation_type: operationType,
      table_name: tableName,
      record_id: recordId || null,
      record_data: recordData,
      status: userIsHead ? 'approved' : 'pending',
      created_by_name: currentProfile?.full_name || currentUser?.email || 'Unknown',
      created_at: now,
      approved_at: userIsHead ? now : null,
      approved_by: userIsHead ? currentUser.id : null,
    };

    const { data, error: insertError } = await supabase
      .from('approval_queue')
      .insert([queueEntry])
      .select();

    if (insertError) throw insertError;
    return { approved: userIsHead, queueId: data?.[0]?.id };
  }

  async function loadAll(currentUser = sessionUser, currentProfile = profile) {
    setLoading(true);
    setError('');
    try {
      const [eventsRes, contentsRes, usersRes, questionsRes, toolsRes, clinicalQuestionsRes, responsesRes, educationalProgressRes, approvalsRes] = await Promise.allSettled([
        (publicReadClient || supabase)
          .from('events')
          .select('id, title, description, detailed_description, objective, agenda, category, start_at, end_at, location, address, fee, location_link, image_urls, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
        (publicReadClient || supabase)
          .from('educational_contents')
          .select('id, title, summary, category, video_url, quiz_payload, activity_payload, body, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, gender, role, is_admin, is_active, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1000),
        (publicReadClient || supabase)
          .from('wellbeing_questions')
          .select('id, category, prompt, answer_type, options, is_active, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(2000),
        (publicReadClient || supabase)
          .from('clinical_tools')
          .select('id, code, name, description, is_active')
          .order('code', { ascending: true }),
        (publicReadClient || supabase)
          .from('clinical_tool_questions')
          .select('id, tool_id, question_order, question_text, options')
          .order('tool_id', { ascending: true })
          .order('question_order', { ascending: true })
          .limit(5000),
        supabase
          .from('clinical_tool_responses')
          .select('id, tool_id, answers, created_at')
          .order('created_at', { ascending: false })
          .limit(10000),
        supabase
          .from('educational_content_progress')
          .select('content_id, updated_at')
          .order('updated_at', { ascending: false })
          .limit(20000),
        supabase
          .from('approval_queue')
          .select('id, user_id, operation_type, table_name, record_id, record_data, status, created_at, approved_at, approved_by, rejection_reason, created_by_name')
          .order('created_at', { ascending: false })
          .limit(1000),
      ]);

      const nextEvents = eventsRes.status === 'fulfilled' ? (eventsRes.value.data || []) : [];
      const nextContents = contentsRes.status === 'fulfilled' ? (contentsRes.value.data || []) : [];
      const nextUsers = usersRes.status === 'fulfilled' ? (usersRes.value.data || []) : [];
      const nextQuestions = questionsRes.status === 'fulfilled' ? (questionsRes.value.data || []) : [];
      const nextTools = toolsRes.status === 'fulfilled' ? (toolsRes.value.data || []) : [];
      const nextClinicalQuestions = clinicalQuestionsRes.status === 'fulfilled' ? (clinicalQuestionsRes.value.data || []) : [];
      const nextResponses = responsesRes.status === 'fulfilled' ? (responsesRes.value.data || []) : [];
      const nextEducationalProgress = educationalProgressRes.status === 'fulfilled' ? (educationalProgressRes.value.data || []) : [];
      const nextApprovalItems = approvalsRes.status === 'fulfilled' ? (approvalsRes.value.data || []) : [];

      const eventsError = eventsRes.status === 'fulfilled' ? eventsRes.value.error : eventsRes.reason;
      const contentsError = contentsRes.status === 'fulfilled' ? contentsRes.value.error : contentsRes.reason;
      const usersError = usersRes.status === 'fulfilled' ? usersRes.value.error : usersRes.reason;
      const questionsError = questionsRes.status === 'fulfilled' ? questionsRes.value.error : questionsRes.reason;
      const toolsError = toolsRes.status === 'fulfilled' ? toolsRes.value.error : toolsRes.reason;
      const clinicalQuestionsError = clinicalQuestionsRes.status === 'fulfilled' ? clinicalQuestionsRes.value.error : clinicalQuestionsRes.reason;
      const responsesError = responsesRes.status === 'fulfilled' ? responsesRes.value.error : responsesRes.reason;
      const educationalProgressError = educationalProgressRes.status === 'fulfilled'
        ? educationalProgressRes.value.error
        : educationalProgressRes.reason;

      if (eventsError) {
        throw new Error(
          `${eventsError?.message || 'Failed to load events.'} ` +
          'Check RLS policy for public read on events.'
        );
      }
      if (contentsError) {
        throw new Error(
          `${contentsError?.message || 'Failed to load educational contents.'} ` +
          'Check RLS policy for public read on educational_contents.'
        );
      }
      if (usersError) {
        // Non-blocking for UI continuity; admin can still use Events/Content tabs.
        setError(usersError?.message || 'Unable to load user list right now.');
      }
      if (questionsError) {
        setError(questionsError?.message || 'Unable to load wellbeing question list right now.');
      }
      if (toolsError) {
        if (isMissingColumnError(toolsError)) {
          const fallbackToolsRes = await (publicReadClient || supabase)
            .from('clinical_tools')
            .select('id, code, name, description')
            .order('code', { ascending: true });

          if (!fallbackToolsRes.error) {
            nextTools.splice(0, nextTools.length, ...(fallbackToolsRes.data || []).map((tool) => ({
              ...tool,
              is_active: true,
            })));
          } else {
            setError(fallbackToolsRes.error?.message || 'Unable to load self-assessment tools right now.');
          }
        } else {
          setError(toolsError?.message || 'Unable to load self-assessment tools right now.');
        }
      }

      let normalizedClinicalQuestions = nextClinicalQuestions;
      if (clinicalQuestionsError && isMissingColumnError(clinicalQuestionsError)) {
        const fallbackQuestionsRes = await (publicReadClient || supabase)
          .from('clinical_tool_questions')
          .select('id, tool_id, question_order, question_text, options')
          .order('tool_id', { ascending: true })
          .order('question_order', { ascending: true })
          .limit(5000);

        if (!fallbackQuestionsRes.error) {
          normalizedClinicalQuestions = fallbackQuestionsRes.data || [];
        } else {
          setError(fallbackQuestionsRes.error?.message || 'Unable to load self-assessment questions right now.');
        }
      } else if (clinicalQuestionsError) {
        setError(clinicalQuestionsError?.message || 'Unable to load self-assessment questions right now.');
      }

      if (responsesError) {
        setError(
          responsesError?.message ||
          'Unable to load self-assessment submission records. Add admin read policy for clinical_tool_responses.'
        );
      }
      if (educationalProgressError) {
        setError(
          educationalProgressError?.message ||
          'Unable to load educational content submission records right now.'
        );
      }

      const normalizedUsers = [...nextUsers];
      if (currentUser?.id && !normalizedUsers.some((u) => String(u.id) === String(currentUser.id))) {
        normalizedUsers.unshift(buildFallbackProfile(currentUser, currentProfile));
      }

      setEvents(nextEvents);
      setContents(nextContents);
      setUsers(normalizedUsers);
      setWellbeingQuestions(nextQuestions);
      setClinicalTools(nextTools);
      setClinicalQuestions(normalizedClinicalQuestions);
      setClinicalResponses(nextResponses);
      setEducationalProgressRows(nextEducationalProgress);
      setApprovalItems(nextApprovalItems);

      if (!selectedEventId && nextEvents.length) setSelectedEventId(nextEvents[0].id);
      if (!selectedContentId && nextContents.length) setSelectedContentId(nextContents[0].id);
      if (!selectedUserId && normalizedUsers.length) setSelectedUserId(normalizedUsers[0].id);
      if (!selectedQuestionId && nextQuestions.length) setSelectedQuestionId(nextQuestions[0].id);
      if (!selectedClinicalToolId && nextTools.length) {
        setSelectedClinicalToolId(nextTools[0].id);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }

  async function onLogin(e) {
    e.preventDefault();
    setError('');
    setStatus('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      if (authError) throw authError;

      const user = data?.user;
      if (!user) throw new Error('Login succeeded but no user returned.');

      const loadedProfile = await fetchProfile(user.id);
      if (!isAdmin(loadedProfile)) {
        await supabase.auth.signOut();
        throw new Error('Access denied: this account is not admin.');
      }

      setSessionUser(user);
      await loadAll(user, loadedProfile);
      setStatus('Login successful.');
    } catch (err) {
      setError(err?.message || 'Login failed.');
    }
  }

  async function onLogout() {
    await supabase.auth.signOut();
    setSessionUser(null);
    setProfile(null);
    setEvents([]);
    setContents([]);
    setUsers([]);
    setWellbeingQuestions([]);
    setClinicalTools([]);
    setClinicalQuestions([]);
    setClinicalResponses([]);
    setEducationalProgressRows([]);
    setSelectedEventId(null);
    setSelectedContentId(null);
    setSelectedUserId(null);
    setSelectedQuestionId(null);
    setSelectedClinicalToolId(null);
    setSelectedToolQuestionId(null);
    setTab('dashboard');
    setStatus('Logged out.');
  }

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((x) => JSON.stringify(x).toLowerCase().includes(q));
  }, [events, query]);

  const filteredContents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contents;
    return contents.filter((x) => JSON.stringify(x).toLowerCase().includes(q));
  }, [contents, query]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((x) => JSON.stringify(x).toLowerCase().includes(q));
  }, [users, query]);

  const filteredQuestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wellbeingQuestions;
    return wellbeingQuestions.filter((x) => JSON.stringify(x).toLowerCase().includes(q));
  }, [wellbeingQuestions, query]);

  const filteredClinicalTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clinicalTools;
    return clinicalTools.filter((x) => JSON.stringify(x).toLowerCase().includes(q));
  }, [clinicalTools, query]);

  const clinicalSubmissionStatsByToolId = useMemo(() => {
    const stats = new Map();
    for (const response of clinicalResponses) {
      const key = String(response?.tool_id || '');
      if (!key) continue;
      const current = stats.get(key) || { count: 0, lastAt: null };
      current.count += 1;
      if (response?.created_at && (!current.lastAt || new Date(response.created_at) > new Date(current.lastAt))) {
        current.lastAt = response.created_at;
      }
      stats.set(key, current);
    }
    return stats;
  }, [clinicalResponses]);

  const clinicalQuestionCountByToolId = useMemo(() => {
    const stats = new Map();
    for (const question of clinicalQuestions) {
      const key = String(question?.tool_id || '');
      if (!key) continue;
      stats.set(key, (stats.get(key) || 0) + 1);
    }
    return stats;
  }, [clinicalQuestions]);

  const toolSubmissionChartData = useMemo(() => {
    return clinicalTools
      .map((tool) => ({
        id: tool.id,
        label: tool.code || tool.name || 'Unknown tool',
        count: clinicalSubmissionStatsByToolId.get(String(tool.id))?.count || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [clinicalTools, clinicalSubmissionStatsByToolId]);

  const topEducationalContentBySubmissions = useMemo(() => {
    const countByContentId = new Map();
    for (const row of educationalProgressRows) {
      const contentId = String(row?.content_id || '');
      if (!contentId) continue;
      countByContentId.set(contentId, (countByContentId.get(contentId) || 0) + 1);
    }

    return contents
      .map((content) => ({
        id: content.id,
        title: content.title || 'Untitled content',
        count: countByContentId.get(String(content.id)) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [contents, educationalProgressRows]);

  const newUsersThisMonth = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return users.filter((user) => {
      const createdAt = new Date(user.created_at || 0);
      return createdAt >= oneMonthAgo && createdAt <= now;
    }).length;
  }, [users]);

  const dashboardKpis = {
    events: events.length,
    contents: contents.length,
    questions: wellbeingQuestions.length,
    tools: clinicalTools.length,
    users: users.filter((user) => user?.is_active !== false).length,
    submissions: clinicalResponses.length,
    newUsersThisMonth: newUsersThisMonth,
  };

  const selectedEvent = events.find((x) => x.id === selectedEventId) || null;
  const selectedContent = contents.find((x) => x.id === selectedContentId) || null;
  const selectedUser = users.find((x) => x.id === selectedUserId) || null;
  const selectedQuestion = wellbeingQuestions.find((x) => x.id === selectedQuestionId) || null;
  const selectedClinicalTool = clinicalTools.find((x) => x.id === selectedClinicalToolId) || null;
  const selectedToolQuestions = useMemo(() => {
    if (!selectedClinicalToolId) return [];
    return clinicalQuestions
      .filter((q) => String(q.tool_id) === String(selectedClinicalToolId))
      .sort((a, b) => Number(a.question_order || 0) - Number(b.question_order || 0));
  }, [clinicalQuestions, selectedClinicalToolId]);
  const selectedToolQuestion = useMemo(
    () => selectedToolQuestions.find((q) => String(q.id) === String(selectedToolQuestionId)) || null,
    [selectedToolQuestions, selectedToolQuestionId]
  );

  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [eventFormErrors, setEventFormErrors] = useState({});
  const [contentForm, setContentForm] = useState(EMPTY_CONTENT);
  const [userForm, setUserForm] = useState(null);
  const [questionForm, setQuestionForm] = useState(EMPTY_WELLBEING_QUESTION);
  const [clinicalToolForm, setClinicalToolForm] = useState(EMPTY_CLINICAL_TOOL);
  const [toolQuestionForm, setToolQuestionForm] = useState({
    question_order: 1,
    question_text: '',
    options_text: '',
  });

  useEffect(() => {
    if (!selectedEvent) {
      setEventForm(EMPTY_EVENT);
      setEventFormErrors({});
      return;
    }
    setEventForm({
      title: selectedEvent.title || '',
      description: selectedEvent.description || '',
      detailed_description: selectedEvent.detailed_description || '',
      objective: selectedEvent.objective || '',
      agenda: selectedEvent.agenda || '',
      category: selectedEvent.category || '',
      start_at: toInputDateTime(selectedEvent.start_at),
      end_at: toInputDateTime(selectedEvent.end_at),
      location: selectedEvent.location || '',
      address: selectedEvent.address || '',
      fee: selectedEvent.fee ?? '',
      location_link: selectedEvent.location_link || '',
      image_urls_text: Array.isArray(selectedEvent.image_urls) ? selectedEvent.image_urls.join('\n') : '',
    });
    setEventFormErrors({});
  }, [selectedEventId, events]);

  useEffect(() => {
    if (!selectedContent) {
      setContentForm(EMPTY_CONTENT);
      return;
    }
    setContentForm({
      title: selectedContent.title || '',
      summary: selectedContent.summary || '',
      category: selectedContent.category || '',
      video_url: selectedContent.video_url || '',
      quiz_payload: normalizeQuizPayload(selectedContent.quiz_payload),
      activity_payload: normalizeActivityPayload(selectedContent.activity_payload),
      body: selectedContent.body || '',
    });
  }, [selectedContentId, contents]);

  useEffect(() => {
    if (!selectedUser) {
      setUserForm(null);
      return;
    }
    setUserForm({
      full_name: selectedUser.full_name || '',
      email: selectedUser.email || '',
      phone: selectedUser.phone || '',
      gender: selectedUser.gender || '',
      role: selectedUser.is_admin ? (selectedUser.role || 'Mental Health Consultant') : null,
      is_admin: Boolean(selectedUser.is_admin),
      is_active: selectedUser.is_active !== false,
    });
  }, [selectedUserId, users]);

  useEffect(() => {
    if (!selectedQuestion) {
      setQuestionForm(EMPTY_WELLBEING_QUESTION);
      return;
    }

    setQuestionForm({
      category: selectedQuestion.category || 'Mood',
      prompt: selectedQuestion.prompt || '',
      answer_type: selectedQuestion.answer_type || 'likert_5',
      options_text: serializeOptions(selectedQuestion.options),
      is_active: selectedQuestion.is_active !== false,
    });
  }, [selectedQuestionId, wellbeingQuestions]);

  useEffect(() => {
    if (!selectedClinicalTool) {
      setClinicalToolForm(EMPTY_CLINICAL_TOOL);
      return;
    }

    setClinicalToolForm({
      code: selectedClinicalTool.code || '',
      name: selectedClinicalTool.name || '',
      description: selectedClinicalTool.description || '',
      is_active: selectedClinicalTool.is_active !== false,
    });
  }, [selectedClinicalToolId, clinicalTools]);

  useEffect(() => {
    if (!selectedToolQuestions.length) {
      setSelectedToolQuestionId(null);
      setToolQuestionForm({ question_order: 1, question_text: '', options_text: '' });
      return;
    }

    const hasSelected = selectedToolQuestions.some((q) => String(q.id) === String(selectedToolQuestionId));
    if (!hasSelected) {
      setSelectedToolQuestionId(selectedToolQuestions[0].id);
    }
  }, [selectedToolQuestions, selectedToolQuestionId]);

  useEffect(() => {
    if (!selectedToolQuestion) {
      setToolQuestionForm({ question_order: 1, question_text: '', options_text: '' });
      return;
    }

    setToolQuestionForm({
      question_order: Number(selectedToolQuestion.question_order) || 1,
      question_text: selectedToolQuestion.question_text || '',
      options_text: serializeClinicalOptions(selectedToolQuestion.options),
    });
  }, [selectedToolQuestion]);

  function collectEventValidationErrors(form) {
    const issues = {};
    const title = String(form?.title || '').trim();
    const startAt = String(form?.start_at || '').trim();
    const endAt = String(form?.end_at || '').trim();
    const location = String(form?.location || '').trim();
    const locationLink = String(form?.location_link || '').trim();

    if (!title) issues.title = 'Event title is required.';
    if (!startAt) issues.start_at = 'Start date/time is required.';
    if (!endAt) issues.end_at = 'End date/time is required.';
    if (!location) issues.location = 'Location is required.';
    if (!locationLink) {
      issues.location_link = 'Location link is required (single navigation source).';
    }

    if (startAt && endAt) {
      const startDate = new Date(startAt);
      const endDate = new Date(endAt);
      if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate < startDate) {
        issues.end_at = 'End date/time must be after start date/time.';
      }
    }

    if (locationLink) {
      try {
        const parsed = new URL(locationLink);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          issues.location_link = 'Location link must start with http:// or https://.';
        }
      } catch {
        issues.location_link = 'Location link must be a valid URL.';
      }
    }

    return issues;
  }

  async function saveEvent() {
    const validationErrors = collectEventValidationErrors(eventForm);
    if (Object.keys(validationErrors).length > 0) {
      setEventFormErrors(validationErrors);
      setStatus('');
      setError('');
      return false;
    }
    setEventFormErrors({});
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const imageUrls = String(eventForm.image_urls_text || '')
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
      const feeValue = String(eventForm.fee || '').trim();
      const normalizedFee = feeValue === '' ? null : Number.parseInt(feeValue, 10);

      const payload = {
        id: selectedEventId || undefined,
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || null,
        detailed_description: eventForm.detailed_description.trim() || null,
        objective: eventForm.objective.trim() || null,
        agenda: eventForm.agenda.trim() || null,
        category: eventForm.category.trim() || null,
        start_at: toIso(eventForm.start_at),
        end_at: toIso(eventForm.end_at),
        location: eventForm.location.trim() || null,
        address: eventForm.address.trim() || null,
        fee: Number.isFinite(normalizedFee) ? normalizedFee : null,
        location_link: eventForm.location_link.trim() || null,
        image_urls: imageUrls,
      };

      const operationType = selectedEventId ? 'update' : 'add';
      const { approved } = await createOrApproveQueueEntry(operationType, 'events', selectedEventId, payload, sessionUser, profile);
      
      if (approved) {
        const { error: upsertError } = await supabase.from('events').upsert(payload, { onConflict: 'id' });
        if (upsertError) throw upsertError;
        await loadAll(sessionUser, profile);
        setStatus('Event saved and approved.');
      } else {
        setStatus('Event submitted for approval.');
      }
      return true;
    } catch (e) {
      setError(e?.message || 'Failed to save event.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent() {
    if (!selectedEventId) return false;
    setSaving(true);
    try {
      const eventRow = events.find((x) => x.id === selectedEventId) || { id: selectedEventId };
      const { approved } = await createOrApproveQueueEntry('delete', 'events', selectedEventId, eventRow, sessionUser, profile);
      
      if (approved) {
        const { error: deleteError } = await supabase.from('events').delete().eq('id', selectedEventId);
        if (deleteError) throw deleteError;
        setSelectedEventId(null);
        await loadAll(sessionUser, profile);
        setStatus('Event deleted and approved.');
      } else {
        setStatus('Event deletion submitted for approval.');
      }
      return true;
    } catch (e) {
      setError(e?.message || 'Failed to delete event.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveContent() {
    if (!contentForm.title.trim()) {
      setError('Content title is required.');
      return false;
    }

    const quizPayload = (contentForm.quiz_payload || [])
      .map((q) => ({
        question: String(q?.question || '').trim(),
        options: Array.isArray(q?.options) ? q.options.map((x) => String(x || '').trim()).filter(Boolean) : [],
        answer: Number.isInteger(q?.answer) ? q.answer : 0,
      }))
      .filter((q) => q.question);

    for (const q of quizPayload) {
      if (q.options.length < 2) {
        return setError('Each quiz question must have at least 2 options.');
      }
      if (q.answer < 0 || q.answer >= q.options.length) {
        return setError(`Quiz answer index out of range for question: ${q.question}`);
      }
    }

    const activityPayload = (contentForm.activity_payload || [])
      .map((a, idx) => ({
        key: String(a?.key || `activity_${idx + 1}`).trim() || `activity_${idx + 1}`,
        label: String(a?.label || '').trim(),
      }))
      .filter((a) => a.label);

    setSaving(true);
    try {
      const payload = {
        id: selectedContentId || undefined,
        title: contentForm.title.trim(),
        summary: contentForm.summary.trim() || null,
        category: contentForm.category.trim() || null,
        video_url: contentForm.video_url.trim() || null,
        quiz_payload: quizPayload,
        activity_payload: activityPayload,
        body: contentForm.body.trim() || null,
      };
      const operationType = selectedContentId ? 'update' : 'add';
      const { approved } = await createOrApproveQueueEntry(operationType, 'educational_contents', selectedContentId, payload, sessionUser, profile);
      
      if (approved) {
        const { error: upsertError } = await supabase.from('educational_contents').upsert(payload, { onConflict: 'id' });
        if (upsertError) throw upsertError;
        await loadAll(sessionUser, profile);
        setStatus('Educational content saved and approved.');
      } else {
        setStatus('Educational content submitted for approval.');
      }
      return true;
    } catch (e) {
      setError(e?.message || 'Failed to save content.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent() {
    if (!selectedContentId) return false;
    setSaving(true);
    try {
      const contentRow = contents.find((x) => x.id === selectedContentId) || { id: selectedContentId };
      const { approved } = await createOrApproveQueueEntry('delete', 'educational_contents', selectedContentId, contentRow, sessionUser, profile);
      
      if (approved) {
        const { error: deleteError } = await supabase.from('educational_contents').delete().eq('id', selectedContentId);
        if (deleteError) throw deleteError;
        setSelectedContentId(null);
        await loadAll(sessionUser, profile);
        setStatus('Educational content deleted and approved.');
      } else {
        setStatus('Educational content deletion submitted for approval.');
      }
      return true;
    } catch (e) {
      setError(e?.message || 'Failed to delete content.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveUser() {
    if (!selectedUserId || !userForm) return false;
    setSaving(true);
    try {
      const payload = {
        id: selectedUserId,
        full_name: userForm.full_name.trim() || null,
        email: userForm.email.trim() || null,
        phone: userForm.phone.trim() || null,
        gender: userForm.gender.trim() || null,
        role: userForm.is_admin ? (userForm.role || 'Mental Health Consultant') : null,
        is_admin: userForm.is_admin,
        is_active: userForm.is_active,
      };
      const { approved } = await createOrApproveQueueEntry('update', 'profiles', selectedUserId, payload, sessionUser, profile);
      
      if (approved) {
        const { error: upsertError } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
        if (upsertError) throw upsertError;
        await loadAll(sessionUser, profile);
        setStatus('User profile updated and approved.');
      } else {
        setStatus('User profile change submitted for approval.');
      }
      return true;
    } catch (e) {
      setError(e?.message || 'Failed to save user.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteUserProfile() {
    if (!selectedUserId) return false;
    setSaving(true);
    try {
      const userRow = users.find((x) => x.id === selectedUserId) || { id: selectedUserId };
      const { approved } = await createOrApproveQueueEntry('delete', 'profiles', selectedUserId, userRow, sessionUser, profile);
      
      if (approved) {
        const { error: deleteError } = await supabase.from('profiles').delete().eq('id', selectedUserId);
        if (deleteError) throw deleteError;
        setSelectedUserId(null);
        await loadAll(sessionUser, profile);
        setStatus('Profile row deleted and approved.');
      } else {
        setStatus('Profile deletion submitted for approval.');
      }
      return true;
    } catch (e) {
      setError(e?.message || 'Failed to delete profile row.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveQuestion() {
    if (!questionForm.prompt.trim()) {
      setError('Question prompt is required.');
      return false;
    }
    if (!questionForm.category.trim()) {
      setError('Question category is required.');
      return false;
    }

    const parsedOptions = parseOptionsText(questionForm.options_text);
    if (questionForm.answer_type === 'custom' && parsedOptions.length < 2) {
      setError('Custom type requires at least 2 options (label|value).');
      return false;
    }

    setSaving(true);
    try {
      const payload = {
        id: selectedQuestionId || undefined,
        category: questionForm.category.trim(),
        prompt: questionForm.prompt.trim(),
        answer_type: questionForm.answer_type,
        options: questionForm.answer_type === 'custom' ? parsedOptions : null,
        is_active: questionForm.is_active,
        updated_at: new Date().toISOString(),
      };

      const operationType = selectedQuestionId ? 'update' : 'add';
      const { approved } = await createOrApproveQueueEntry(operationType, 'wellbeing_questions', selectedQuestionId, payload, sessionUser, profile);
      
      if (approved) {
        const { error: upsertError } = await supabase.from('wellbeing_questions').upsert(payload, { onConflict: 'id' });
        if (upsertError) throw upsertError;
        await loadAll(sessionUser, profile);
        setStatus('Wellbeing question saved and approved.');
      } else {
        setStatus('Wellbeing question submitted for approval.');
      }
      return true;
    } catch (e) {
      setError(e?.message || 'Failed to save wellbeing question.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion() {
    if (!selectedQuestionId) return false;

    setSaving(true);
    try {
      const questionRow = wellbeingQuestions.find((x) => x.id === selectedQuestionId) || { id: selectedQuestionId };
      const { approved } = await createOrApproveQueueEntry('delete', 'wellbeing_questions', selectedQuestionId, questionRow, sessionUser, profile);
      
      if (approved) {
        const { error: deleteError } = await supabase
          .from('wellbeing_questions')
          .delete()
          .eq('id', selectedQuestionId);

        if (deleteError) throw deleteError;
        setSelectedQuestionId(null);
        await loadAll(sessionUser, profile);
        setStatus('Wellbeing question deleted and approved.');
      } else {
        setStatus('Wellbeing question deletion submitted for approval.');
      }
      return true;
    } catch (e) {
      setError(e?.message || 'Failed to delete wellbeing question.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveClinicalTool() {
    if (!clinicalToolForm.code.trim()) {
      setError('Tool code is required.');
      return false;
    }
    if (!clinicalToolForm.name.trim()) {
      setError('Tool name is required.');
      return false;
    }

    setSaving(true);
    try {
      const payload = {
        id: selectedClinicalToolId || undefined,
        code: clinicalToolForm.code.trim(),
        name: clinicalToolForm.name.trim(),
        description: clinicalToolForm.description.trim() || null,
        is_active: clinicalToolForm.is_active,
      };

      const operationType = selectedClinicalToolId ? 'update' : 'add';
      const { approved } = await createOrApproveQueueEntry(operationType, 'clinical_tools', selectedClinicalToolId, payload, sessionUser, profile);
      
      if (approved) {
        let saveError = null;
        if (selectedClinicalToolId) {
          const { error: updateError } = await supabase
            .from('clinical_tools')
            .update(payload)
            .eq('id', selectedClinicalToolId);
          saveError = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('clinical_tools')
            .insert(payload);
          saveError = insertError;
        }

        if (saveError) {
          if (isMissingColumnError(saveError)) {
            throw new Error('Missing column clinical_tools.is_active. Please run clinical_tools_admin.sql first.');
          }
          throw saveError;
        }

        await loadAll(sessionUser, profile);
        setStatus(selectedClinicalToolId ? 'Self-assessment tool updated and approved.' : 'Self-assessment tool created and approved.');
      } else {
        setStatus(selectedClinicalToolId ? 'Tool update submitted for approval.' : 'New tool submitted for approval.');
      }
      return true;
    } catch (e) {
      setError(e?.message || 'Failed to save self-assessment tool.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function toggleClinicalTool(item, nextActive) {
    if (!item?.id) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        id: item.id,
        code: item.code,
        name: item.name,
        is_active: nextActive,
      };

      const { approved } = await createOrApproveQueueEntry('update', 'clinical_tools', item.id, payload, sessionUser, profile);

      if (approved) {
        const { error: updateError } = await supabase
          .from('clinical_tools')
          .update({ is_active: nextActive })
          .eq('id', item.id);

        if (updateError) {
          if (isMissingColumnError(updateError)) {
            throw new Error('Missing column clinical_tools.is_active. Please run clinical_tools_admin.sql first.');
          }
          throw updateError;
        }

        setClinicalTools((prev) => prev.map((tool) => (
          tool.id === item.id ? { ...tool, is_active: nextActive } : tool
        )));

        if (selectedClinicalToolId === item.id) {
          setClinicalToolForm((prev) => ({ ...prev, is_active: nextActive }));
        }

        setStatus(`Tool ${item.code || item.name || ''} is now ${nextActive ? 'enabled' : 'disabled'}.`);
      } else {
        setStatus('Tool status change submitted for approval.');
      }
    } catch (e) {
      setError(e?.message || 'Failed to update tool status.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleQuestion(item, nextActive) {
    if (!item?.id) {
      console.error('No item ID provided to toggleQuestion');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        id: item.id,
        category: item.category,
        prompt: item.prompt,
        is_active: nextActive,
      };

      const { approved } = await createOrApproveQueueEntry('update', 'wellbeing_questions', item.id, payload, sessionUser, profile);

      if (approved) {
        const { error: updateError } = await supabase
          .from('wellbeing_questions')
          .update({ is_active: nextActive })
          .eq('id', item.id);

        if (updateError) {
          if (isMissingColumnError(updateError)) {
            throw new Error('Missing column wellbeing_questions.is_active. Please run the database migration.');
          }
          throw updateError;
        }

        setWellbeingQuestions((prev) => prev.map((question) => (
          question.id === item.id ? { ...question, is_active: nextActive } : question
        )));

        if (selectedQuestionId === item.id) {
          setQuestionForm((prev) => ({ ...prev, is_active: nextActive }));
        }

        setStatus(`Question is now ${nextActive ? 'enabled' : 'disabled'}.`);
      } else {
        setStatus('Question status change submitted for approval.');
      }
    } catch (e) {
      console.error('Toggle question error:', e);
      setError(e?.message || 'Failed to update question status.');
    } finally {
      setSaving(false);
    }
  }

  async function saveSelectedToolQuestion() {
    if (!selectedToolQuestionId) return;

    const questionOrder = Number(toolQuestionForm.question_order);
    if (!Number.isInteger(questionOrder) || questionOrder < 1) {
      return setError('Question order must be an integer greater than 0.');
    }
    if (!toolQuestionForm.question_text.trim()) {
      return setError('Question text is required.');
    }

    const parsedOptions = parseClinicalOptionsText(toolQuestionForm.options_text);
    if (parsedOptions.length < 2) {
      return setError('Each question requires at least 2 options (label|value).');
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        id: selectedToolQuestionId,
        question_order: questionOrder,
        question_text: toolQuestionForm.question_text.trim(),
        options: parsedOptions,
      };

      const { approved } = await createOrApproveQueueEntry('update', 'clinical_tool_questions', selectedToolQuestionId, payload, sessionUser, profile);

      if (approved) {
        const { error: updateError } = await supabase
          .from('clinical_tool_questions')
          .update({
            question_order: questionOrder,
            question_text: toolQuestionForm.question_text.trim(),
            options: parsedOptions,
          })
          .eq('id', selectedToolQuestionId);

        if (updateError) throw updateError;

        await loadAll(sessionUser, profile);
        setStatus('Question updated and approved.');
      } else {
        setStatus('Tool question update submitted for approval.');
      }
    } catch (e) {
      setError(e?.message || 'Failed to update question.');
    } finally {
      setSaving(false);
    }
  }

  async function approveApprovalItem(itemId) {
    if (!itemId) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      if (!isHeadRole(profile?.role)) {
        throw new Error('Only head roles can approve or reject requests.');
      }

      const item = approvalItems.find((x) => x.id === itemId);
      if (!item) throw new Error('Approval item not found.');

      const APPLICATION_MANAGER_TABLES = new Set(['events', 'educational_contents', 'profiles']);
      const MENTAL_HEALTH_TABLES = new Set(['wellbeing_questions', 'clinical_tools', 'clinical_tool_questions']);
      const headRole = profile?.role;
      const tableName = item?.table_name;

      const isAllowedTable =
        (headRole === 'Head of Application Manager' && APPLICATION_MANAGER_TABLES.has(tableName)) ||
        (headRole === 'Head of Mental Health Consultant' && MENTAL_HEALTH_TABLES.has(tableName));

      if (!isAllowedTable) {
        throw new Error('You can only approve/reject requests from your own department.');
      }

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('approval_queue')
        .update({
          status: 'approved',
          approved_at: now,
          approved_by: sessionUser.id,
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // If approved by head, also apply the operation to the actual table
      if (item.operation_type === 'add' || item.operation_type === 'update') {
        const { error: applyError } = await supabase
          .from(item.table_name)
          .upsert(item.record_data, { onConflict: 'id' });
        if (applyError) throw applyError;
      } else if (item.operation_type === 'delete' && item.record_id) {
        const { error: deleteError } = await supabase
          .from(item.table_name)
          .delete()
          .eq('id', item.record_id);
        if (deleteError) throw deleteError;
      }

      await loadAll(sessionUser, profile);
      setStatus('Approval item approved and applied.');
    } catch (e) {
      setError(e?.message || 'Failed to approve item.');
    } finally {
      setSaving(false);
    }
  }

  async function rejectApprovalItem(itemId, reason = '') {
    if (!itemId) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      if (!isHeadRole(profile?.role)) {
        throw new Error('Only head roles can approve or reject requests.');
      }

      const item = approvalItems.find((x) => x.id === itemId);
      if (!item) throw new Error('Approval item not found.');

      const APPLICATION_MANAGER_TABLES = new Set(['events', 'educational_contents', 'profiles']);
      const MENTAL_HEALTH_TABLES = new Set(['wellbeing_questions', 'clinical_tools', 'clinical_tool_questions']);
      const headRole = profile?.role;
      const tableName = item?.table_name;

      const isAllowedTable =
        (headRole === 'Head of Application Manager' && APPLICATION_MANAGER_TABLES.has(tableName)) ||
        (headRole === 'Head of Mental Health Consultant' && MENTAL_HEALTH_TABLES.has(tableName));

      if (!isAllowedTable) {
        throw new Error('You can only approve/reject requests from your own department.');
      }

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('approval_queue')
        .update({
          status: 'rejected',
          rejection_reason: reason || null,
          approved_at: now,
          approved_by: sessionUser.id,
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      await loadAll(sessionUser, profile);
      setStatus('Approval item rejected.');
    } catch (e) {
      setError(e?.message || 'Failed to reject item.');
    } finally {
      setSaving(false);
    }
  }

  if (!sessionUser) {
    return (
      <AdminLoginPage
        logoSrc={mindLogo}
        onSubmit={onLogin}
        email={loginEmail}
        password={loginPassword}
        onEmailChange={(e) => setLoginEmail(e.target.value)}
        onPasswordChange={(e) => setLoginPassword(e.target.value)}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <>
      <AdminDashboardLayout
        signedInName={signedInName}
        signedInRole={signedInRole}
        onRefresh={() => loadAll()}
        onLogout={onLogout}
        tab={tab}
        setTab={setTab}
        query={query}
        setQuery={setQuery}
        status={status}
        error={error}
        content={(
          <AdminDashboardContent
            signedInRole={signedInRole}
            tab={tab}
            setTab={setTab}
            kpis={dashboardKpis}
            saving={saving}
            filteredEvents={filteredEvents}
            filteredContents={filteredContents}
            filteredUsers={filteredUsers}
            filteredQuestions={filteredQuestions}
            filteredClinicalTools={filteredClinicalTools}
            toolSubmissionChartData={toolSubmissionChartData}
            topEducationalContentBySubmissions={topEducationalContentBySubmissions}
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
            toggleClinicalTool={toggleClinicalTool}
            toggleQuestion={toggleQuestion}
            eventForm={eventForm}
            setEventForm={setEventForm}
            eventFormErrors={eventFormErrors}
            setEventFormErrors={setEventFormErrors}
            saveEvent={saveEvent}
            deleteEvent={deleteEvent}
            isEditingEvent={isEditingEvent}
            setIsEditingEvent={setIsEditingEvent}
            contentForm={contentForm}
            setContentForm={setContentForm}
            saveContent={saveContent}
            deleteContent={deleteContent}
            isEditingContent={isEditingContent}
            setIsEditingContent={setIsEditingContent}
            userForm={userForm}
            setUserForm={setUserForm}
            saveUser={saveUser}
            deleteUserProfile={deleteUserProfile}
            isEditingUser={isEditingUser}
            setIsEditingUser={setIsEditingUser}
            questionForm={questionForm}
            setQuestionForm={setQuestionForm}
            saveQuestion={saveQuestion}
            deleteQuestion={deleteQuestion}
            isEditingQuestion={isEditingQuestion}
            setIsEditingQuestion={setIsEditingQuestion}
            clinicalToolForm={clinicalToolForm}
            setClinicalToolForm={setClinicalToolForm}
            saveClinicalTool={saveClinicalTool}
            isEditingClinicalTool={isEditingClinicalTool}
            setIsEditingClinicalTool={setIsEditingClinicalTool}
            selectedToolQuestions={selectedToolQuestions}
            selectedToolQuestionId={selectedToolQuestionId}
            setSelectedToolQuestionId={setSelectedToolQuestionId}
            toolQuestionForm={toolQuestionForm}
            setToolQuestionForm={setToolQuestionForm}
            saveSelectedToolQuestion={saveSelectedToolQuestion}
            approvalItems={approvalItems}
            approveApprovalItem={approveApprovalItem}
            rejectApprovalItem={rejectApprovalItem}
          />
        )}
        logoSrc={mindLogo}
      />
      {loading && <div className="loading">Loading...</div>}
    </>
  );
}
