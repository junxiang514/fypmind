import React from 'react';

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length <= 140) return trimmed;
    return `${trimmed.slice(0, 140)}…`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    if (value.length <= 6 && value.every((x) => typeof x === 'string' || typeof x === 'number')) {
      return value.join(', ');
    }
    return `${value.length} item(s)`;
  }
  if (typeof value === 'object') return 'Object';
  return String(value);
}

function toLocaleMaybe(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString();
}

function getPrimaryRecordLabel(item, data) {
  const table = item?.table_name;
  if (table === 'events') return data.title || '';
  if (table === 'educational_contents') return data.title || '';
  if (table === 'profiles') return data.full_name || data.email || '';
  if (table === 'wellbeing_questions') return data.prompt || '';
  if (table === 'clinical_tools') return data.name || data.code || '';
  if (table === 'clinical_tool_questions') return data.question_text || '';
  return '';
}

function findCurrentRecord(item, currentRecords) {
  const table = item?.table_name;
  const list = Array.isArray(currentRecords?.[table]) ? currentRecords[table] : [];
  const data = item?.record_data && typeof item.record_data === 'object' ? item.record_data : {};
  const recordId = data.id || item?.record_id;
  if (!recordId) return null;
  return list.find((x) => x?.id === recordId) || null;
}

function diffRowLabel(table, key) {
  const labels = {
    events: {
      title: 'Title',
      category: 'Category',
      start_at: 'Start',
      end_at: 'End',
      location: 'Location',
      address: 'Address',
      fee: 'Fee',
      location_link: 'Location link',
      description: 'Description',
      detailed_description: 'Detailed description',
      objective: 'Objective',
      agenda: 'Agenda',
      image_urls: 'Images',
    },
    educational_contents: {
      title: 'Title',
      category: 'Category',
      summary: 'Summary',
      video_url: 'Video URL',
      body: 'Body',
      quiz_payload: 'Quiz',
      activity_payload: 'Activity',
    },
    profiles: {
      full_name: 'Full name',
      email: 'Email',
      phone: 'Phone',
      gender: 'Gender',
      role: 'Role',
      is_admin: 'Admin',
      is_active: 'Active',
    },
    wellbeing_questions: {
      category: 'Category',
      prompt: 'Prompt',
      answer_type: 'Answer type',
      options: 'Options',
      is_active: 'Active',
    },
    clinical_tools: {
      code: 'Code',
      name: 'Name',
      description: 'Description',
      is_active: 'Active',
    },
    clinical_tool_questions: {
      question_order: 'Order',
      question_text: 'Question',
      options: 'Options',
    },
  };

  return labels?.[table]?.[key] || key;
}

