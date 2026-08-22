import React from 'react';
import { colors, typography, spacing, radii, shadows } from '../styles/tokens';

export default function ComplaintTimeline({ comments = [] }) {
  if (!comments || comments.length === 0) {
    return (
      <div style={{ color: colors.text.muted, fontSize: typography.fontSizes.sm, fontStyle: 'italic', padding: `${spacing[3]} 0`, fontFamily: typography.fontFamily }}>
        No activity history recorded yet.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: spacing[6], margin: `${spacing[4]} 0`, fontFamily: typography.fontFamily }}>
      <div
        style={{
          position: 'absolute',
          top: '6px',
          bottom: '6px',
          left: '7px',
          width: '2px',
          backgroundColor: colors.border.default,
        }}
      />
      {comments.map((c, idx) => {
        const isSystem = !c.by || c.text?.startsWith('Status changed') || c.text?.startsWith('Complaint raised') || c.text?.startsWith('Complaint reopened');
        return (
          <div key={c._id || idx} style={{ position: 'relative', marginBottom: spacing[4] }}>
            <div
              style={{
                position: 'absolute',
                left: '-24px',
                top: '4px',
                width: '12px',
                height: '12px',
                borderRadius: radii.full,
                backgroundColor: isSystem ? colors.primary[500] : colors.success[500],
                border: `2px solid ${colors.background.surface}`,
                boxShadow: `0 0 0 2px ${colors.border.default}`,
              }}
            />
            <div
              style={{
                backgroundColor: isSystem ? colors.background.subtle : colors.background.surface,
                border: `1px solid ${colors.border.default}`,
                borderRadius: radii.md,
                padding: `${spacing[2]} ${spacing[3]}`,
                fontSize: typography.fontSizes.sm,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: spacing[1],
                  fontSize: typography.fontSizes.xs,
                }}
              >
                <strong style={{ color: colors.text.primary }}>
                  {c.by?.name || (isSystem ? 'System' : 'User')}
                  {c.by?.role && (
                    <span style={{ color: colors.text.muted, fontWeight: typography.fontWeights.normal, marginLeft: spacing[1] }}>
                      ({c.by.role})
                    </span>
                  )}
                </strong>
                <span style={{ color: colors.text.muted }}>
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
              <div style={{ color: colors.text.secondary, lineHeight: typography.lineHeights.normal }}>{c.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
