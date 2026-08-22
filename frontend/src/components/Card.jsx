import React from 'react';
import { colors, radii, shadows, spacing, typography } from '../styles/tokens';

export default function Card({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  padding = 'md',
  style = {},
  ...props
}) {
  const paddingMap = {
    none: '0px',
    sm: spacing[3],
    md: spacing[5],
    lg: spacing[6],
  };

  const cardStyle = {
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border.default}`,
    boxShadow: shadows.sm,
    padding: paddingMap[padding] || spacing[5],
    fontFamily: typography.fontFamily,
    boxSizing: 'border-box',
    ...style,
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  };

  const titleStyle = {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    margin: 0,
  };

  const subtitleStyle = {
    fontSize: typography.fontSizes.sm,
    color: colors.text.muted,
    marginTop: spacing[1],
  };

  const footerStyle = {
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTop: `1px solid ${colors.border.light}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing[2],
  };

  return (
    <div style={cardStyle} {...props}>
      {(title || headerAction) && (
        <div style={headerStyle}>
          <div>
            {title && <h3 style={titleStyle}>{title}</h3>}
            {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div style={footerStyle}>{footer}</div>}
    </div>
  );
}
