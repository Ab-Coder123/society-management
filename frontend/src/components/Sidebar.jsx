import React from 'react';
import { colors, typography, spacing, radii } from '../styles/tokens';
import NavItem from './NavItem';

const ROLE_CONFIGS = {
  super_admin: {
    title: 'SuperAdmin Portal',
    badgeBg: colors.primary[900],
    badgeColor: colors.primary[200],
    label: 'Platform Admin',
  },
  society_admin: {
    title: 'Society Admin',
    badgeBg: colors.secondary[900],
    badgeColor: colors.secondary[200],
    label: 'Society Manager',
  },
  owner: {
    title: 'Owner Portal',
    badgeBg: colors.success[900],
    badgeColor: colors.success[200],
    label: 'Property Owner',
  },
  resident: {
    title: 'Resident Portal',
    badgeBg: colors.warning[900],
    badgeColor: colors.warning[200],
    label: 'Resident',
  },
  security_guard: {
    title: 'Gate Security',
    badgeBg: colors.danger[900],
    badgeColor: colors.danger[200],
    label: 'Security Guard',
  },
};

export default function Sidebar({
  role = 'society_admin',
  user,
  navItems = [],
  onLogout,
}) {
  const roleConfig = ROLE_CONFIGS[role] || {
    title: 'Dashboard',
    badgeBg: colors.neutral[800],
    badgeColor: colors.neutral[300],
    label: role,
  };

  const sidebarStyle = {
    width: '240px',
    backgroundColor: colors.background.sidebar,
    color: colors.text.inverse,
    padding: `${spacing[6]} ${spacing[4]}`,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: typography.fontFamily,
    boxSizing: 'border-box',
    flexShrink: 0,
  };

  const headerStyle = {
    marginBottom: spacing[6],
  };

  const titleStyle = {
    margin: 0,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.inverse,
  };

  const userStyle = {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[400],
    marginTop: spacing[1],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const badgeStyle = {
    padding: `2px ${spacing[2]}`,
    borderRadius: radii.sm,
    fontSize: '10px',
    fontWeight: typography.fontWeights.semibold,
    backgroundColor: roleConfig.badgeBg,
    color: roleConfig.badgeColor,
    textTransform: 'uppercase',
  };

  const navContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
    flex: 1,
  };

  const logoutButtonStyle = {
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: colors.background.sidebarHover,
    color: colors.danger[400],
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamily,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    transition: 'background-color 0.15s ease-in-out',
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{roleConfig.title}</h2>
        <div style={userStyle}>
          <span>{user?.name || 'User'}</span>
          <span style={badgeStyle}>{roleConfig.label}</span>
        </div>
      </div>

      <nav style={navContainerStyle}>
        {navItems.map((item) => (
          <NavItem key={item.path} label={item.label} path={item.path} icon={item.icon} />
        ))}
      </nav>

      {onLogout && (
        <button onClick={onLogout} style={logoutButtonStyle}>
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      )}
    </div>
  );
}
