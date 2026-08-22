import React, { useState } from 'react';
import api from '../../api/client';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { colors, typography, spacing } from '../../styles/tokens';

export default function VehicleVerify() {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    if (!vehicleNumber.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.get('/parking/verify-vehicle', {
        params: { vehicleNumber: vehicleNumber.trim() },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify vehicle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '640px', fontFamily: typography.fontFamily }}>
      <div style={{ marginBottom: spacing[6] }}>
        <h2 style={{ fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary, margin: 0 }}>
          Vehicle Gate Clearance
        </h2>
        <p style={{ color: colors.text.secondary, fontSize: typography.fontSizes.sm, marginTop: spacing[1] }}>
          Verify vehicle plate number against approved visitor entries
        </p>
      </div>

      <Card style={{ marginBottom: spacing[6] }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: spacing[3], alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Vehicle Plate Number"
              placeholder="e.g. CAI-9876"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" loading={loading}>
            Search Plate
          </Button>
        </form>
      </Card>

      {error && (
        <div style={{ color: colors.danger[700], backgroundColor: colors.danger[50], padding: spacing[4], borderRadius: spacing[2], marginBottom: spacing[6] }}>
          {error}
        </div>
      )}

      {result && (
        <Card title={result.found ? 'Clearance Verified ✓' : 'Clearance Not Found ❌'}>
          {result.found ? (
            <div>
              <div style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.success[700], marginBottom: spacing[2] }}>
                Valid Clearance Registered
              </div>
              <div style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary, display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                <div><strong>Vehicle Reg:</strong> {result.vehicleNumber || vehicleNumber}</div>
                <div><strong>Owner / Visitor:</strong> {result.ownerName || result.visitorName || 'Registered Resident'}</div>
                <div><strong>Destination Flat:</strong> {result.flatNumber ? `Flat ${result.flatNumber}` : 'Society Premises'}</div>
                <div><strong>Entry Status:</strong> <Badge variant="success" label="APPROVED FOR GATE ENTRY" /></div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.danger[700], marginBottom: spacing[2] }}>
                No active pass or registered vehicle for "{vehicleNumber}"
              </div>
              <p style={{ fontSize: typography.fontSizes.sm, color: colors.text.secondary }}>
                Please ask the driver for host flat confirmation before granting entry.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
