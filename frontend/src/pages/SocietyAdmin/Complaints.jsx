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

const STATUSES = ['all', 'raised', 'assigned', 'in_progress', 'resolved', 'closed'];

export default function SocietyAdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateMachine, setStateMachine] = useState({ allowedTransitions: {} });

  // Selected complaint for timeline & discussion
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetComplaint, setAssignTargetComplaint] = useState(null);
  const [assignedStaff, setAssignedStaff] = useState('');
  const [assigning, setAssigning] = useState(false);

  async function fetchComplaints() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/complaints', { params });
      setComplaints(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStateMachine() {
    try {
      const res = await api.get('/complaints/state-machine');
      setStateMachine(res.data);
    } catch (err) {
      console.error('Failed to load state machine map:', err);
    }
  }

  useEffect(() => {
    fetchComplaints();
    fetchStateMachine();
  }, [statusFilter]);

  async function handleStatusChange(complaintId, nextStatus) {
    try {
      await api.patch(`/complaints/${complaintId}/status`, { status: nextStatus });
      fetchComplaints();
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        const res = await api.get(`/complaints/${complaintId}`);
        setSelectedComplaint(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Status transition failed');
    }
  }

  function handleOpenAssign(complaint) {
    setAssignTargetComplaint(complaint);
    setAssignedStaff(complaint.assignedToStaff || '');
    setAssignModalOpen(true);
  }

  async function handleAssignSubmit(e) {
    e.preventDefault();
    if (!assignedStaff.trim()) return;
    setAssigning(true);
    try {
      await api.patch(`/complaints/${assignTargetComplaint._id}/assign`, {
        assignedToStaff: assignedStaff.trim(),
      });
      setAssignModalOpen(false);
      fetchComplaints();
      if (selectedComplaint && selectedComplaint._id === assignTargetComplaint._id) {
        const res = await api.get(`/complaints/${assignTargetComplaint._id}`);
        setSelectedComplaint(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    } finally {
      setAssigning(false);
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
      <div style={{ marginBottom: spacing[6] }}>
        <h1 style={{ margin: 0, fontSize: typography.fontSizes['3xl'], color: colors.text.primary, fontWeight: typography.fontWeights.bold }}>
          Complaint Management
        </h1>
        <p style={{ margin: `${spacing[1]} 0 0 0`, color: colors.text.secondary, fontSize: typography.fontSizes.sm }}>
          Track, assign, and resolve resident complaints across society flats
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[5], flexWrap: 'wrap' }}>
        {STATUSES.map((st) => (
          <Button
            key={st}
            variant={statusFilter === st ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter(st)}
            style={{ textTransform: 'capitalize' }}
          >
            {st === 'all' ? 'All Complaints' : st.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {error && (
        <div style={{ padding: spacing[3], backgroundColor: colors.danger[50], color: colors.danger[700], borderRadius: spacing[2], marginBottom: spacing[4] }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing[10], color: colors.text.muted }}>Loading complaints...</div>
      ) : complaints.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: spacing[10] }}>
          <p style={{ margin: 0, color: colors.text.muted }}>No complaints match the selected status.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedComplaint ? '1fr 1fr' : '1fr', gap: spacing[5] }}>
          {/* Complaints List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            {complaints.map((c) => {
              const isSelected = selectedComplaint?._id === c._id;
              const allowedNext = stateMachine.allowedTransitions?.[c.status] || [];

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
                        {c.category} • Flat {c.flatId?.flatNumber || 'N/A'} ({c.flatId?.building || 'Main'})
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

                  {c.assignedToStaff && (
                    <div style={{ fontSize: typography.fontSizes.xs, color: colors.secondary[700], marginBottom: spacing[3] }}>
                      🛠️ Assigned: <strong>{c.assignedToStaff}</strong>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', onClick: (e) => e.stopPropagation() }}>
                    <Button size="sm" variant="secondary" onClick={() => handleOpenAssign(c)}>
                      {c.assignedToStaff ? 'Reassign Staff' : 'Assign Staff'}
                    </Button>
                    {allowedNext.map((nextSt) => (
                      <Button
                        key={nextSt}
                        size="sm"
                        variant={nextSt === 'resolved' ? 'success' : 'ghost'}
                        onClick={() => handleStatusChange(c._id, nextSt)}
                        style={{ textTransform: 'capitalize' }}
                      >
                        → {nextSt.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Right Panel: Discussion & History */}
          {selectedComplaint && (
            <Card title={`Complaint #${selectedComplaint._id.slice(-6)}`} subtitle={selectedComplaint.title}>
              <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginBottom: spacing[4] }}>
                Raised by: <strong>{selectedComplaint.raisedBy?.name || 'Resident'}</strong>
              </div>

              <h4 style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold, color: colors.text.primary, marginBottom: spacing[2] }}>
                Activity & History
              </h4>

              <ComplaintTimeline comments={selectedComplaint.comments} />

              <form onSubmit={handleAddComment} style={{ marginTop: spacing[4] }}>
                <Input
                  placeholder="Type an update or comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[2], marginTop: spacing[2] }}>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedComplaint(null)}>
                    Close Panel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={commenting}>
                    Post Comment
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {assignModalOpen && (
        <Modal title="Assign Staff Member" onClose={() => setAssignModalOpen(false)}>
          <form onSubmit={handleAssignSubmit}>
            <Input
              label="Staff Member Name / Role"
              placeholder="e.g. Hassan Mahmoud (Electrician)"
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[2], marginTop: spacing[4] }}>
              <Button type="button" variant="secondary" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={assigning}>
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
