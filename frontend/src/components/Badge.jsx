import React from 'react';
import { statusColors, typography, spacing, radii, colors } from '../styles/tokens';

export default function Badge({
  type = 'custom',
  status,
  label,
  variant, // 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  style = {},
  ...props
}) {
  let mapped = null;
  if (type && statusColors[type] && statusColors[type][status]) {
    mapped = statusColors[type][status];
  } else {
    // Search across all status maps if type isn't specified
    for (const category of Object.values(statusColors)) {
      if (category[status]) {
        mapped = category[status];
        break;
      }
    }
  }

  // Variant override or fallback
  const variantMap = {
    success: { bg: colors.success[100], color: colors.success[800], border: colors.success[200] },
    warning: { bg: colors.warning[100], color: colors.warning[800], border: colors.warning[200] },
    danger: { bg: colors.danger[100], color: colors.danger[800], border: colors.danger[200] },
    info: { bg: colors.secondary[100], color: colors.secondary[800], border: colors.secondary[200] },
    neutral: { bg: colors.neutral[100], color: colors.neutral[700], border: colors.neutral[200] },
  };

  const badgeTheme = mapped || variantMap[variant] || {
    bg: colors.neutral[100],
    color: colors.neutral[700],
    border: colors.neutral[200],
    label: status ? String(status).replace(/_/g, ' ') : 'Unknown',
  };

  const displayLabel = label || mapped?.label || (status ? String(status).replace(/_/g, ' ') : '');

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing[1]} ${spacing[3]}`,
    borderRadius: radii.full,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamily,
    backgroundColor: badgeTheme.bg,
    color: badgeTheme.color,
    border: `1px solid ${badgeTheme.border}`,
    textTransform: 'capitalize',
    lineHeight: typography.lineHeights.none,
    whiteSpace: 'nowrap',
    ...style,
  };

  return (
    <span style={badgeStyle} {...props}>
      {displayLabel}
    </span>
  );
}
