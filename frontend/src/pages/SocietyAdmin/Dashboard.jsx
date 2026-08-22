import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import { colors, typography, spacing } from '../../styles/tokens';

import SocietyAdminNotices from './Notices';
import SocietyAdminComplaints from './Complaints';
import SocietyAdminPayments from './Payments';
import SocietyAdminParking from './Parking';
import SocietyAdminVisitors from './Visitors';
import SocietyAdminFacilities from './Facilities';
import SocietyAdminEvents from './Events';
import SocietyAdminStaff from './Staff';
import SocietyAdminReports from './Reports';

function Overview() {
  const [stats, setStats] = useState({
    occupancy: { occupied: 0, vacant: 0, rented: 0, total: 0 },
    openComplaints: 0,
    activeNotices: 0,
    paymentSummary: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [occRes, compRes, notRes, payRes] = await Promise.all([
          api.get('/flats/occupancy-summary').catch(() => ({ data: {} })),
          api.get('/complaints').catch(() => ({ data: [] })),
          api.get('/notices').catch(() => ({ data: [] })),
          api.get('/payments/summary').catch(() => ({ data: null })),
        ]);

        const openCount = Array.isArray(compRes.data)
          ? compRes.data.filter((c) => ['raised', 'assigned', 'in_progress'].includes(c.status)).length
          : 0;

        setStats({
          occupancy: occRes.data || { occupied: 0, vacant: 0, rented: 0, total: 0 },
          openComplaints: openCount,
          activeNotices: Array.isArray(notRes.data) ? notRes.data.length : 0,
          paymentSummary: payRes.data,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: typography.fontSizes['2xl'], color: colors.text.primary, marginBottom: spacing[4], fontWeight: typography.fontWeights.bold }}>
        Society Overview
      </h2>
      {loading ? (
        <div style={{ color: colors.text.muted }}>Loading dashboard data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing[4], marginBottom: spacing[6] }}>
          <StatCard
            title="Total Flats"
            value={stats.occupancy.total || 0}
            subtitle={`${stats.occupancy.occupied || 0} Occupied • ${stats.occupancy.rented || 0} Rented`}
            color="primary"
          />
          <StatCard
            title="Monthly Maintenance Dues"
            value={`₹${stats.paymentSummary?.totalPaid || 0}`}
            subtitle={`₹${stats.paymentSummary?.totalPending || 0} Pending`}
            color="success"
          />
          <StatCard
            title="Open Complaints"
            value={stats.openComplaints}
            subtitle="Pending resolution"
            color="danger"
          />
          <StatCard
            title="Active Notices"
            value={stats.activeNotices}
            subtitle="Broadcast announcements"
            color="secondary"
          />
        </div>
      )}
    </div>
  );
}

export default function SocietyAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = [
    { label: 'Overview', path: '/society-admin', icon: '📊' },
    { label: 'Payments & Dues', path: '/society-admin/payments', icon: '💳' },
    { label: 'Parking & Vehicles', path: '/society-admin/parking', icon: '🚗' },
    { label: 'Visitor Logs', path: '/society-admin/visitors', icon: '🚪' },
    { label: 'Facility Booking', path: '/society-admin/facilities', icon: '🏋️' },
    { label: 'Events & Community', path: '/society-admin/events', icon: '🎉' },
    { label: 'Staff & Services', path: '/society-admin/staff', icon: '👥' },
    { label: 'Notices', path: '/society-admin/notices', icon: '📢' },
    { label: 'Complaints', path: '/society-admin/complaints', icon: '📋' },
    { label: 'Reports & Analytics', path: '/society-admin/reports', icon: '📈' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background.main, fontFamily: typography.fontFamily }}>
      <Sidebar role="society_admin" user={user} navItems={navItems} onLogout={handleLogout} />
      <div style={{ flex: 1, padding: spacing[8], overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/payments" element={<SocietyAdminPayments />} />
          <Route path="/parking" element={<SocietyAdminParking />} />
          <Route path="/visitors" element={<SocietyAdminVisitors />} />
          <Route path="/facilities" element={<SocietyAdminFacilities />} />
          <Route path="/events" element={<SocietyAdminEvents />} />
          <Route path="/staff" element={<SocietyAdminStaff />} />
          <Route path="/notices" element={<SocietyAdminNotices />} />
          <Route path="/complaints" element={<SocietyAdminComplaints />} />
          <Route path="/reports" element={<SocietyAdminReports />} />
        </Routes>
      </div>
    </div>
  );
}
