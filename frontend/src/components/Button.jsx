import React from 'react';
import { colors, typography, spacing, radii, shadows } from '../styles/tokens';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  fullWidth = false,
  style = {},
  ...props
}) {
  const variantStyles = {
    primary: {
      backgroundColor: colors.primary[600],
      color: colors.text.inverse,
      border: 'none',
      hoverBg: colors.primary[700],
    },
    secondary: {
      backgroundColor: colors.neutral[100],
      color: colors.neutral[800],
      border: `1px solid ${colors.border.default}`,
      hoverBg: colors.neutral[200],
    },
    success: {
      backgroundColor: colors.success[600],
      color: colors.text.inverse,
      border: 'none',
      hoverBg: colors.success[700],
    },
    danger: {
      backgroundColor: colors.danger[600],
      color: colors.text.inverse,
      border: 'none',
      hoverBg: colors.danger[700],
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.neutral[700],
      border: 'none',
      hoverBg: colors.neutral[100],
    },
  };

  const sizeStyles = {
    sm: {
      padding: `${spacing[1]} ${spacing[3]}`,
      fontSize: typography.fontSizes.xs,
    },
    md: {
      padding: `${spacing[2]} ${spacing[4]}`,
      fontSize: typography.fontSizes.sm,
    },
    lg: {
      padding: `${spacing[3]} ${spacing[5]}`,
      fontSize: typography.fontSizes.md,
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const currentSize = sizeStyles[size] || sizeStyles.md;

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeights.semibold,
    borderRadius: radii.md,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.15s ease-in-out',
    width: fullWidth ? '100%' : 'auto',
    boxShadow: variant === 'ghost' ? shadows.none : shadows.sm,
    ...currentVariant,
    ...currentSize,
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={baseStyle}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacing[2] }}>
          <span>⏳</span>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
