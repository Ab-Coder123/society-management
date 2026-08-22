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

export default function SocietyAdminFacilities() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ facilityName: 'gym', date: '', slot: SLOTS[3], purpose: '' });

  async function fetchBookings() {
    setLoading(true); setError('');
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (facilityFilter !== 'all') params.facilityName = facilityFilter;
      if (dateFilter) params.date = dateFilter;
      const res = await api.get('/facility', { params });
      setBookings(res.data);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load bookings'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchBookings(); }, [statusFilter, facilityFilter, dateFilter]);

  async function handleSubmit(e) {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      await api.post('/facility', form);
      setModalOpen(false);
      setForm({ facilityName: 'gym', date: '', slot: SLOTS[3], purpose: '' });
      fetchBookings();
    } catch (err) { setFormError(err.response?.data?.message || 'Booking failed'); }
    finally { setSubmitting(false); }
  }

  async function handleAction(id, action) {
    try {
      await api.patch(`/facility/${id}/${action}`);
      fetchBookings();
    } catch (err) { alert(err.response?.data?.message || `Action ${action} failed`); }
  }

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h2 style={{ margin: 0, fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>Facility Bookings</h2>
          <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginTop: spacing[1] }}>Manage all society facility reservations</div>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>+ New Booking</Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[5], flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((st) => (
          <Button key={st} variant={statusFilter === st ? 'primary' : 'ghost'} size="sm" onClick={() => setStatusFilter(st)} style={{ textTransform: 'capitalize' }}>
            {st === 'all' ? 'All Status' : st}
          </Button>
        ))}
        <Select value={facilityFilter} onChange={e => setFacilityFilter(e.target.value)} options={[{ value: 'all', label: 'All Facilities' }, ...FACILITIES.map(f => ({ value: f, label: `${FAC_ICONS[f]} ${f.replace('_', ' ')}` }))]} fullWidth={false} style={{ width: '180px', marginBottom: 0 }} />
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} fullWidth={false} style={{ width: '160px', marginBottom: 0 }} />
        {dateFilter && <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>Clear Date</Button>}
      </div>

      {error && <div style={{ color: colors.danger[700], marginBottom: spacing[4], padding: spacing[3], backgroundColor: colors.danger[50], borderRadius: spacing[2] }}>{error}</div>}

      {loading ? (
        <div style={{ color: colors.text.muted, textAlign: 'center', padding: spacing[10] }}>Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: spacing[10], color: colors.text.muted }}>
          <div style={{ fontSize: typography.fontSizes['4xl'], marginBottom: spacing[3] }}>📅</div>
          <div style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.semibold }}>No bookings found</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          {bookings.map((b) => (
            <Card key={b._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[4] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], flex: 1 }}>
                <div style={{ fontSize: typography.fontSizes['3xl'] }}>{FAC_ICONS[b.facilityName] || '📍'}</div>
                <div>
                  <div style={{ fontWeight: typography.fontWeights.bold, fontSize: typography.fontSizes.lg, textTransform: 'capitalize', color: colors.text.primary }}>
                    {b.facilityName?.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginTop: spacing[1] }}>
                    📅 {new Date(b.date).toLocaleDateString()} &nbsp;|&nbsp; ⏰ {b.slot}
                  </div>
                  {b.purpose && <div style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted, marginTop: spacing[1] }}>Purpose: {b.purpose}</div>}
                  {b.bookedBy && <div style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted }}>By: {b.bookedBy?.name || '—'}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <Badge type="booking" status={b.status} />
                {b.status === 'pending' && (
                  <>
                    <Button variant="success" size="sm" onClick={() => handleAction(b._id, 'approve')}>Approve</Button>
                    <Button variant="danger" size="sm" onClick={() => handleAction(b._id, 'reject')}>Reject</Button>
                  </>
                )}
                {['pending', 'approved'].includes(b.status) && (
                  <Button variant="ghost" size="sm" onClick={() => handleAction(b._id, 'cancel')}>Cancel</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title="New Facility Booking" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <Select label="Facility" value={form.facilityName} onChange={e => setForm({...form, facilityName: e.target.value})} options={FACILITIES.map(f => ({ value: f, label: `${FAC_ICONS[f]} ${f.replace('_',' ')}` }))} required />
            <Input label="Date" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} min={new Date().toISOString().split('T')[0]} required />
            <Select label="Time Slot" value={form.slot} onChange={e => setForm({...form, slot: e.target.value})} options={SLOTS} required />
            <Input label="Purpose (optional)" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="Birthday party, workout, meeting..." />
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
