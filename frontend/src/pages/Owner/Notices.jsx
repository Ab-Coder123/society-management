import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import NoticeCard from '../../components/NoticeCard';
import Button from '../../components/Button';
import { colors, typography, spacing } from '../../styles/tokens';

const CATEGORIES = ['all', 'maintenance', 'meeting', 'utility', 'emergency', 'holiday', 'general'];

export default function OwnerNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  async function fetchNotices() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const res = await api.get('/notices', { params });
      setNotices(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotices();
  }, [categoryFilter]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: typography.fontFamily }}>
      <div style={{ marginBottom: spacing[6] }}>
        <h1 style={{ margin: 0, fontSize: typography.fontSizes['3xl'], color: colors.text.primary, fontWeight: typography.fontWeights.bold }}>
          Community Notices
        </h1>
        <p style={{ margin: `${spacing[1]} 0 0 0`, color: colors.text.secondary, fontSize: typography.fontSizes.sm }}>
          Stay updated with important announcements and community alerts
        </p>
      </div>

      <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', marginBottom: spacing[5], borderBottom: `1px solid ${colors.border.default}`, paddingBottom: spacing[3] }}>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setCategoryFilter(cat)}
            style={{ textTransform: 'capitalize' }}
          >
            {cat}
          </Button>
        ))}
      </div>

      {error && (
        <div style={{ padding: spacing[3], backgroundColor: colors.danger[50], color: colors.danger[700], borderRadius: spacing[2], marginBottom: spacing[4] }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing[10], color: colors.text.muted }}>Loading notices...</div>
      ) : notices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: spacing[12], backgroundColor: colors.background.subtle, borderRadius: spacing[3], border: `1px dashed ${colors.border.dark}` }}>
          <p style={{ margin: 0, color: colors.text.muted, fontSize: typography.fontSizes.md }}>No announcements at this time.</p>
        </div>
      ) : (
        notices.map((notice) => (
          <NoticeCard key={notice._id} notice={notice} canManage={false} />
        ))
      )}
    </div>
  );
}
