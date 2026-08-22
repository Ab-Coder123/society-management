import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import NoticeCard from '../../components/NoticeCard';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { colors, typography, spacing } from '../../styles/tokens';

const CATEGORIES = ['all', 'maintenance', 'meeting', 'utility', 'emergency', 'holiday', 'general'];

export default function SocietyAdminNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [includeExpired, setIncludeExpired] = useState(false);

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'general',
    expiresAt: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function fetchNotices() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (includeExpired) params.includeExpired = 'true';

      const res = await api.get('/notices', { params });
      setNotices(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotices();
  }, [categoryFilter, includeExpired]);

  function handleOpenCreate() {
    setEditingId(null);
    setForm({ title: '', body: '', category: 'general', expiresAt: '' });
    setFormError('');
    setModalOpen(true);
  }

  function handleOpenEdit(notice) {
    setEditingId(notice._id);
    setForm({
      title: notice.title,
      body: notice.body,
      category: notice.category || 'general',
      expiresAt: notice.expiresAt ? notice.expiresAt.substring(0, 10) : '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        category: form.category,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      if (editingId) {
        await api.patch(`/notices/${editingId}`, payload);
      } else {
        await api.post('/notices', payload);
      }

      setModalOpen(false);
      fetchNotices();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        setFormError(errors.map((e) => e.msg).join(', '));
      } else {
        setFormError(err.response?.data?.message || 'Failed to save notice');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      setNotices((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete notice');
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: typography.fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: typography.fontSizes['3xl'], color: colors.text.primary, fontWeight: typography.fontWeights.bold }}>
            Notice Management
          </h1>
          <p style={{ margin: `${spacing[1]} 0 0 0`, color: colors.text.secondary, fontSize: typography.fontSizes.sm }}>
            Publish and manage announcements for residents and owners
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + Post New Notice
        </Button>
      </div>

      {/* Category Tabs & Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing[3],
          marginBottom: spacing[5],
          borderBottom: `1px solid ${colors.border.default}`,
          paddingBottom: spacing[3],
        }}
      >
        <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              style={{ textTransform: 'capitalize' }}
            >
              {cat}
            </Button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: spacing[2], fontSize: typography.fontSizes.sm, color: colors.text.secondary, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeExpired}
            onChange={(e) => setIncludeExpired(e.target.checked)}
          />
          Show Expired Notices
        </label>
      </div>

      {error && (
        <div style={{ padding: spacing[3], backgroundColor: colors.danger[50], color: colors.danger[700], borderRadius: spacing[2], marginBottom: spacing[4] }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing[10], color: colors.text.muted }}>Loading notices...</div>
      ) : notices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: spacing[12], backgroundColor: colors.background.subtle, borderRadius: spacing[3], border: `1px dashed ${colors.border.dark}` }}>
          <p style={{ margin: 0, color: colors.text.muted, fontSize: typography.fontSizes.md }}>No notices found in this category.</p>
        </div>
      ) : (
        notices.map((notice) => (
          <NoticeCard
            key={notice._id}
            notice={notice}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            canManage={true}
          />
        ))
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Notice' : 'Post New Notice'}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div style={{ padding: spacing[3], backgroundColor: colors.danger[50], color: colors.danger[700], borderRadius: spacing[2], marginBottom: spacing[3], fontSize: typography.fontSizes.sm }}>
              {formError}
            </div>
          )}

          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Elevator Maintenance Scheduled"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={CATEGORIES.filter((c) => c !== 'all').map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
            />

            <Input
              label="Expires At (Optional)"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: spacing[5] }}>
            <label style={{ display: 'block', fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, color: colors.text.secondary, marginBottom: spacing[1] }}>
              Notice Body *
            </label>
            <textarea
              required
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write the full announcement details here..."
              style={{
                width: '100%',
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: spacing[2],
                border: `1px solid ${colors.border.default}`,
                fontSize: typography.fontSizes.md,
                fontFamily: typography.fontFamily,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[2] }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingId ? 'Update Notice' : 'Publish Notice'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
