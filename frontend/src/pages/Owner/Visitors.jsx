import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import Card from '../../components/Card';
import Table from '../../components/Table';
import { colors, typography, spacing } from '../../styles/tokens';

export default function OwnerVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: 'guest',
    vehicleNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVisitors();
  }, []);

  async function fetchVisitors() {
    setLoading(true);
    try {
      const res = await api.get('/visitors');
      setVisitors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/visitors', formData);
      setShowModal(false);
      setFormData({ name: '', phone: '', purpose: 'guest', vehicleNumber: '' });
      fetchVisitors();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create visitor request');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id) {
    try {
      await api.patch(`/visitors/${id}/approve`);
      fetchVisitors();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  }

  async function handleReject(id) {
    try {
      await api.patch(`/visitors/${id}/reject`);
      fetchVisitors();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  }

  const columns = [
    { key: 'name', header: 'Visitor Name', render: (v) => <span style={{ fontWeight: typography.fontWeights.bold }}>{v.name}</span> },
    { key: 'phone', header: 'Phone Number', render: (v) => v.phone || '—' },
    { key: 'purpose', header: 'Purpose', render: (v) => <span style={{ textTransform: 'capitalize' }}>{v.purpose}</span> },
    { key: 'vehicleNumber', header: 'Vehicle Reg', render: (v) => v.vehicleNumber || '—' },
    { key: 'status', header: 'Status', render: (v) => <Badge type="visitor" status={v.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (v) => (
        <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end' }}>
          {v.status === 'pending' && (
            <>
              <Button size="sm" variant="success" onClick={() => handleApprove(v._id)}>Approve</Button>
              <Button size="sm" variant="danger" onClick={() => handleReject(v._id)}>Reject</Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h2 style={{ fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary, margin: 0 }}>
            Visitor Access & Approvals
          </h2>
          <p style={{ color: colors.text.secondary, fontSize: typography.fontSizes.sm, marginTop: spacing[1] }}>
            Pre-approve guests, delivery personnel, or view security gate entry logs for your flat
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Pre-Register Guest
        </Button>
      </div>

      <Card title="Flat Visitor History">
        {error && <div style={{ color: colors.danger[700], padding: spacing[3] }}>{error}</div>}
        <Table columns={columns} data={visitors} loading={loading} emptyMessage="No visitor logs recorded for your flat." />
      </Card>

      {showModal && (
        <Modal title="Pre-Register Visitor" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate}>
            <Input label="Visitor Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. John Doe" />
            <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g. 01012345678" />
            <Select
              label="Purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              options={[
                { value: 'guest', label: 'Guest / Friend' },
                { value: 'delivery', label: 'Delivery / Courier' },
                { value: 'service', label: 'Service / Contractor' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Input label="Vehicle Registration Number" value={formData.vehicleNumber} onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })} placeholder="e.g. CAI-9876" />
            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end', marginTop: spacing[4] }}>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Pre-Approve Visitor</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
