import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { colors, typography, spacing } from '../../styles/tokens';

const ROLES = ['security', 'maintenance', 'housekeeping', 'gardener', 'electrician', 'plumber', 'other'];
const SHIFTS = ['morning', 'afternoon', 'night', 'rotating'];

const ROLE_ICONS = {
  security: '👮', maintenance: '🛠️', housekeeping: '🧹', gardener: '🌱',
  electrician: '⚡', plumber: '🚰', other: '👤',
};

export default function SocietyAdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', role: 'security', phone: '', email: '', shift: 'morning', notes: '' });

  async function fetchStaff() {
    setLoading(true); setError('');
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await api.get('/staff', { params });
      setStaffList(res.data);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load staff'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchStaff(); }, [roleFilter]);

  async function handleSubmit(e) {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      await api.post('/staff', form);
      setModalOpen(false);
      setForm({ name: '', role: 'security', phone: '', email: '', shift: 'morning', notes: '' });
      fetchStaff();
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to register staff'); }
    finally { setSubmitting(false); }
  }

  async function handleDeactivate(id) {
    if (!window.confirm('Deactivate staff member?')) return;
    try {
      await api.patch(`/staff/${id}/deactivate`);
      fetchStaff();
    } catch (err) { alert(err.response?.data?.message || 'Deactivation failed'); }
  }

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h2 style={{ margin: 0, fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>Society Staff & Services</h2>
          <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginTop: spacing[1] }}>Manage security personnel, technicians, and maintenance crew</div>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>+ Add Staff Member</Button>
      </div>

      {/* Role Filter Tabs */}
      <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[5], flexWrap: 'wrap' }}>
        <Button variant={roleFilter === 'all' ? 'primary' : 'ghost'} size="sm" onClick={() => setRoleFilter('all')}>All Roles</Button>
        {ROLES.map((r) => (
          <Button key={r} variant={roleFilter === r ? 'primary' : 'ghost'} size="sm" onClick={() => setRoleFilter(r)} style={{ textTransform: 'capitalize' }}>
            {ROLE_ICONS[r]} {r}
          </Button>
        ))}
      </div>

      {error && <div style={{ color: colors.danger[700], marginBottom: spacing[4], padding: spacing[3], backgroundColor: colors.danger[50], borderRadius: spacing[2] }}>{error}</div>}

      {loading ? (
        <div style={{ color: colors.text.muted, textAlign: 'center', padding: spacing[10] }}>Loading staff records...</div>
      ) : staffList.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: spacing[10], color: colors.text.muted }}>
          <div style={{ fontSize: typography.fontSizes['4xl'], marginBottom: spacing[3] }}>👥</div>
          <div style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.semibold }}>No staff members found</div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: spacing[4] }}>
          {staffList.map((st) => (
            <Card key={st._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[3] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <span style={{ fontSize: typography.fontSizes['3xl'] }}>{ROLE_ICONS[st.role] || '👤'}</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>{st.name}</h3>
                      <span style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted, textTransform: 'capitalize' }}>{st.role} • {st.shift} shift</span>
                    </div>
                  </div>
                  <Badge variant={st.isActive ? 'success' : 'danger'} label={st.isActive ? 'Active' : 'Inactive'} />
                </div>
                <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
                  <div>📞 {st.phone}</div>
                  {st.email && <div>✉️ {st.email}</div>}
                  {st.notes && <div style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted, marginTop: spacing[1] }}>Notes: {st.notes}</div>}
                </div>
              </div>
              {st.isActive && (
                <div style={{ marginTop: spacing[4], paddingTop: spacing[3], borderTop: `1px solid ${colors.border.light}`, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="danger" size="sm" onClick={() => handleDeactivate(st._id)}>Deactivate</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title="Register Staff Member" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <Input label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Ramesh Sharma" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
              <Select label="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})} options={ROLES.map(r => ({ value: r, label: r.toUpperCase() }))} required />
              <Select label="Shift" value={form.shift} onChange={e => setForm({...form, shift: e.target.value})} options={SHIFTS.map(sh => ({ value: sh, label: sh.toUpperCase() }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
              <Input label="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required placeholder="01012345678" />
              <Input label="Email (Optional)" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="staff@society.com" />
            </div>
            <Input label="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Assigned Gate A / Electrician lead..." />
            {formError && <div style={{ color: colors.danger[700], fontSize: typography.fontSizes.sm, marginBottom: spacing[3] }}>{formError}</div>}
            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end', marginTop: spacing[4] }}>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Add Staff</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
