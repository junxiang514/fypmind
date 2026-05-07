import React from 'react';

export default function EventsGrid({ events, onEditEvent, saving }) {
  return (
    <>
      <div className="events-grid">
        {events.map((event) => {
          const imageUrl = Array.isArray(event.image_urls) && event.image_urls.length
            ? event.image_urls.find((url) => String(url || '').trim())
            : String(event.image_urls_text || '')
                .split('\n')
                .map((url) => url.trim())
                .find(Boolean);
          const feeValue = String(event.fee ?? '').trim();
          const feeBadge = feeValue === '' || feeValue === '0'
            ? '🆓 Free'
            : `💰 RM${feeValue}`;

          return (
            <article key={event.id} className="event-card">
              <div className="event-card-image">
                <img 
                  src={imageUrl || '/assets/event_default.jpg'} 
                  alt={event.title}
                  onError={(e) => {
                    e.target.src = '/assets/event_default.jpg';
                  }}
                />
              </div>
              <div className="event-card-content">
                <h3>{event.title}</h3>
                <p className="event-card-category">{event.category || 'Event'}</p>
                <p className="event-card-meta">
                  📍 {event.location || 'No location'}
                </p>
                {event.start_at && (
                  <p className="event-card-meta">
                    📅 {new Date(event.start_at).toLocaleDateString()}
                  </p>
                )}
                <p className="event-card-meta">{feeBadge}</p>
                <p className="event-card-description">{event.description}</p>
              </div>
              <div className="event-card-footer">
                <button
                  className="btn primary"
                  onClick={() => onEditEvent(event.id)}
                  disabled={saving}
                >
                  Edit
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {events.length === 0 && (
        <div className="muted" style={{ textAlign: 'center', padding: '40px 20px' }}>
          No events found. Create one to get started.
        </div>
      )}
    </>
  );
}
