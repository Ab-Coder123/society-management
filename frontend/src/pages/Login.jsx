import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, radii, shadows } from '../styles/tokens';
import Input from '../components/Input';
import Button from '../components/Button';

const roleToPath = {
  super_admin: '/super-admin',
  society_admin: '/society-admin',
  owner: '/owner',
  resident: '/resident',
  security_guard: '/security',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleToPath[user.role] || '/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.sidebar,
    padding: spacing[6],
    fontFamily: typography.fontFamily,
  };

  const cardStyle = {
    backgroundColor: colors.background.surface,
    borderRadius: radii.xl,
    padding: `${spacing[10]} ${spacing[8]}`,
    width: '100%',
    maxWidth: '420px',
    boxShadow: shadows.xl,
    border: `1px solid ${colors.border.light}`,
  };

  const brandRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[8],
  };

  const logoCircleStyle = {
    width: '48px',
    height: '48px',
    borderRadius: radii.lg,
    backgroundColor: colors.primary[600],
    color: colors.text.inverse,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.fontSizes['2xl'],
    flexShrink: 0,
  };

  const brandNameStyle = {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    margin: 0,
    lineHeight: typography.lineHeights.tight,
  };

  const brandSubStyle = {
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    margin: 0,
  };

  const headingStyle = {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    margin: `0 0 ${spacing[1]} 0`,
  };

  const subheadingStyle = {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    margin: `0 0 ${spacing[6]} 0`,
  };

  const errorBoxStyle = {
    backgroundColor: colors.danger[50],
    border: `1px solid ${colors.danger[200]}`,
    color: colors.danger[700],
    borderRadius: radii.md,
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing[5],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const footerStyle = {
    textAlign: 'center',
    fontSize: typography.fontSizes.xs,
    color: colors.text.muted,
    marginTop: spacing[8],
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={brandRowStyle}>
          <div style={logoCircleStyle}>🏘️</div>
          <div>
            <h1 style={brandNameStyle}>SocietyMS</h1>
            <p style={brandSubStyle}>Society Management System</p>
          </div>
        </div>

        <h2 style={headingStyle}>Welcome back</h2>
        <p style={subheadingStyle}>Sign in to your account to continue</p>

        {error && (
          <div style={errorBoxStyle}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} style={{ marginTop: spacing[2] }}>
            Sign in
          </Button>
        </form>

        <p style={footerStyle}>Multi-tenant · Role-based · Secure</p>
      </div>
    </div>
  );
}
