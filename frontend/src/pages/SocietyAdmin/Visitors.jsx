import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { colors, typography, spacing } from '../../styles/tokens';

export default function SocietyAdminVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchVisitors();
  }, [dateFilter, statusFilter]);

  async function fetchVisitors() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/visitors', { params });
      setVisitors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch society visitor log');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Visitor Name',
      render: (v) => <span style={{ fontWeight: typography.fontWeights.bold }}>{v.name}</span>,
    },
    { key: 'phone', header: 'Phone' },
    {
      key: 'flat',
      header: 'Destination Flat',
      render: (v) => (v.flatId ? `${v.flatId.building} - ${v.flatId.flatNumber}` : '—'),
    },
    {
      key: 'purpose',
      header: 'Purpose',
      render: (v) => <span style={{ textTransform: 'capitalize' }}>{v.purpose}</span>,
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle Reg',
      render: (v) => v.vehicleNumber || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <Badge type="visitor" status={v.status} />,
    },
    {
      key: 'checkInTime',
      header: 'Gate Check-In',
      render: (v) => (v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'),
    },
  ];

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ marginBottom: spacing[6] }}>
        <h2 style={{ fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary, margin: 0 }}>
          Society Visitor Log & Audit
        </h2>
        <p style={{ color: colors.text.secondary, fontSize: typography.fontSizes.sm, marginTop: spacing[1] }}>
          Oversight log of all visitor entries, approvals, and gate checks across the society
        </p>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: spacing[4], alignItems: 'center', marginBottom: spacing[5] }}>
          <Input
            label="Date:"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            fullWidth={false}
            style={{ width: '160px', marginBottom: 0 }}
          />

          <Select
            label="Status:"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'checked_in', label: 'Checked In' },
              { value: 'checked_out', label: 'Checked Out' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            fullWidth={false}
            style={{ width: '160px', marginBottom: 0 }}
          />
        </div>

        {error && <div style={{ color: colors.danger[700], padding: spacing[3] }}>{error}</div>}

        <Table columns={columns} data={visitors} loading={loading} emptyMessage="No visitor logs found." />
      </Card>
    </div>
  );
}