function buildChangeSummary(item, currentRecord) {
  const operation = String(item?.operation_type || '').toLowerCase();
  const data = item?.record_data && typeof item.record_data === 'object' ? item.record_data : {};
  const rows = [];

  const recordId = data.id || item?.record_id;
  if (recordId) rows.push({ label: 'Record ID', value: recordId });

  const primary = getPrimaryRecordLabel(item, data);
  if (primary) rows.push({ label: 'Record', value: primary });

  const table = item?.table_name;

  if (operation === 'update' && currentRecord) {
    const fieldsByTable = {
      events: [
        'title',
        'description',
        'detailed_description',
        'objective',
        'agenda',
        'category',
        'start_at',
        'end_at',
        'location',
        'address',
        'fee',
        'location_link',
        'image_urls',
      ],
      educational_contents: ['title', 'summary', 'category', 'video_url', 'quiz_payload', 'activity_payload', 'body'],
      profiles: ['full_name', 'email', 'phone', 'gender', 'role', 'is_admin', 'is_active'],
      wellbeing_questions: ['category', 'prompt', 'answer_type', 'options', 'is_active'],
      clinical_tools: ['code', 'name', 'description', 'is_active'],
      clinical_tool_questions: ['question_order', 'question_text', 'options'],
    };

    const fields = fieldsByTable[table] || Array.from(new Set([...Object.keys(currentRecord || {}), ...Object.keys(data || {})]));

    for (const key of fields) {
      if (data?.[key] === undefined) continue;

      const before = currentRecord?.[key];
      const after = data?.[key];

      const beforeSig = typeof before === 'object' ? JSON.stringify(before) : String(before ?? '');
      const afterSig = typeof after === 'object' ? JSON.stringify(after) : String(after ?? '');
      if (beforeSig === afterSig) continue;

      rows.push({ label: diffRowLabel(table, key), value: `${formatValue(before)} → ${formatValue(after)}` });
    }

    if (rows.length === 0) {
      rows.push({ label: 'Changes', value: 'No field changes detected.' });
    }

    return rows
      .filter((r) => formatValue(r.value))
      .map((r) => ({ ...r, formatted: formatValue(r.value) }));
  }

  if (table === 'events') {
    rows.push(
      { label: 'Title', value: data.title },
      { label: 'Category', value: data.category },
      { label: 'Start', value: toLocaleMaybe(data.start_at) },
      { label: 'End', value: toLocaleMaybe(data.end_at) },
      { label: 'Location', value: data.location },
      { label: 'Fee', value: data.fee },
      { label: 'Images', value: Array.isArray(data.image_urls) ? `${data.image_urls.length} image(s)` : '' },
    );
  } else if (table === 'educational_contents') {
    rows.push(
      { label: 'Title', value: data.title },
      { label: 'Category', value: data.category },
      { label: 'Summary', value: data.summary },
      { label: 'Video URL', value: data.video_url },
      { label: 'Quiz', value: Array.isArray(data.quiz_payload) ? `${data.quiz_payload.length} question(s)` : '' },
      { label: 'Activity', value: Array.isArray(data.activity_payload) ? `${data.activity_payload.length} item(s)` : '' },
      { label: 'Body', value: data.body },
    );
  } else if (table === 'profiles') {
    rows.push(
      { label: 'Full name', value: data.full_name },
      { label: 'Email', value: data.email },
      { label: 'Phone', value: data.phone },
      { label: 'Gender', value: data.gender },
      { label: 'Role', value: data.role },
      { label: 'Admin', value: data.is_admin },
      { label: 'Active', value: data.is_active },
    );
  } else if (table === 'wellbeing_questions') {
    rows.push(
      { label: 'Category', value: data.category },
      { label: 'Prompt', value: data.prompt },
      { label: 'Answer type', value: data.answer_type },
      { label: 'Options', value: Array.isArray(data.options) ? `${data.options.length} option(s)` : '' },
      { label: 'Active', value: data.is_active },
    );
  } else if (table === 'clinical_tools') {
    rows.push(
      { label: 'Code', value: data.code },
      { label: 'Name', value: data.name },
      { label: 'Description', value: data.description },
      { label: 'Active', value: data.is_active },
    );
  } else {
    const keys = Object.keys(data || {}).filter((k) => !['updated_at', 'created_at'].includes(k)).slice(0, 12);
    for (const key of keys) rows.push({ label: key, value: data[key] });
  }

  const seen = new Set();
  return rows
    .filter((r) => {
      const formatted = formatValue(r.value);
      if (!formatted) return false;
      const sig = `${r.label}:${formatted}`;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    })
    .map((r) => ({ ...r, formatted: formatValue(r.value) }));
}

function tableDisplayName(table) {
  if (table === 'events') return 'Event';
  if (table === 'educational_contents') return 'Educational Content';
  if (table === 'profiles') return 'User';
  if (table === 'wellbeing_questions') return 'Check-in Question';
  if (table === 'clinical_tools') return 'Self-Assessment Tool';
  if (table === 'clinical_tool_questions') return 'Tool Question';
  return table ? String(table) : 'Record';
}

function operationDisplayName(op) {
  const operation = String(op || '').toLowerCase();
  if (operation === 'add') return 'Add';
  if (operation === 'delete') return 'Delete';
  if (operation === 'update') return 'Edit';
  return operation ? operation.toUpperCase() : 'Change';
}

function buildItemTitle(item, currentRecord) {
  const table = item?.table_name;
  const op = operationDisplayName(item?.operation_type);
  const data = item?.record_data && typeof item.record_data === 'object' ? item.record_data : {};

  const currentLabel = currentRecord ? getPrimaryRecordLabel(item, currentRecord) : '';
  const dataLabel = getPrimaryRecordLabel(item, data);
  const label = currentLabel || dataLabel;
  const recordId = data.id || item?.record_id;

  if (label) return `${op} ${tableDisplayName(table)}: ${label}`;
  if (recordId) return `${op} ${tableDisplayName(table)}: ${recordId}`;
  return `${op} ${tableDisplayName(table)}`;
}

