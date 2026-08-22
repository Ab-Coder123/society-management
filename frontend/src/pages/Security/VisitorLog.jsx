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

export default function VisitorLog() {
  const [visitors, setVisitors] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Quick Walk-in / Delivery Form
  const [showWalkinForm, setShowWalkinForm] = useState(false);
  const [walkinData, setWalkinData] = useState({
    name: '',
    phone: '',
    purpose: 'delivery',
    vehicleNumber: '',
    flatId: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [visRes, flatRes] = await Promise.all([
        api.get('/visitors', { params: { date: dateFilter } }).catch(() => ({ data: [] })),
        api.get('/flats').catch(() => ({ data: [] })),
      ]);
      setVisitors(Array.isArray(visRes.data) ? visRes.data : []);
      setFlats(Array.isArray(flatRes.data) ? flatRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch visitor log');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(id) {
    try {
      await api.patch(`/visitors/${id}/check-in`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  }

  async function handleCheckOut(id) {
    try {
      await api.patch(`/visitors/${id}/check-out`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  }

  async function handleWalkinSubmit(e) {
    e.preventDefault();
    if (!walkinData.name.trim() || !walkinData.flatId) return;

    setSubmitLoading(true);
    try {
      await api.post('/visitors', walkinData);
      setShowWalkinForm(false);
      setWalkinData({ name: '', phone: '', purpose: 'delivery', vehicleNumber: '', flatId: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register walk-in visitor');
    } finally {
      setSubmitLoading(false);
    }
  }

  const columns = [
    { key: 'name', header: 'Visitor Name', render: (v) => <span style={{ fontWeight: typography.fontWeights.bold }}>{v.name}</span> },
    { key: 'phone', header: 'Phone', render: (v) => v.phone || '—' },
    { key: 'flat', header: 'Destination Flat', render: (v) => (v.flatId ? `${v.flatId.building} - ${v.flatId.flatNumber}` : '—') },
    { key: 'purpose', header: 'Purpose', render: (v) => <span style={{ textTransform: 'capitalize' }}>{v.purpose}</span> },
    { key: 'vehicleNumber', header: 'Vehicle Reg', render: (v) => v.vehicleNumber || '—' },
    { key: 'status', header: 'Status', render: (v) => <Badge type="visitor" status={v.status} /> },
    {
      key: 'actions',
      header: 'Gate Actions',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (v) => (
        <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end' }}>
          {v.status === 'approved' && (
            <Button variant="success" size="sm" onClick={() => handleCheckIn(v._id)}>Check-In</Button>
          )}
          {v.status === 'checked_in' && (
            <Button variant="danger" size="sm" onClick={() => handleCheckOut(v._id)}>Check-Out</Button>
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
            Gate Clearance Log
          </h2>
          <p style={{ color: colors.text.secondary, fontSize: typography.fontSizes.sm, marginTop: spacing[1] }}>
            Verify resident pre-approved visitors and log gate entries
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowWalkinForm(true)}>
          + Register Walk-In / Delivery
        </Button>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: spacing[4], alignItems: 'center', marginBottom: spacing[5] }}>
          <Input
            label="Filter Date:"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            fullWidth={false}
            style={{ width: '160px', marginBottom: 0 }}
          />
        </div>

        {error && <div style={{ color: colors.danger[700], padding: spacing[3] }}>{error}</div>}

        <Table columns={columns} data={visitors} loading={loading} emptyMessage="No visitor entries found for the selected date." />
      </Card>

      {showWalkinForm && (
        <Modal title="Register Walk-In Visitor" onClose={() => setShowWalkinForm(false)}>
          <form onSubmit={handleWalkinSubmit}>
            <Input label="Visitor Name *" value={walkinData.name} onChange={(e) => setWalkinData({ ...walkinData, name: e.target.value })} required placeholder="e.g. Courier Agent" />
            <Input label="Phone Number" value={walkinData.phone} onChange={(e) => setWalkinData({ ...walkinData, phone: e.target.value })} placeholder="01012345678" />
            <Select
              label="Destination Flat *"
              value={walkinData.flatId}
              onChange={(e) => setWalkinData({ ...walkinData, flatId: e.target.value })}
              required
              options={[
                { value: '', label: 'Select Destination Flat...' },
                ...flats.map((f) => ({
                  value: f._id,
                  label: `${f.building} - ${f.flatNumber} ${f.wing ? `(${f.wing})` : ''}`,
                })),
              ]}
            />
            <Select
              label="Purpose"
              value={walkinData.purpose}
              onChange={(e) => setWalkinData({ ...walkinData, purpose: e.target.value })}
              options={[
                { value: 'delivery', label: 'Delivery / Courier' },
                { value: 'guest', label: 'Guest' },
                { value: 'service', label: 'Service / Maintenance' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Input label="Vehicle Registration Number" value={walkinData.vehicleNumber} onChange={(e) => setWalkinData({ ...walkinData, vehicleNumber: e.target.value })} placeholder="e.g. CAI-9876" />
            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end', marginTop: spacing[4] }}>
              <Button type="button" variant="secondary" onClick={() => setShowWalkinForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitLoading}>Register & Grant Entry</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
