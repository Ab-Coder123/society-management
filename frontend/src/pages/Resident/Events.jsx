import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { colors, typography, spacing } from '../../styles/tokens';

export default function ResidentEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchEvents() {
    setLoading(true); setError('');
    try {
      const res = await api.get('/events', { params: { upcoming: 'true' } });
      setEvents(res.data);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load community events'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchEvents(); }, []);

  async function handleRsvp(id) {
    try {
      await api.post(`/events/${id}/rsvp`);
      fetchEvents();
    } catch (err) { alert(err.response?.data?.message || 'RSVP failed'); }
  }

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ marginBottom: spacing[6] }}>
        <h2 style={{ margin: 0, fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>Community Events</h2>
        <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginTop: spacing[1] }}>Upcoming celebrations, meetings, and activities</div>
      </div>

      {error && <div style={{ color: colors.danger[700], marginBottom: spacing[4], padding: spacing[3], backgroundColor: colors.danger[50], borderRadius: spacing[2] }}>{error}</div>}

      {loading ? (
        <div style={{ color: colors.text.muted, textAlign: 'center', padding: spacing[10] }}>Loading upcoming events...</div>
      ) : events.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: spacing[10], color: colors.text.muted }}>
          <div style={{ fontSize: typography.fontSizes['4xl'], marginBottom: spacing[3] }}>🎉</div>
          <div style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.semibold }}>No upcoming events scheduled</div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: spacing[4] }}>
          {events.map((ev) => {
            const hasRsvped = ev.rsvpList?.some(r => r.userId === user?._id || r.userId?._id === user?._id);
            const isFull = ev.maxAttendees && (ev.rsvpList?.length >= ev.maxAttendees);
            return (
              <Card key={ev._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] }}>
                    <h3 style={{ margin: 0, fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>{ev.title}</h3>
                    <Badge variant="info" label={`${ev.rsvpList?.length || 0} Attending ${ev.maxAttendees ? `/ ${ev.maxAttendees}` : ''}`} />
                  </div>
                  <p style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, margin: `0 0 ${spacing[3]} 0`, lineHeight: typography.lineHeights.normal }}>{ev.description}</p>
                  <div style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted, display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
                    <div>📅 {new Date(ev.date).toLocaleDateString()} {ev.time ? `at ${ev.time}` : ''}</div>
                    <div>📍 Location: {ev.location}</div>
                    <div>👤 Organizer: {ev.organizer}</div>
                  </div>
                </div>
                <div style={{ marginTop: spacing[4], paddingTop: spacing[3], borderTop: `1px solid ${colors.border.light}`, display: 'flex', justifyContent: 'flex-end' }}>
                  {hasRsvped ? (
                    <span style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold, color: colors.success[600], display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                      ✓ Attending
                    </span>
                  ) : (
                    <Button variant={isFull ? 'ghost' : 'primary'} size="sm" onClick={() => handleRsvp(ev._id)} disabled={isFull}>
                      {isFull ? 'Event Full' : 'RSVP Now'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