function buildKeyChangeSubtitle(item, summaryRows) {
  const operation = String(item?.operation_type || '').toLowerCase();
  const table = item?.table_name;
  const data = item?.record_data && typeof item.record_data === 'object' ? item.record_data : {};

  if (operation === 'delete') {
    const label = getPrimaryRecordLabel(item, data);
    return label ? `Deleted: ${label}` : 'Deleted';
  }

  const ignore = new Set(['Record ID', 'Record', 'Changes']);
  const keys = (summaryRows || [])
    .map((r) => String(r?.label || '').trim())
    .filter((l) => l && !ignore.has(l));

  const uniq = [];
  const seen = new Set();
  for (const k of keys) {
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(k);
  }

  if (uniq.length > 0) {
    const top = uniq.slice(0, 4);
    const more = uniq.length > top.length ? ` +${uniq.length - top.length} more` : '';
    const prefix = operation === 'add' ? 'Added' : operation === 'update' ? 'Edited' : 'Changed';
    return `${prefix}: ${top.join(', ')}${more}`;
  }

  // Fallback when we can't compute diffs (e.g. missing current record).
  const candidateKeys = Object.keys(data || {})
    .filter((k) => !['id', 'created_at', 'updated_at'].includes(k))
    .slice(0, 4);
  if (candidateKeys.length > 0) {
    const prefix = operation === 'add' ? 'Added' : operation === 'update' ? 'Edited' : 'Changed';
    return `${prefix}: ${candidateKeys.map((k) => diffRowLabel(table, k)).join(', ')}`;
  }

  if (operation === 'add') return 'Added';
  if (operation === 'update') return 'Edited';
  return 'Changed';
}

function resolveUserDisplayName(userId, profiles, fallback) {
  if (!userId) return fallback || '';
  const list = Array.isArray(profiles) ? profiles : [];
  const found = list.find((p) => p?.id === userId);
  if (found?.full_name) return found.full_name;
  if (found?.email) return found.email;
  return fallback || String(userId);
}

