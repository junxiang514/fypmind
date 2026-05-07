import React, { useEffect, useState } from 'react';

export const EMPTY_EVENT = {
  title: '',
  description: '',
  detailed_description: '',
  objective: '',
  agenda: '',
  category: '',
  start_at: '',
  end_at: '',
  location: '',
  address: '',
  fee: '',
  location_link: '',
  image_urls_text: '',
};

export default function EventsEditor({
  eventForm,
  setEventForm,
  eventFormErrors,
  setEventFormErrors,
  saving,
  selectedEventId,
  onSave,
  onDelete,
  isEditingEvent,
  onCloseEditor,
}) {
  if (!isEditingEvent) {
    return null;
  }

  const updateField = (field, value) => {
    setEventForm((s) => ({ ...s, [field]: value }));
    if (eventFormErrors?.[field] && setEventFormErrors) {
      setEventFormErrors((prev) => {
        const next = { ...(prev || {}) };
        delete next[field];
        return next;
      });
    }
  };

  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    // build previews from eventForm.image_urls_text (either URLs or data URLs)
    const list = String(eventForm.image_urls_text || '')
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    setPreviews(list);
  }, [eventForm.image_urls_text]);

  const filesToDataUrls = (files) => {
    const readers = Array.from(files).map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    }));
    return Promise.all(readers).then((results) => results.filter(Boolean));
  };

  const handleFiles = async (files) => {
    if (!files || !files.length) return;
    const dataUrls = await filesToDataUrls(files);
    if (!dataUrls.length) return;
    // append to existing image_urls_text
    const existing = String(eventForm.image_urls_text || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const next = [...existing, ...dataUrls];
    setEventForm((s) => ({ ...s, image_urls_text: next.join('\n') }));
  };

  const removeImageAt = (index) => {
    const existing = String(eventForm.image_urls_text || '')
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    const next = existing.filter((_, idx) => idx !== index);
    setEventForm((s) => ({ ...s, image_urls_text: next.join('\n') }));
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const renderError = (field) => {
    if (!eventFormErrors?.[field]) return null;
    return (
      <div style={{ color: '#b91c1c', fontSize: '12px', marginTop: '6px' }}>
        {eventFormErrors[field]}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onCloseEditor}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{selectedEventId ? 'Edit Event' : 'Create Event'}</h2>
          <button className="modal-close" onClick={onCloseEditor}>✕</button>
        </div>
        <div className="modal-body">
      <label>Title</label>
      <input value={eventForm.title} onChange={(e) => updateField('title', e.target.value)} />
      {renderError('title')}
      <label>Description</label>
      <textarea value={eventForm.description} onChange={(e) => updateField('description', e.target.value)} />
      <label>Detailed description</label>
      <textarea className="tall" value={eventForm.detailed_description} onChange={(e) => updateField('detailed_description', e.target.value)} />
      <label>Objective</label>
      <textarea value={eventForm.objective} onChange={(e) => updateField('objective', e.target.value)} />
      <label>Agenda</label>
      <textarea className="tall" value={eventForm.agenda} onChange={(e) => updateField('agenda', e.target.value)} />
      <label>Category</label>
      <input value={eventForm.category} onChange={(e) => updateField('category', e.target.value)} />
      <label>Start at</label>
      <input type="datetime-local" value={eventForm.start_at} onChange={(e) => updateField('start_at', e.target.value)} />
      {renderError('start_at')}
      <label>End at</label>
      <input type="datetime-local" value={eventForm.end_at} onChange={(e) => updateField('end_at', e.target.value)} />
      {renderError('end_at')}
      <label>Location</label>
      <input value={eventForm.location} onChange={(e) => updateField('location', e.target.value)} />
      {renderError('location')}
      <label>Address</label>
      <input value={eventForm.address} onChange={(e) => updateField('address', e.target.value)} />
      <label>Fee</label>
      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={eventForm.fee}
        onChange={(e) => updateField('fee', String(e.target.value || '').replace(/[^0-9]/g, ''))}
        placeholder="0 = Free"
      />
      <label>Location link (Google Maps URL)</label>
      <input value={eventForm.location_link} onChange={(e) => updateField('location_link', e.target.value)} />
      {renderError('location_link')}
      <label>Posters / images</label>
      <div
        className="file-dropzone"
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{ border: '2px dashed #e5e7eb', padding: 12, borderRadius: 8, marginBottom: 8 }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'inline-block' }}
          />
          <div style={{ color: '#6b7280' }}>or drag & drop images here (max 6 shown)</div>
        </div>
        {previews.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {previews.map((src, idx) => (
              <div
                key={`${src}-${idx}`}
                style={{
                  width: 96,
                  height: 72,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 6,
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img src={src} alt={`preview-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeImageAt(idx)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    border: 'none',
                    borderRadius: '999px',
                    background: 'rgba(17, 24, 39, 0.75)',
                    color: '#fff',
                    cursor: 'pointer',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={`Remove image ${idx + 1}`}
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
        <div className="modal-footer">
          <button className="btn light" onClick={onCloseEditor}>Cancel</button>
          <button className="btn primary" onClick={onSave} disabled={saving}>Save</button>
          {selectedEventId && <button className="btn danger" onClick={onDelete} disabled={saving}>Delete</button>}
        </div>
      </div>
    </div>
  );
}
