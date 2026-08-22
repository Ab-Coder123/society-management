import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { colors, typography, spacing, radii } from '../styles/tokens';

export default function NavItem({ label, path, icon }) {
  const location = useLocation();
  const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path) && path !== '/society-admin' && path !== '/owner' && path !== '/resident' && path !== '/super-admin' && path !== '/security');

  // Exact match for root section paths
  const isExactActive = location.pathname === path;

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: radii.md,
    color: isExactActive ? colors.text.inverse : colors.neutral[400],
    backgroundColor: isExactActive ? colors.background.sidebarHover : 'transparent',
    textDecoration: 'none',
    fontSize: typography.fontSizes.sm,
    fontWeight: isExactActive ? typography.fontWeights.semibold : typography.fontWeights.normal,
    fontFamily: typography.fontFamily,
    transition: 'all 0.15s ease-in-out',
  };

  return (
    <Link to={path} style={itemStyle}>
      {icon && <span style={{ fontSize: typography.fontSizes.md }}>{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}
