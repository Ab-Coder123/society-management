import React from 'react';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';
import { colors, typography, spacing } from '../styles/tokens';

export default function NoticeCard({ notice, onEdit, onDelete, canManage }) {
  const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();

  return (
    <Card
      style={{
        marginBottom: spacing[4],
        opacity: isExpired ? 0.7 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: spacing[3],
          marginBottom: spacing[2],
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
            <Badge label={notice.category} variant="info" />
            {isExpired && <Badge label="Expired" variant="neutral" />}
          </div>
          <h4 style={{ margin: 0, fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.semibold, color: colors.text.primary }}>
            {notice.title}
          </h4>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: spacing[2] }}>
            {onEdit && (
              <Button size="sm" variant="secondary" onClick={() => onEdit(notice)}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="danger" onClick={() => onDelete(notice._id)}>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <p
        style={{
          color: colors.text.secondary,
          fontSize: typography.fontSizes.md,
          lineHeight: typography.lineHeights.relaxed,
          margin: `${spacing[3]} 0`,
          whiteSpace: 'pre-line',
          fontFamily: typography.fontFamily,
        }}
      >
        {notice.body}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: typography.fontSizes.xs,
          color: colors.text.muted,
          borderTop: `1px solid ${colors.border.light}`,
          paddingTop: spacing[3],
          marginTop: spacing[3],
          fontFamily: typography.fontFamily,
        }}
      >
        <span>
          Posted by: <strong style={{ color: colors.text.primary }}>{notice.createdBy?.name || 'Admin'}</strong>
        </span>
        <div style={{ display: 'flex', gap: spacing[4] }}>
          <span>
            {new Date(notice.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          {notice.expiresAt && (
            <span>
              Expires:{' '}
              {new Date(notice.expiresAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