export default function ApprovalReviewPage({
  approvalItems = [],
  approveApprovalItem,
  rejectApprovalItem,
  saving = false,
  canApprove = false,
  currentRecords = {},
}) {
  const [reviewTab, setReviewTab] = React.useState('pending');
  const [rejectReason, setRejectReason] = React.useState('');
  const [rejectingId, setRejectingId] = React.useState(null);

  const profileList = Array.isArray(currentRecords?.profiles) ? currentRecords.profiles : [];

  return (
    <section className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${reviewTab === 'pending' ? 'primary' : 'light'}`}
          onClick={() => setReviewTab('pending')}
          type="button"
        >
          Pending review
        </button>
        <button
          className={`btn ${reviewTab === 'approved' ? 'primary' : 'light'}`}
          onClick={() => setReviewTab('approved')}
          type="button"
        >
          Activity Log
        </button>
      </div>

      {reviewTab === 'pending' ? (
        <div>
          {!canApprove && (
            <div className="banner warning" style={{ marginBottom: '16px' }}>
              Only Head roles can approve or reject requests.
            </div>
          )}

          {approvalItems.filter((item) => item.status === 'pending').length === 0 ? (
            <div className="muted">No pending items right now.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {approvalItems
                .filter((item) => item.status === 'pending')
                .map((item) => {
                  const currentRecord = findCurrentRecord(item, currentRecords);
                  const summaryRows = buildChangeSummary(item, currentRecord);
                  const title = buildItemTitle(item, currentRecord);
                  const subtitle = buildKeyChangeSubtitle(item, summaryRows);
                  const requestedBy = resolveUserDisplayName(item?.user_id, profileList, item?.created_by_name || 'Unknown');
                  return (
                    <div
                      key={item.id}
                      className="list-item"
                      style={{
                        padding: '12px',
                        border: '1px solid #ffd700',
                        borderRadius: '4px',
                        backgroundColor: '#fffacd',
                      }}
                    >
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700 }}>{title}</div>
                      <small style={{ display: 'block', color: '#666' }}>{subtitle}</small>
                      <div style={{ marginTop: '4px' }}>
                        <small style={{ display: 'block', color: '#666' }}>Requested by {requestedBy}</small>
                        <small style={{ display: 'block', color: '#666' }}>Requested on {new Date(item.created_at).toLocaleString()}</small>
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px', backgroundColor: '#fff', padding: '8px', borderRadius: '3px' }}>
                      {summaryRows.length === 0 ? (
                        <div className="muted">No details available.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {summaryRows.map((row) => (
                            <div key={`${item.id}-${row.label}`} style={{ fontSize: '12px' }}>
                              <strong>{row.label}:</strong> {row.formatted}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {rejectingId === item.id && (
                      <div
                        style={{
                          marginBottom: '8px',
                          padding: '8px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '3px',
                        }}
                      >
                        <textarea
                          placeholder="Rejection reason..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          style={{ width: '100%', minHeight: '60px', fontFamily: 'inherit', padding: '4px' }}
                          disabled={!canApprove || saving}
                        />
                      </div>
                    )}

                    {canApprove && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn primary tiny-btn"
                          onClick={() => approveApprovalItem && approveApprovalItem(item.id)}
                          disabled={saving}
                          type="button"
                        >
                          Approve
                        </button>

                        {rejectingId === item.id ? (
                          <>
                            <button
                              className="btn danger tiny-btn"
                              onClick={() => {
                                rejectApprovalItem && rejectApprovalItem(item.id, rejectReason);
                                setRejectingId(null);
                                setRejectReason('');
                              }}
                              disabled={saving}
                              type="button"
                            >
                              Confirm Reject
                            </button>
                            <button
                              className="btn light tiny-btn"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason('');
                              }}
                              type="button"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn danger tiny-btn"
                            onClick={() => setRejectingId(item.id)}
                            type="button"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {approvalItems.filter((item) => item.status === 'approved' || item.status === 'rejected').length === 0 ? (
            <div className="muted">No activity records yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {approvalItems
                .filter((item) => item.status === 'approved' || item.status === 'rejected')
                .sort((a, b) => {
                  const aTime = a?.approved_at || a?.created_at;
                  const bTime = b?.approved_at || b?.created_at;
                  return new Date(bTime || 0).getTime() - new Date(aTime || 0).getTime();
                })
                .map((item) => {
                  const currentRecord = findCurrentRecord(item, currentRecords);
                  const summaryRows = buildChangeSummary(item, currentRecord);
                  const title = buildItemTitle(item, currentRecord);
                  const subtitle = buildKeyChangeSubtitle(item, summaryRows);
                  const requestedBy = resolveUserDisplayName(item?.user_id, profileList, item?.created_by_name || 'Unknown');
                  const decidedBy = resolveUserDisplayName(item?.approved_by, profileList, item?.approved_by ? String(item.approved_by) : '');
                  const isRejected = item.status === 'rejected';
                  return (
                    <div
                      key={item.id}
                      className="list-item"
                      style={{
                        padding: '12px',
                        border: `1px solid ${isRejected ? '#f5a3a3' : '#90ee90'}`,
                        borderRadius: '4px',
                        backgroundColor: isRejected ? '#fff0f0' : '#f0fff0',
                      }}
                    >
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700 }}>{title}</div>
                      <small style={{ display: 'block', color: '#666' }}>{subtitle}</small>
                      <div style={{ marginTop: '4px' }}>
                        <small style={{ display: 'block', color: '#666' }}>Requested by {requestedBy}</small>
                        <small style={{ display: 'block', color: '#666' }}>Requested on {new Date(item.created_at).toLocaleString()}</small>
                        {isRejected ? (
                          <small style={{ display: 'block', color: '#a00' }}>
                            ✗ Rejected on {item.approved_at ? new Date(item.approved_at).toLocaleString() : 'N/A'}
                          </small>
                        ) : (
                          <small style={{ display: 'block', color: '#090' }}>
                            ✓ Approved on {item.approved_at ? new Date(item.approved_at).toLocaleString() : 'N/A'}
                          </small>
                        )}
                        {decidedBy ? (
                          <small style={{ display: 'block', color: isRejected ? '#a00' : '#090' }}>
                            {isRejected ? 'Rejected by' : 'Approved by'} {decidedBy}
                          </small>
                        ) : null}
                        {isRejected && item.rejection_reason ? (
                          <small style={{ display: 'block', color: '#a00' }}>Reason: {item.rejection_reason}</small>
                        ) : null}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '3px' }}>
                      {summaryRows.length === 0 ? (
                        <div className="muted">No details available.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {summaryRows.map((row) => (
                            <div key={`${item.id}-${row.label}`} style={{ fontSize: '12px' }}>
                              <strong>{row.label}:</strong> {row.formatted}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
