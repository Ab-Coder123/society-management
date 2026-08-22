import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, typography, spacing } from '../../styles/tokens';

export default function SocietyAdminReports() {
  const [activeTab, setActiveTab] = useState('occupancy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [occupancy, setOccupancy] = useState(null);
  const [payments, setPayments] = useState(null);
  const [complaints, setComplaints] = useState(null);
  const [visitors, setVisitors] = useState(null);

  useEffect(() => {
    async function loadReports() {
      setLoading(true); setError('');
      try {
        const [occ, pay, comp, vis] = await Promise.all([
          api.get('/reports/occupancy').catch(() => ({ data: null })),
          api.get('/reports/payments').catch(() => ({ data: null })),
          api.get('/reports/complaints').catch(() => ({ data: null })),
          api.get('/reports/visitors').catch(() => ({ data: null })),
        ]);
        setOccupancy(occ.data);
        setPayments(pay.data);
        setComplaints(comp.data);
        setVisitors(vis.data);
      } catch (err) { setError(err.response?.data?.message || 'Failed to load report data'); }
      finally { setLoading(false); }
    }
    loadReports();
  }, []);

  const buildingColumns = [
    { key: '_id', header: 'Building', render: (row) => `Building ${row._id || 'Main'}` },
    { key: 'total', header: 'Total Flats' },
    { key: 'occupied', header: 'Occupied', cellStyle: { color: colors.success[600] } },
    { key: 'vacant', header: 'Vacant', cellStyle: { color: colors.warning[600] } },
    { key: 'rented', header: 'Rented', cellStyle: { color: colors.secondary[600] } },
  ];

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ marginBottom: spacing[6] }}>
        <h2 style={{ margin: 0, fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary }}>Reports & Analytics</h2>
        <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginTop: spacing[1] }}>Comprehensive society management metrics & insights</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[5] }}>
        {['occupancy', 'payments', 'complaints', 'visitors'].map(tab => (
          <Button key={tab} variant={activeTab === tab ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab(tab)} style={{ textTransform: 'uppercase' }}>
            {tab}
          </Button>
        ))}
      </div>

      {error && <div style={{ color: colors.danger[700], marginBottom: spacing[4], padding: spacing[3], backgroundColor: colors.danger[50], borderRadius: spacing[2] }}>{error}</div>}

      {loading ? (
        <div style={{ color: colors.text.muted, textAlign: 'center', padding: spacing[10] }}>Analyzing society metrics...</div>
      ) : (
        <>
          {/* TAB 1: Occupancy */}
          {activeTab === 'occupancy' && occupancy && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing[4], marginBottom: spacing[6] }}>
                <StatCard title="Total Flats" value={occupancy.totalFlats || 0} color="primary" />
                <StatCard title="Occupancy Rate" value={`${occupancy.occupancyRate || 0}%`} color="success" />
                <StatCard title="Occupied / Rented" value={`${occupancy.occupiedCount || 0} / ${occupancy.rentedCount || 0}`} color="secondary" />
                <StatCard title="Vacant Flats" value={occupancy.vacantCount || 0} color="warning" />
              </div>

              <Card title="Building-wise Breakdown">
                <Table columns={buildingColumns} data={occupancy.byBuilding || []} emptyMessage="No building breakdown data" />
              </Card>
            </div>
          )}

          {/* TAB 2: Payments */}
          {activeTab === 'payments' && payments && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing[4], marginBottom: spacing[6] }}>
                <StatCard title="Total Billed" value={`₹${payments.totalBilled || 0}`} color="primary" />
                <StatCard title="Total Collected" value={`₹${payments.totalCollected || 0}`} color="success" />
                <StatCard title="Pending Dues" value={`₹${payments.totalPending || 0}`} color="danger" />
                <StatCard title="Collection Efficiency" value={`${payments.collectionRate || 0}%`} color="secondary" />
              </div>
            </div>
          )}

          {/* TAB 3: Complaints */}
          {activeTab === 'complaints' && complaints && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing[4], marginBottom: spacing[6] }}>
                <StatCard title="Total Complaints" value={complaints.total || 0} color="primary" />
                <StatCard title="Open Complaints" value={complaints.open || 0} color="danger" />
                <StatCard title="Resolved" value={complaints.resolved || 0} color="success" />
                <StatCard title="Avg Resolution Time" value={`${complaints.avgResolutionHours || 0} hrs`} color="secondary" />
              </div>
            </div>
          )}

          {/* TAB 4: Visitors */}
          {activeTab === 'visitors' && visitors && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing[4], marginBottom: spacing[6] }}>
                <StatCard title="Total Visitor Logs" value={visitors.totalVisitors || 0} color="primary" />
                <StatCard title="Checked-In Visitors" value={visitors.checkedInCount || 0} color="success" />
                <StatCard title="Rejected Gate Entries" value={visitors.rejectedCount || 0} color="danger" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
