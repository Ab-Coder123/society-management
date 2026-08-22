import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { colors, typography, spacing } from '../../styles/tokens';

const FACILITIES = ['gym', 'clubhouse', 'pool', 'garden', 'parking_visitor', 'other'];
const SLOTS = [
  '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00',
  '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00',
  '18:00-19:00', '19:00-20:00', '20:00-21:00',
];

const FAC_ICONS = {
  gym: '🏋️', clubhouse: '🏛️', pool: '🏊', garden: '🌳',
  parking_visitor: '🚗', other: '📍',
};

export default function ResidentFacilities() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ facilityName: 'gym', date: '', slot: SLOTS[3], purpose: '' });

  async function fetchBookings() {
    setLoading(true); setError('');
    try {
      const res = await api.get('/facility');
      setBookings(res.data);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load your bookings'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchBookings(); }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      await api.post('/facility', form);
      setModalOpen(false);
      setForm({ facilityName: 'gym', date: '', slot: SLOTS[3], purpose: '' });
      fetchBookings();
    } catch (err) { setFormError(err.response?.data?.message || 'Booking slot unavailable or error'); }
    finally { setSubmitting(false); }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this facility booking?')) return;
    try {
      await api.patch(`/facility/${id}/cancel`);
      fetchBookings();
    } catch (err) { alert(err.response?.data?.message || 'Cancellation failed'); }
  }

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h2 style={{ margin: 0, fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>Book Facilities</h2>
          <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginTop: spacing[1] }}>Reserve gym, clubhouse, pool, or visitor parking slots</div>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>+ Book Slot</Button>
      </div>

      {error && <div style={{ color: colors.danger[700], marginBottom: spacing[4], padding: spacing[3], backgroundColor: colors.danger[50], borderRadius: spacing[2] }}>{error}</div>}

      {loading ? (
        <div style={{ color: colors.text.muted, textAlign: 'center', padding: spacing[10] }}>Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: spacing[10], color: colors.text.muted }}>
          <div style={{ fontSize: typography.fontSizes['4xl'], marginBottom: spacing[3] }}>🏋️</div>
          <div style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.semibold }}>No facility bookings yet</div>
          <p style={{ fontSize: typography.fontSizes.sm, marginTop: spacing[1] }}>Click "+ Book Slot" to reserve a society facility</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          {bookings.map((b) => (
            <Card key={b._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                <div style={{ fontSize: typography.fontSizes['3xl'] }}>{FAC_ICONS[b.facilityName] || '📍'}</div>
                <div>
                  <div style={{ fontWeight: typography.fontWeights.bold, fontSize: typography.fontSizes.md, textTransform: 'capitalize', color: colors.text.primary }}>
                    {b.facilityName?.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginTop: spacing[1] }}>
                    📅 {new Date(b.date).toLocaleDateString()} &nbsp;|&nbsp; ⏰ {b.slot}
                  </div>
                  {b.purpose && <div style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted, marginTop: spacing[1] }}>Purpose: {b.purpose}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <Badge type="booking" status={b.status} />
                {['pending', 'approved'].includes(b.status) && (
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(b._id)}>Cancel</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title="Book Facility Slot" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <Select label="Facility" value={form.facilityName} onChange={e => setForm({...form, facilityName: e.target.value})} options={FACILITIES.map(f => ({ value: f, label: `${FAC_ICONS[f]} ${f.replace('_',' ')}` }))} required />
            <Input label="Date" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} min={new Date().toISOString().split('T')[0]} required />
            <Select label="Time Slot" value={form.slot} onChange={e => setForm({...form, slot: e.target.value})} options={SLOTS} required />
            <Input label="Purpose (optional)" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="Morning workout, gathering..." />
            {formError && <div style={{ color: colors.danger[700], fontSize: typography.fontSizes.sm, marginBottom: spacing[3] }}>{formError}</div>}
            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end', marginTop: spacing[4] }}>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Book Now</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
