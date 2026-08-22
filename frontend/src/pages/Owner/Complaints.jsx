import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Card from '../../components/Card';
import ComplaintTimeline from '../../components/ComplaintTimeline';
import { colors, typography, spacing } from '../../styles/tokens';

const CATEGORIES = ['maintenance', 'security', 'noise', 'cleanliness', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function OwnerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal for new complaint
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'maintenance',
    priority: 'medium',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Selected complaint details
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  async function fetchComplaints() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/complaints', { params: { myComplaints: 'true' } });
      setComplaints(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, []);

  async function handleCreateComplaint(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/complaints', form);
      setModalOpen(false);
      setForm({ title: '', category: 'maintenance', priority: 'medium', description: '' });
      fetchComplaints();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        setFormError(errors.map((e) => e.msg).join(', '));
      } else {
        setFormError(err.response?.data?.message || 'Failed to submit complaint');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReopen(id) {
    if (!window.confirm('Reopen this complaint?')) return;
    try {
      await api.patch(`/complaints/${id}/reopen`);
      fetchComplaints();
      if (selectedComplaint && selectedComplaint._id === id) {
        const res = await api.get(`/complaints/${id}`);
        setSelectedComplaint(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reopen complaint');
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim() || !selectedComplaint) return;
    setCommenting(true);
    try {
      const res = await api.post(`/complaints/${selectedComplaint._id}/comments`, {
        text: newComment.trim(),
      });
      setSelectedComplaint(res.data);
      setNewComment('');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setCommenting(false);
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: typography.fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: typography.fontSizes['3xl'], color: colors.text.primary, fontWeight: typography.fontWeights.bold }}>
            My Complaints
          </h1>
          <p style={{ margin: `${spacing[1]} 0 0 0`, color: colors.text.secondary, fontSize: typography.fontSizes.sm }}>
            Log maintenance issues, security concerns, or requests for your flat
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          + File New Complaint
        </Button>
      </div>

      {error && (
        <div style={{ padding: spacing[3], backgroundColor: colors.danger[50], color: colors.danger[700], borderRadius: spacing[2], marginBottom: spacing[4] }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing[10], color: colors.text.muted }}>Loading your complaints...</div>
      ) : complaints.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: spacing[10], color: colors.text.muted }}>
          <p style={{ margin: 0 }}>You have not filed any complaints yet.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedComplaint ? '1fr 1fr' : '1fr', gap: spacing[5] }}>
          {/* Complaints List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            {complaints.map((c) => {
              const isSelected = selectedComplaint?._id === c._id;
              const canReopen = ['resolved', 'closed'].includes(c.status) && (c.reopenCount || 0) < 1;

              return (
                <Card
                  key={c._id}
                  style={{
                    borderLeft: isSelected ? `4px solid ${colors.primary[600]}` : `1px solid ${colors.border.default}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedComplaint(c)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] }}>
                    <div>
                      <div style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted, textTransform: 'uppercase', marginBottom: spacing[1] }}>
                        {c.category} • Priority: {c.priority}
                      </div>
                      <h3 style={{ margin: 0, fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>
                        {c.title}
                      </h3>
                    </div>
                    <Badge type="complaint" status={c.status} />
                  </div>

                  <p style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, margin: `${spacing[2]} 0 ${spacing[4]} 0` }}>
                    {c.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    {canReopen && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReopen(c._id);
                        }}
                      >
                        Reopen Issue
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Details & Discussion Panel */}
          {selectedComplaint && (
            <Card title={`Complaint #${selectedComplaint._id.slice(-6)}`} subtitle={selectedComplaint.title}>
              <div style={{ marginBottom: spacing[4] }}>
                <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary }}>
                  Category: <strong>{selectedComplaint.category}</strong> | Status:{' '}
                  <Badge type="complaint" status={selectedComplaint.status} />
                </div>
              </div>

              <h4 style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold, color: colors.text.primary, marginBottom: spacing[2] }}>
                Activity & Response History
              </h4>

              <ComplaintTimeline comments={selectedComplaint.comments} />

              <form onSubmit={handleAddComment} style={{ marginTop: spacing[4] }}>
                <Input
                  placeholder="Reply or add details..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[2], marginTop: spacing[2] }}>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedComplaint(null)}>
                    Close Panel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={commenting}>
                    Send Response
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* New Complaint Modal */}
      {modalOpen && (
        <Modal title="File New Complaint" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreateComplaint}>
            {formError && (
              <div style={{ padding: spacing[3], backgroundColor: colors.danger[50], color: colors.danger[700], borderRadius: spacing[2], marginBottom: spacing[3], fontSize: typography.fontSizes.sm }}>
                {formError}
              </div>
            )}

            <Input
              label="Issue Title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Water Seepage in Master Bathroom"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={CATEGORIES.map((cat) => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))}
              />
              <Select
                label="Priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                options={PRIORITIES.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
              />
            </div>

            <div style={{ marginBottom: spacing[4] }}>
              <label style={{ display: 'block', fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, color: colors.text.secondary, marginBottom: spacing[1] }}>
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the issue in detail..."
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
                Submit Complaint
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
