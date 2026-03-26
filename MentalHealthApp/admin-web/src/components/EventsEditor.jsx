import React from 'react';

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
  saving,
  selectedEventId,
  onSave,
  onDelete,
  onNew,
}) {
  return (
    <>
      <h3>Event</h3>
      <label>Title</label>
      <input value={eventForm.title} onChange={(e) => setEventForm((s) => ({ ...s, title: e.target.value }))} />
      <label>Description</label>
      <textarea value={eventForm.description} onChange={(e) => setEventForm((s) => ({ ...s, description: e.target.value }))} />
      <label>Detailed description</label>
      <textarea className="tall" value={eventForm.detailed_description} onChange={(e) => setEventForm((s) => ({ ...s, detailed_description: e.target.value }))} />
      <label>Objective</label>
      <textarea value={eventForm.objective} onChange={(e) => setEventForm((s) => ({ ...s, objective: e.target.value }))} />
      <label>Agenda</label>
      <textarea className="tall" value={eventForm.agenda} onChange={(e) => setEventForm((s) => ({ ...s, agenda: e.target.value }))} />
      <label>Category</label>
      <input value={eventForm.category} onChange={(e) => setEventForm((s) => ({ ...s, category: e.target.value }))} />
      <label>Start at</label>
      <input type="datetime-local" value={eventForm.start_at} onChange={(e) => setEventForm((s) => ({ ...s, start_at: e.target.value }))} />
      <label>End at</label>
      <input type="datetime-local" value={eventForm.end_at} onChange={(e) => setEventForm((s) => ({ ...s, end_at: e.target.value }))} />
      <label>Location</label>
      <input value={eventForm.location} onChange={(e) => setEventForm((s) => ({ ...s, location: e.target.value }))} />
      <label>Address</label>
      <input value={eventForm.address} onChange={(e) => setEventForm((s) => ({ ...s, address: e.target.value }))} />
      <label>Fee</label>
      <input value={eventForm.fee} onChange={(e) => setEventForm((s) => ({ ...s, fee: e.target.value }))} placeholder="e.g. Free or RM20" />
      <label>Location link (Google Maps URL)</label>
      <input value={eventForm.location_link} onChange={(e) => setEventForm((s) => ({ ...s, location_link: e.target.value }))} />
      <label>Posters / image URLs (one per line)</label>
      <textarea
        value={eventForm.image_urls_text}
        onChange={(e) => setEventForm((s) => ({ ...s, image_urls_text: e.target.value }))}
        placeholder={"https://.../poster1.jpg\nhttps://.../poster2.jpg"}
      />
      <div className="row">
        <button className="btn primary" onClick={onSave} disabled={saving}>Save</button>
        <button className="btn light" onClick={onNew}>New</button>
        {selectedEventId && <button className="btn danger" onClick={onDelete} disabled={saving}>Delete</button>}
      </div>
    </>
  );
}
