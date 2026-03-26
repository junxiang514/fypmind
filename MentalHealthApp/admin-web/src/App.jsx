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

function toInputDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isAdmin(profile) {
  return Boolean(profile?.is_admin || String(profile?.role || '').toLowerCase() === 'admin');
}

function nameFromEmail(email = '') {
  const base = String(email).split('@')[0] || '';
  if (!base) return '';
  return base
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function buildFallbackProfile(user, profile) {
  return {
    id: user?.id,
    full_name:
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      nameFromEmail(user?.email),
    email: profile?.email || user?.email || '',
    phone: '',
    gender: '',
    medical_history: '',
    role: profile?.role || 'admin',
    is_admin: true,
    is_active: true,
  };
}

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

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

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
      const [eventsRes, contentsRes, usersRes] = await Promise.allSettled([
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
      ]);

      const nextEvents = eventsRes.status === 'fulfilled' ? (eventsRes.value.data || []) : [];
      const nextContents = contentsRes.status === 'fulfilled' ? (contentsRes.value.data || []) : [];
      const nextUsers = usersRes.status === 'fulfilled' ? (usersRes.value.data || []) : [];

      const eventsError = eventsRes.status === 'fulfilled' ? eventsRes.value.error : eventsRes.reason;
      const contentsError = contentsRes.status === 'fulfilled' ? contentsRes.value.error : contentsRes.reason;
      const usersError = usersRes.status === 'fulfilled' ? usersRes.value.error : usersRes.reason;

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

      const normalizedUsers = [...nextUsers];
      if (currentUser?.id && !normalizedUsers.some((u) => String(u.id) === String(currentUser.id))) {
        normalizedUsers.unshift(buildFallbackProfile(currentUser, currentProfile));
      }

      setEvents(nextEvents);
      setContents(nextContents);
      setUsers(normalizedUsers);

      if (!selectedEventId && nextEvents.length) setSelectedEventId(nextEvents[0].id);
      if (!selectedContentId && nextContents.length) setSelectedContentId(nextContents[0].id);
      if (!selectedUserId && normalizedUsers.length) setSelectedUserId(normalizedUsers[0].id);
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
    setSelectedEventId(null);
    setSelectedContentId(null);
    setSelectedUserId(null);
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

  const selectedEvent = events.find((x) => x.id === selectedEventId) || null;
  const selectedContent = contents.find((x) => x.id === selectedContentId) || null;
  const selectedUser = users.find((x) => x.id === selectedUserId) || null;

  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [contentForm, setContentForm] = useState(EMPTY_CONTENT);
  const [userForm, setUserForm] = useState(null);

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

  if (!sessionUser) {
    return (
      <div className="login-wrap">
        <div className="login-header">
          <img src={mindLogo} alt="MIND" className="logo" />
          <h1>MIND</h1>
          <p>Mental Health Intelligence for Nurturing and Development</p>
        </div>

        <form className="card login-card" onSubmit={onLogin}>
          <h2>Welcome Back</h2>
          <p className="muted">Admin portal access</p>
          <label>Email</label>
          <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
          <button className="btn primary" type="submit" disabled={loading}>Login</button>
          {!!error && <div className="banner error">{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar card">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="muted">Signed in as {signedInName}</p>
        </div>
        <div className="row">
          <button className="btn light" onClick={loadAll}>Refresh</button>
          <button className="btn danger" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <section className="card controls">
        <div className="tabs">
          <button className={`tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>Events</button>
          <button className={`tab ${tab === 'contents' ? 'active' : ''}`} onClick={() => setTab('contents')}>Educational Content</button>
          <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users</button>
        </div>
        <input placeholder="Search current tab..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </section>

      {!!status && <div className="banner ok">{status}</div>}
      {!!error && <div className="banner error">{error}</div>}

      <main className="layout">
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

          {tab === 'events' && filteredEvents.length === 0 && (
            <div className="muted">No events found.</div>
          )}
          {tab === 'contents' && filteredContents.length === 0 && (
            <div className="muted">No educational contents found.</div>
          )}
          {tab === 'users' && filteredUsers.length === 0 && (
            <div className="muted">No users found. Check profiles RLS or create your profile row first.</div>
          )}
        </div>

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
        </div>
      </main>

      {loading && <div className="loading">Loading...</div>}
    </div>
  );
}
