import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { colors, typography, spacing } from '../../styles/tokens';

import ResidentNotices from './Notices';
import ResidentComplaints from './Complaints';
import ResidentVisitors from './Visitors';
import ResidentFacilities from './Facilities';
import ResidentEvents from './Events';

function ResidentOverview() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [compRes, notRes] = await Promise.all([
          api.get('/complaints', { params: { myComplaints: 'true' } }).catch(() => ({ data: [] })),
          api.get('/notices').catch(() => ({ data: [] })),
        ]);
        setComplaints(compRes.data || []);
        setNotices(notRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ marginBottom: spacing[6] }}>
        <h2 style={{ fontSize: typography.fontSizes['3xl'], color: colors.text.primary, margin: 0, fontWeight: typography.fontWeights.bold }}>
          Welcome, {user?.name} 👋
        </h2>
        <p style={{ color: colors.text.secondary, fontSize: typography.fontSizes.sm, marginTop: spacing[1] }}>
          Resident portal overview
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[5] }}>
        {/* Recent Notices */}
        <Card
          title="Latest Notices"
          headerAction={
            <Link to="/resident/notices" style={{ fontSize: typography.fontSizes.sm, color: colors.primary[600], textDecoration: 'none', fontWeight: typography.fontWeights.semibold }}>
              View All
            </Link>
          }
        >
          {loading ? (
            <div style={{ color: colors.text.muted, fontSize: typography.fontSizes.sm }}>Loading...</div>
          ) : notices.length === 0 ? (
            <div style={{ color: colors.text.muted, fontSize: typography.fontSizes.sm }}>No notices right now.</div>
          ) : (
            notices.slice(0, 3).map((n) => (
              <div key={n._id} style={{ borderBottom: `1px solid ${colors.border.light}`, paddingBottom: spacing[3], marginBottom: spacing[3] }}>
                <div style={{ fontWeight: typography.fontWeights.semibold, fontSize: typography.fontSizes.md, color: colors.text.primary }}>{n.title}</div>
                <div style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted, marginTop: spacing[1] }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </Card>

        {/* My Open Complaints */}
        <Card
          title="My Complaints"
          headerAction={
            <Link to="/resident/complaints" style={{ fontSize: typography.fontSizes.sm, color: colors.primary[600], textDecoration: 'none', fontWeight: typography.fontWeights.semibold }}>
              Manage
            </Link>
          }
        >
          {loading ? (
            <div style={{ color: colors.text.muted, fontSize: typography.fontSizes.sm }}>Loading...</div>
          ) : complaints.length === 0 ? (
            <div style={{ color: colors.text.muted, fontSize: typography.fontSizes.sm }}>No active complaints.</div>
          ) : (
            complaints.slice(0, 3).map((c) => (
              <div key={c._id} style={{ borderBottom: `1px solid ${colors.border.light}`, paddingBottom: spacing[3], marginBottom: spacing[3] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: typography.fontWeights.semibold, fontSize: typography.fontSizes.md, color: colors.text.primary }}>{c.title}</span>
                  <Badge type="complaint" status={c.status} />
                </div>
                <div style={{ fontSize: typography.fontSizes.xs, color: colors.text.muted, marginTop: spacing[1] }}>
                  {c.category} • {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResidentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // NOTE: Resident has NO Payments route — payments are owner-only
  const navItems = [
    { label: 'Home', path: '/resident', icon: '🏠' },
    { label: 'Visitors', path: '/resident/visitors', icon: '🚪' },
    { label: 'Facilities', path: '/resident/facilities', icon: '🏋️' },
    { label: 'Events', path: '/resident/events', icon: '🎉' },
    { label: 'Notices', path: '/resident/notices', icon: '📢' },
    { label: 'Complaints', path: '/resident/complaints', icon: '📋' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background.main, fontFamily: typography.fontFamily }}>
      <Sidebar role="resident" user={user} navItems={navItems} onLogout={handleLogout} />
      <div style={{ flex: 1, padding: spacing[8], overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<ResidentOverview />} />
          <Route path="/visitors" element={<ResidentVisitors />} />
          <Route path="/facilities" element={<ResidentFacilities />} />
          <Route path="/events" element={<ResidentEvents />} />
          <Route path="/notices" element={<ResidentNotices />} />
          <Route path="/complaints" element={<ResidentComplaints />} />
        </Routes>
      </div>
    </div>
  );
}
