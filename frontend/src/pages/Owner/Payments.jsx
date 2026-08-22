import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Table from '../../components/Table';
import { colors, typography, spacing } from '../../styles/tokens';

export default function OwnerPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }

  const totalPending = payments
    .filter((p) => p.status === 'pending' || p.isOverdue)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const columns = [
    { key: 'month', header: 'Month', render: (p) => <span style={{ fontWeight: typography.fontWeights.bold }}>{p.month}</span> },
    { key: 'type', header: 'Type', render: (p) => <span style={{ textTransform: 'capitalize' }}>{p.type}</span> },
    { key: 'amount', header: 'Amount', render: (p) => <span style={{ fontWeight: typography.fontWeights.bold }}>₹{p.amount}</span> },
    { key: 'status', header: 'Status', render: (p) => <Badge type="payment" status={p.isOverdue ? 'overdue' : p.status} /> },
    { key: 'paidAt', header: 'Paid Date', render: (p) => (p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—') },
  ];

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ marginBottom: spacing[6] }}>
        <h2 style={{ fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary, margin: 0 }}>
          Maintenance & Payments
        </h2>
        <p style={{ color: colors.text.secondary, fontSize: typography.fontSizes.sm, marginTop: spacing[1] }}>
          View society maintenance charges, dues, and payment history for your flat
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[5], marginBottom: spacing[6] }}>
        <StatCard
          title="Total Due / Pending"
          value={`₹${totalPending.toLocaleString()}`}
          subtitle={totalPending > 0 ? 'Please clear outstanding maintenance dues' : 'All maintenance fees up to date'}
          color={totalPending > 0 ? 'danger' : 'success'}
        />

        <StatCard
          title="Total Paid"
          value={`₹${totalPaid.toLocaleString()}`}
          subtitle="Cleared payment history"
          color="success"
        />
      </div>

      <Card title="Payment History">
        {error && <div style={{ color: colors.danger[700], padding: spacing[3] }}>{error}</div>}
        <Table columns={columns} data={payments} loading={loading} emptyMessage="No payment records generated for your flat yet." />
      </Card>
    </div>
  );
}
