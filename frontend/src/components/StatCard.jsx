import React from 'react';
import Card from './Card';
import { colors, typography, spacing } from '../styles/tokens';

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  style = {},
}) {
  const colorMap = {
    primary: colors.primary[600],
    secondary: colors.secondary[600],
    success: colors.success[600],
    warning: colors.warning[600],
    danger: colors.danger[600],
  };

  const accentColor = colorMap[color] || colors.primary[600];

  return (
    <Card style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </div>
          <div style={{ fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: accentColor, marginTop: spacing[1] }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: typography.fontSizes.xs, color: colors.text.secondary, marginTop: spacing[1] }}>
              {subtitle}
            </div>
          )}
        </div>
        {icon && (
          <div style={{ fontSize: typography.fontSizes['2xl'], opacity: 0.85 }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
