import React from 'react';
import { colors, typography, spacing, radii } from '../styles/tokens';

export default function Input({
  label,
  error,
  helperText,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
  fullWidth = true,
  style = {},
  ...props
}) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
    width: fullWidth ? '100%' : 'auto',
    marginBottom: spacing[3],
  };

  const labelStyle = {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily,
  };

  const inputStyle = {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizes.md,
    color: colors.text.primary,
    backgroundColor: disabled ? colors.neutral[100] : colors.background.surface,
    border: `1px solid ${error ? colors.danger[500] : colors.border.default}`,
    borderRadius: radii.md,
    padding: `${spacing[2]} ${spacing[3]}`,
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border-color 0.15s ease-in-out',
    cursor: disabled ? 'not-allowed' : 'text',
    ...style,
  };

  const errorStyle = {
    fontSize: typography.fontSizes.xs,
    color: colors.danger[600],
    fontFamily: typography.fontFamily,
  };

  const helperStyle = {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    fontFamily: typography.fontFamily,
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label style={labelStyle}>
          {label} {required && <span style={{ color: colors.danger[500] }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        style={inputStyle}
        {...props}
      />
      {error && <span style={errorStyle}>{error}</span>}
      {!error && helperText && <span style={helperStyle}>{helperText}</span>}
    </div>
  );
}
