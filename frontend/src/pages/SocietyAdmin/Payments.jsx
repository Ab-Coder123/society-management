import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { colors, typography, spacing } from '../../styles/tokens';

export default function SocietyAdminPayments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [chargeData, setChargeData] = useState({
    flatId: '',
    month: new Date().toISOString().slice(0, 7),
    amount: '',
    type: 'maintenance',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [monthFilter, statusFilter]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [payRes, sumRes, flatRes] = await Promise.all([
        api.get('/payments', { params: { month: monthFilter, status: statusFilter } }).catch(() => ({ data: [] })),
        api.get('/payments/summary', { params: { month: monthFilter } }).catch(() => ({ data: null })),
        api.get('/flats').catch(() => ({ data: [] })),
      ]);
      setPayments(Array.isArray(payRes.data) ? payRes.data : []);
      setSummary(sumRes.data);
      setFlats(Array.isArray(flatRes.data) ? flatRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payments data');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid(id) {
    if (!window.confirm('Mark this maintenance charge as paid?')) return;
    try {
      await api.patch(`/payments/${id}/mark-paid`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as paid');
    }
  }

  async function handleCreateCharge(e) {
    e.preventDefault();
    if (!chargeData.month || !chargeData.amount) {
      alert('Month and Amount are required');
      return;
    }

    if (isBulk) {
      const confirmBulk = window.confirm(
        `Are you sure you want to generate a ₹${chargeData.amount} maintenance charge for ALL ${flats.length || ''} flats for month "${chargeData.month}"?`
      );
      if (!confirmBulk) return;
    }

    setSubmitting(true);
    try {
      const payload = isBulk
        ? { bulk: true, month: chargeData.month, amount: Number(chargeData.amount), type: chargeData.type }
        : { flatId: chargeData.flatId, month: chargeData.month, amount: Number(chargeData.amount), type: chargeData.type };

      const res = await api.post('/payments', payload);
      alert(res.data.message || 'Charge(s) created successfully');
      setShowModal(false);
      setChargeData({ flatId: '', month: new Date().toISOString().slice(0, 7), amount: '', type: 'maintenance' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create charge');
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    {
      key: 'flatId',
      header: 'Flat',
      render: (p) => (
        <span style={{ fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>
          {p.flatId ? `${p.flatId.building} - ${p.flatId.flatNumber}` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'ownerId',
      header: 'Owner',
      render: (p) => p.ownerId?.name || 'Unassigned',
    },
    { key: 'month', header: 'Month' },
    {
      key: 'type',
      header: 'Type',
      render: (p) => <span style={{ textTransform: 'capitalize' }}>{p.type}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p) => <span style={{ fontWeight: typography.fontWeights.bold }}>₹{p.amount}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge type="payment" status={p.isOverdue ? 'overdue' : p.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (p) =>
        p.status !== 'paid' ? (
          <Button variant="success" size="sm" onClick={() => handleMarkPaid(p._id)}>
            Mark Paid
          </Button>
        ) : (
          <span style={{ fontSize: typography.fontSizes.xs, color: colors.success[600], fontWeight: typography.fontWeights.semibold }}>
            ✓ Paid ({p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ''})
          </span>
        ),
    },
  ];

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h2 style={{ fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary, margin: 0 }}>
            Society Maintenance & Dues
          </h2>
          <p style={{ color: colors.text.secondary, fontSize: typography.fontSizes.sm, marginTop: spacing[1] }}>
            Generate maintenance bills, track collections, and manage overdue payments
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Create Charge
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing[4], marginBottom: spacing[6] }}>
        <StatCard
          title={`Total Billed (${monthFilter})`}
          value={`₹${summary?.totalAmount ? summary.totalAmount.toLocaleString() : 0}`}
          subtitle={`${summary?.countTotal || 0} total records`}
          color="primary"
        />
        <StatCard
          title="Total Collected"
          value={`₹${summary?.totalPaid ? summary.totalPaid.toLocaleString() : 0}`}
          subtitle={`${summary?.countPaid || 0} paid`}
          color="success"
        />
        <StatCard
          title="Total Outstanding Dues"
          value={`₹${summary?.totalPending ? summary.totalPending.toLocaleString() : 0}`}
          subtitle={`${summary?.countPending || 0} pending`}
          color="danger"
        />
      </div>

      {/* Create Charge Modal */}
      {showModal && (
        <Modal
          title="Create Maintenance Charge"
          onClose={() => setShowModal(false)}
          footer={null}
        >
          <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[4] }}>
            <Button
              type="button"
              variant={!isBulk ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setIsBulk(false)}
            >
              Single Flat
            </Button>
            <Button
              type="button"
              variant={isBulk ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setIsBulk(true)}
            >
              Bulk (All Flats)
            </Button>
          </div>

          <form onSubmit={handleCreateCharge}>
            {!isBulk && (
              <Select
                label="Target Flat *"
                value={chargeData.flatId}
                onChange={(e) => setChargeData({ ...chargeData, flatId: e.target.value })}
                required={!isBulk}
                options={[
                  { value: '', label: 'Select Flat...' },
                  ...flats.map((f) => ({
                    value: f._id,
                    label: `${f.building} - ${f.flatNumber} ${f.wing ? `(${f.wing})` : ''}`,
                  })),
                ]}
              />
            )}

            <Input
              label="Month (YYYY-MM) *"
              type="month"
              value={chargeData.month}
              onChange={(e) => setChargeData({ ...chargeData, month: e.target.value })}
              required
            />

            <Input
              label="Amount (₹) *"
              type="number"
              placeholder="e.g. 1500"
              value={chargeData.amount}
              onChange={(e) => setChargeData({ ...chargeData, amount: e.target.value })}
              required
              min="1"
            />

            <Select
              label="Charge Type"
              value={chargeData.type}
              onChange={(e) => setChargeData({ ...chargeData, type: e.target.value })}
              options={[
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'penalty', label: 'Penalty' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end', marginTop: spacing[4] }}>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {isBulk ? `Generate Charges for ${flats.length || 'All'} Flats` : 'Create Single Charge'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Filter Toolbar & Table */}
      <Card>
        <div style={{ display: 'flex', gap: spacing[4], alignItems: 'center', marginBottom: spacing[5] }}>
          <Input
            label="Month:"
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
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
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue Only' },
            ]}
            fullWidth={false}
            style={{ width: '160px', marginBottom: 0 }}
          />
        </div>

        {error && <div style={{ color: colors.danger[700], padding: spacing[3] }}>{error}</div>}

        <Table columns={columns} data={payments} loading={loading} emptyMessage="No charges match the selected filter." />
      </Card>
    </div>
  );
}
