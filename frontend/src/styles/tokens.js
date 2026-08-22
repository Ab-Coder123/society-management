/**
 * Design Tokens for Society Management System
 * Standardized spacing (4px/8px grid), color palettes, typography, radii, shadows, and status maps.
 */

export const colors = {
  // Primary (Deep Indigo / Professional Blue)
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // Secondary (Sleek Slate / Cyan Accent)
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Success (Emerald Green)
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Warning (Warm Amber)
  warning: {
    50: '#fffbebf',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Danger (Rose / Crimson Red)
  danger: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },

  // Neutral Grays (Slate)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Base background & surface tokens
  background: {
    main: '#f8fafc',
    surface: '#ffffff',
    subtle: '#f1f5f9',
    overlay: 'rgba(15, 23, 42, 0.5)',
    sidebar: '#0f172a',
    sidebarHover: '#1e293b',
  },

  // Text tokens
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    inverse: '#ffffff',
    link: '#4f46e5',
  },

  // Border tokens
  border: {
    light: '#f1f5f9',
    default: '#e2e8f0',
    dark: '#cbd5e1',
    focus: '#6366f1',
  },
};

export const typography = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSizes: {
    xs: '12px',
    sm: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
  },
};

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

export const radii = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

/**
 * Standardized status mappings for Complaint, Payment, Visitor, and Booking workflows.
 */
export const statusColors = {
  complaint: {
    raised: { bg: colors.warning[100], color: colors.warning[800], border: colors.warning[200], label: 'Raised' },
    assigned: { bg: colors.secondary[100], color: colors.secondary[800], border: colors.secondary[200], label: 'Assigned' },
    in_progress: { bg: colors.primary[100], color: colors.primary[800], border: colors.primary[200], label: 'In Progress' },
    resolved: { bg: colors.success[100], color: colors.success[800], border: colors.success[200], label: 'Resolved' },
    closed: { bg: colors.neutral[100], color: colors.neutral[700], border: colors.neutral[200], label: 'Closed' },
  },
  payment: {
    pending: { bg: colors.warning[100], color: colors.warning[800], border: colors.warning[200], label: 'Pending' },
    paid: { bg: colors.success[100], color: colors.success[800], border: colors.success[200], label: 'Paid' },
    overdue: { bg: colors.danger[100], color: colors.danger[800], border: colors.danger[200], label: 'Overdue' },
  },
  visitor: {
    pending: { bg: colors.warning[100], color: colors.warning[800], border: colors.warning[200], label: 'Pending' },
    approved: { bg: colors.success[100], color: colors.success[800], border: colors.success[200], label: 'Approved' },
    checked_in: { bg: colors.secondary[100], color: colors.secondary[800], border: colors.secondary[200], label: 'Checked In' },
    checked_out: { bg: colors.neutral[100], color: colors.neutral[700], border: colors.neutral[200], label: 'Checked Out' },
    rejected: { bg: colors.danger[100], color: colors.danger[800], border: colors.danger[200], label: 'Rejected' },
  },
  booking: {
    pending: { bg: colors.warning[100], color: colors.warning[800], border: colors.warning[200], label: 'Pending' },
    approved: { bg: colors.success[100], color: colors.success[800], border: colors.success[200], label: 'Approved' },
    rejected: { bg: colors.danger[100], color: colors.danger[800], border: colors.danger[200], label: 'Rejected' },
    cancelled: { bg: colors.neutral[100], color: colors.neutral[700], border: colors.neutral[200], label: 'Cancelled' },
  },
};

export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  statusColors,
};

export default tokens;
