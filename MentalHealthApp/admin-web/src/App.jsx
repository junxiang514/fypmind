import React, { useEffect, useMemo, useState } from 'react';
import { supabase, supabaseInitError, publicReadClient } from './lib/supabase';
import mindLogo from '../../assets/MindAppLogo.png';
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
import AdminRecordList from './components/AdminRecordList';
import AdminLoginPage from './components/AdminLoginPage';
import AdminDashboardLayout from './components/AdminDashboardLayout';
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
  const [tab, setTab] = useState('events');
  const [query, setQuery] = useState('');

  const [events, setEvents] = useState([]);
  const [contents, setContents] = useState([]);
  const [users, setUsers] = useState([]);
  const [wellbeingQuestions, setWellbeingQuestions] = useState([]);
  const [clinicalTools, setClinicalTools] = useState([]);
  const [clinicalQuestions, setClinicalQuestions] = useState([]);
  const [clinicalResponses, setClinicalResponses] = useState([]);

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [selectedClinicalToolId, setSelectedClinicalToolId] = useState(null);
  const [selectedToolQuestionId, setSelectedToolQuestionId] = useState(null);

  const signedInName =
    profile?.full_name?.trim() ||
    sessionUser?.user_metadata?.full_name ||
    sessionUser?.user_metadata?.name ||
    nameFromEmail(sessionUser?.email) ||
    sessionUser?.email ||
    'Admin';

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

  async function loadAll(currentUser = sessionUser, currentProfile = profile) {
    setLoading(true);
    setError('');
    try {
      const [eventsRes, contentsRes, usersRes, questionsRes, toolsRes, clinicalQuestionsRes, responsesRes] = await Promise.allSettled([
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
          .select('id, full_name, email, phone, gender, medical_history, role, is_admin, is_active, updated_at')
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
        (publicReadClient || supabase)
          .from('clinical_tool_responses')
          .select('id, tool_id, answers, created_at')
          .order('created_at', { ascending: false })
          .limit(10000),
      ]);

      const nextEvents = eventsRes.status === 'fulfilled' ? (eventsRes.value.data || []) : [];
      const nextContents = contentsRes.status === 'fulfilled' ? (contentsRes.value.data || []) : [];
      const nextUsers = usersRes.status === 'fulfilled' ? (usersRes.value.data || []) : [];
      const nextQuestions = questionsRes.status === 'fulfilled' ? (questionsRes.value.data || []) : [];
      const nextTools = toolsRes.status === 'fulfilled' ? (toolsRes.value.data || []) : [];
      const nextClinicalQuestions = clinicalQuestionsRes.status === 'fulfilled' ? (clinicalQuestionsRes.value.data || []) : [];
      const nextResponses = responsesRes.status === 'fulfilled' ? (responsesRes.value.data || []) : [];

      const eventsError = eventsRes.status === 'fulfilled' ? eventsRes.value.error : eventsRes.reason;
      const contentsError = contentsRes.status === 'fulfilled' ? contentsRes.value.error : contentsRes.reason;
      const usersError = usersRes.status === 'fulfilled' ? usersRes.value.error : usersRes.reason;
      const questionsError = questionsRes.status === 'fulfilled' ? questionsRes.value.error : questionsRes.reason;
      const toolsError = toolsRes.status === 'fulfilled' ? toolsRes.value.error : toolsRes.reason;
      const clinicalQuestionsError = clinicalQuestionsRes.status === 'fulfilled' ? clinicalQuestionsRes.value.error : clinicalQuestionsRes.reason;
      const responsesError = responsesRes.status === 'fulfilled' ? responsesRes.value.error : responsesRes.reason;

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
    setSelectedEventId(null);
    setSelectedContentId(null);
    setSelectedUserId(null);
    setSelectedQuestionId(null);
    setSelectedClinicalToolId(null);
    setSelectedToolQuestionId(null);
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
      fee: selectedEvent.fee || '',
      location_link: selectedEvent.location_link || '',
      image_urls_text: Array.isArray(selectedEvent.image_urls) ? selectedEvent.image_urls.join('\n') : '',
    });
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
      medical_history: selectedUser.medical_history || '',
      role: selectedUser.role || 'user',
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

  async function saveEvent() {
    if (!eventForm.title.trim()) return setError('Event title is required.');
    if (!eventForm.location_link.trim()) return setError('Location link is required (single navigation source).');
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const imageUrls = String(eventForm.image_urls_text || '')
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);

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
        fee: eventForm.fee.trim() || null,
        location_link: eventForm.location_link.trim() || null,
        image_urls: imageUrls,
      };
      const { error: upsertError } = await supabase.from('events').upsert(payload, { onConflict: 'id' });
      if (upsertError) throw upsertError;
      await loadAll(sessionUser, profile);
      setStatus('Event saved.');
    } catch (e) {
      setError(e?.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent() {
    if (!selectedEventId) return;
    setSaving(true);
    try {
      const { error: deleteError } = await supabase.from('events').delete().eq('id', selectedEventId);
      if (deleteError) throw deleteError;
      setSelectedEventId(null);
      await loadAll(sessionUser, profile);
      setStatus('Event deleted.');
    } catch (e) {
      setError(e?.message || 'Failed to delete event.');
    } finally {
      setSaving(false);
    }
  }

  async function saveContent() {
    if (!contentForm.title.trim()) return setError('Content title is required.');

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
      const { error: upsertError } = await supabase.from('educational_contents').upsert(payload, { onConflict: 'id' });
      if (upsertError) throw upsertError;
      await loadAll(sessionUser, profile);
      setStatus('Educational content saved.');
    } catch (e) {
      setError(e?.message || 'Failed to save content.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent() {
    if (!selectedContentId) return;
    setSaving(true);
    try {
      const { error: deleteError } = await supabase.from('educational_contents').delete().eq('id', selectedContentId);
      if (deleteError) throw deleteError;
      setSelectedContentId(null);
      await loadAll(sessionUser, profile);
      setStatus('Educational content deleted.');
    } catch (e) {
      setError(e?.message || 'Failed to delete content.');
    } finally {
      setSaving(false);
    }
  }

  async function saveUser() {
    if (!selectedUserId || !userForm) return;
    setSaving(true);
    try {
      const payload = {
        id: selectedUserId,
        full_name: userForm.full_name.trim() || null,
        email: userForm.email.trim() || null,
        phone: userForm.phone.trim() || null,
        gender: userForm.gender.trim() || null,
        medical_history: userForm.medical_history.trim() || null,
        role: userForm.role,
        is_admin: userForm.is_admin,
        is_active: userForm.is_active,
      };
      const { error: upsertError } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (upsertError) throw upsertError;
      await loadAll(sessionUser, profile);
      setStatus('User profile updated.');
    } catch (e) {
      setError(e?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteUserProfile() {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const { error: deleteError } = await supabase.from('profiles').delete().eq('id', selectedUserId);
      if (deleteError) throw deleteError;
      setSelectedUserId(null);
      await loadAll(sessionUser, profile);
      setStatus('Profile row deleted.');
    } catch (e) {
      setError(e?.message || 'Failed to delete profile row.');
    } finally {
      setSaving(false);
    }
  }

  async function saveQuestion() {
    if (!questionForm.prompt.trim()) return setError('Question prompt is required.');
    if (!questionForm.category.trim()) return setError('Question category is required.');

    const parsedOptions = parseOptionsText(questionForm.options_text);
    if (questionForm.answer_type === 'custom' && parsedOptions.length < 2) {
      return setError('Custom type requires at least 2 options (label|value).');
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

      const { error: upsertError } = await supabase.from('wellbeing_questions').upsert(payload, { onConflict: 'id' });
      if (upsertError) throw upsertError;

      await loadAll(sessionUser, profile);
      setStatus('Wellbeing question saved.');
    } catch (e) {
      setError(e?.message || 'Failed to save wellbeing question.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion() {
    if (!selectedQuestionId) return;

    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from('wellbeing_questions')
        .delete()
        .eq('id', selectedQuestionId);

      if (deleteError) throw deleteError;

      setSelectedQuestionId(null);
      await loadAll(sessionUser, profile);
      setStatus('Wellbeing question deleted.');
    } catch (e) {
      setError(e?.message || 'Failed to delete wellbeing question.');
    } finally {
      setSaving(false);
    }
  }

  async function saveClinicalTool() {
    if (!selectedClinicalToolId) return;

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('clinical_tools')
        .update({ is_active: clinicalToolForm.is_active })
        .eq('id', selectedClinicalToolId);

      if (updateError) {
        if (isMissingColumnError(updateError)) {
          throw new Error('Missing column clinical_tools.is_active. Please run clinical_tools_admin.sql first.');
        }
        throw updateError;
      }

      await loadAll(sessionUser, profile);
      setStatus('Self-assessment tool updated.');
    } catch (e) {
      setError(e?.message || 'Failed to save self-assessment tool.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleClinicalTool(item, nextActive) {
    if (!item?.id) return;
    setSaving(true);
    setError('');
    try {
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
    } catch (e) {
      setError(e?.message || 'Failed to update tool status.');
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
      setStatus('Question updated.');
    } catch (e) {
      setError(e?.message || 'Failed to update question.');
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
    <>
      <AdminDashboardLayout
        signedInName={signedInName}
        onRefresh={() => loadAll()}
        onLogout={onLogout}
        tab={tab}
        setTab={setTab}
        query={query}
        setQuery={setQuery}
        status={status}
        error={error}
        kpis={{
          events: events.length,
          contents: contents.length,
          questions: wellbeingQuestions.length,
          tools: clinicalTools.length,
          users: users.filter((user) => user?.is_active !== false).length,
          submissions: clinicalResponses.length,
        }}
        list={recordList}
        editor={editorPanel}
        logoSrc={mindLogo}
      />
      {loading && <div className="loading">Loading...</div>}
    </>
  );
}
