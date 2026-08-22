import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { colors, typography, spacing } from '../../styles/tokens';

export default function SocietyAdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '18:00', location: '', organizer: '', maxAttendees: ''
  });

  async function fetchEvents() {
    setLoading(true); setError('');
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load events'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchEvents(); }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      const payload = { ...form, maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null };
      await api.post('/events', payload);
      setModalOpen(false);
      setForm({ title: '', description: '', date: '', time: '18:00', location: '', organizer: '', maxAttendees: '' });
      fetchEvents();
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to create event'); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Deactivate this community event?')) return;
    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete event'); }
  }

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h2 style={{ margin: 0, fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>
            Community Events
          </h2>
          <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginTop: spacing[1] }}>
            Organize & manage society events
          </div>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>+ Create Event</Button>
      </div>

      {error && <div style={{ color: colors.danger[700], marginBottom: spacing[4], padding: spacing[3], backgroundColor: colors.danger[50], borderRadius: spacing[2] }}>{error}</div>}

      {loading ? (
        <div style={{ color: colors.text.muted, textAlign: 'center', padding: spacing[10] }}>Loading events...</div>
      ) : events.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: spacing[10], color: colors.text.muted }}>
          <div style={{ fontSize: typography.fontSizes['4xl'], marginBottom: spacing[3] }}>🎉</div>
          <div style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.semibold }}>No community events scheduled</div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: spacing[4] }}>
          {events.map((ev) => (
            <Card key={ev._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] }}>
                  <h3 style={{ margin: 0, fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>{ev.title}</h3>
                  <Badge variant="info" label={`${ev.rsvpList?.length || 0} RSVPs ${ev.maxAttendees ? `/ ${ev.maxAttendees}` : ''}`} />
                </div>
                <p style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, margin: `0 0 ${spacing[3]} 0`, lineHeight: typography.lineHeights.normal }}>{ev.description}</p>
                <div style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted, display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
                  <div>📅 {new Date(ev.date).toLocaleDateString()} {ev.time ? `at ${ev.time}` : ''}</div>
                  <div>📍 Location: {ev.location}</div>
                  <div>👤 Organizer: {ev.organizer}</div>
                </div>
              </div>
              <div style={{ marginTop: spacing[4], paddingTop: spacing[3], borderTop: `1px solid ${colors.border.light}`, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="danger" size="sm" onClick={() => handleDelete(ev._id)}>Cancel Event</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title="Create Community Event" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <Input label="Event Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Annual General Body Meeting / Diwali Fest" />
            
            <div style={{ marginBottom: spacing[3] }}>
              <label style={{ display: 'block', fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, color: colors.text.secondary, marginBottom: spacing[1] }}>
                Description *
              </label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="Event details, agenda..." style={{ width: '100%', padding: `${spacing[2]} ${spacing[3]}`, borderRadius: spacing[2], border: `1px solid ${colors.border.default}`, fontSize: typography.fontSizes.md, fontFamily: typography.fontFamily, boxSizing: 'border-box', minHeight: '80px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
              <Input label="Date" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              <Input label="Time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} placeholder="6:00 PM" />
            </div>

            <Input label="Location / Venue" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required placeholder="Clubhouse / Central Lawn" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
              <Input label="Organizer" value={form.organizer} onChange={e => setForm({...form, organizer: e.target.value})} required placeholder="Management Committee" />
              <Input label="Max Capacity (Optional)" type="number" value={form.maxAttendees} onChange={e => setForm({...form, maxAttendees: e.target.value})} placeholder="100" />
            </div>

            {formError && <div style={{ color: colors.danger[700], fontSize: typography.fontSizes.sm, marginBottom: spacing[3] }}>{formError}</div>}
            
            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end', marginTop: spacing[4] }}>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Create Event</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
