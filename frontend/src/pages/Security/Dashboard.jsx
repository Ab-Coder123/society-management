import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, typography, spacing } from '../../styles/tokens';

import VisitorLog from './VisitorLog';
import VehicleVerify from './VehicleVerify';

function SecurityOverview() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    checkedIn: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await api.get('/visitors');
        if (Array.isArray(data)) {
          const pending = data.filter((v) => v.status === 'pending').length;
          const approved = data.filter((v) => v.status === 'approved').length;
          const checkedIn = data.filter((v) => v.status === 'checked_in').length;
          setStats({ pending, approved, checkedIn });
        }
      } catch (err) {
        console.error('Failed to load gate stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ marginBottom: spacing[6] }}>
        <h2 style={{ fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary, margin: 0 }}>
          Gate Security Desk
        </h2>
        <p style={{ color: colors.text.secondary, fontSize: typography.fontSizes.sm, marginTop: spacing[1] }}>
          Real-time visitor clearance, entry logs, and gate control
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing[5], marginBottom: spacing[6] }}>
        <StatCard
          title="Approved for Gate Entry"
          value={loading ? '...' : stats.approved}
          subtitle="Ready for Check-In"
          color="primary"
        />

        <StatCard
          title="Currently Inside (Checked In)"
          value={loading ? '...' : stats.checkedIn}
          subtitle="Active Visitors"
          color="success"
        />

        <StatCard
          title="Awaiting Approval"
          value={loading ? '...' : stats.pending}
          subtitle="Pending Resident Confirmation"
          color="warning"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[5] }}>
        <Card title="Gate Operations">
          <p style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginBottom: spacing[4] }}>
            Manage visitor entry logs, check-in approved visitors, or log walk-in deliveries.
          </p>
          <Link to="/security/visitors" style={{ textDecoration: 'none' }}>
            <Button variant="primary">Open Visitor Log →</Button>
          </Link>
        </Card>

        <Card title="Vehicle Clearance">
          <p style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, marginBottom: spacing[4] }}>
            Verify vehicle plate numbers against pre-approved visitor clearance passes.
          </p>
          <Link to="/security/vehicle-verify" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Verify Vehicle →</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default function SecurityDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = [
    { label: 'Gate Overview', path: '/security', icon: '🛡️' },
    { label: 'Visitor Log', path: '/security/visitors', icon: '🚪' },
    { label: 'Vehicle Clearance', path: '/security/vehicle-verify', icon: '🚗' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background.main, fontFamily: typography.fontFamily }}>
      <Sidebar role="security_guard" user={user} navItems={navItems} onLogout={handleLogout} />
      <div style={{ flex: 1, padding: spacing[8], overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<SecurityOverview />} />
          <Route path="/visitors" element={<VisitorLog />} />
          <Route path="/vehicle-verify" element={<VehicleVerify />} />
        </Routes>
      </div>
    </div>
  );
}
