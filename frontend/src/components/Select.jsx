import React from 'react';
import { colors, typography, spacing, radii } from '../styles/tokens';

export default function Select({
  label,
  error,
  helperText,
  value,
  onChange,
  options = [], // Array of { value, label } or strings
  required = false,
  disabled = false,
  fullWidth = true,
  placeholder,
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

  const selectStyle = {
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
    cursor: disabled ? 'not-allowed' : 'pointer',
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
      <select
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={selectStyle}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, idx) => {
          const optValue = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={idx} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
      {error && <span style={errorStyle}>{error}</span>}
      {!error && helperText && <span style={helperStyle}>{helperText}</span>}
    </div>
  );
}
