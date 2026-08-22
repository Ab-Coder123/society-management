import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import Table from '../../components/Table';
import { colors, typography, spacing } from '../../styles/tokens';

export default function SocietyAdminParking() {
  const [slots, setSlots] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bulk Create Slots Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({ prefix: 'A', from: 1, to: 10, type: 'car' });
  const [bulkLoading, setBulkLoading] = useState(false);

  // Allocate Modal
  const [allocateSlot, setAllocateSlot] = useState(null);
  const [allocData, setAllocData] = useState({ flatId: '', vehicleNumber: '' });
  const [allocLoading, setAllocLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [slotRes, flatRes] = await Promise.all([
        api.get('/parking/slots').catch(() => ({ data: [] })),
        api.get('/flats').catch(() => ({ data: [] })),
      ]);
      setSlots(Array.isArray(slotRes.data) ? slotRes.data : []);
      setFlats(Array.isArray(flatRes.data) ? flatRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch parking data');
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkCreate(e) {
    e.preventDefault();
    setBulkLoading(true);
    try {
      const res = await api.post('/parking/slots/bulk', bulkData);
      alert(res.data.message || 'Parking slots created');
      setShowBulkModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create slots');
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleAllocateSubmit(e) {
    e.preventDefault();
    if (!allocateSlot || !allocData.flatId) return;

    setAllocLoading(true);
    try {
      await api.patch(`/parking/slots/${allocateSlot._id}/allocate`, allocData);
      setAllocateSlot(null);
      setAllocData({ flatId: '', vehicleNumber: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to allocate slot');
    } finally {
      setAllocLoading(false);
    }
  }

  async function handleDeallocate(slotId) {
    if (!window.confirm('Deallocate this parking slot?')) return;
    try {
      await api.patch(`/parking/slots/${slotId}/deallocate`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Deallocation failed');
    }
  }

  const columns = [
    {
      key: 'slotNumber',
      header: 'Slot Number',
      render: (s) => <span style={{ fontWeight: typography.fontWeights.bold }}>{s.slotNumber}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (s) => <span style={{ textTransform: 'uppercase' }}>{s.type || 'car'}</span>,
    },
    {
      key: 'isAllocated',
      header: 'Status',
      render: (s) => (
        <Badge
          variant={s.isAllocated ? 'warning' : 'success'}
          label={s.isAllocated ? 'Allocated' : 'Available'}
        />
      ),
    },
    {
      key: 'allocatedTo',
      header: 'Assigned Flat',
      render: (s) => (s.allocatedToFlatId ? `${s.allocatedToFlatId.building} - ${s.allocatedToFlatId.flatNumber}` : '—'),
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle Reg No',
      render: (s) => s.vehicleNumber || '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (s) =>
        s.isAllocated ? (
          <Button variant="danger" size="sm" onClick={() => handleDeallocate(s._id)}>
            Deallocate
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setAllocateSlot(s);
              setAllocData({ flatId: '', vehicleNumber: '' });
            }}
          >
            Allocate Flat
          </Button>
        ),
    },
  ];

  return (
    <div style={{ fontFamily: typography.fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h2 style={{ fontSize: typography.fontSizes['3xl'], fontWeight: typography.fontWeights.bold, color: colors.text.primary, margin: 0 }}>
            Parking & Vehicle Management
          </h2>
          <p style={{ color: colors.text.secondary, fontSize: typography.fontSizes.sm, marginTop: spacing[1] }}>
            Allocate parking slots, record resident vehicle numbers, and inspect visitor access
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowBulkModal(true)}>
          + Bulk Add Slots
        </Button>
      </div>

      {error && <div style={{ color: colors.danger[700], padding: spacing[3], backgroundColor: colors.danger[50], borderRadius: spacing[2], marginBottom: spacing[4] }}>{error}</div>}

      <Card title="Parking Slots Directory">
        <Table columns={columns} data={slots} loading={loading} emptyMessage="No parking slots created yet." />
      </Card>

      {/* Bulk Add Slots Modal */}
      {showBulkModal && (
        <Modal title="Bulk Create Parking Slots" onClose={() => setShowBulkModal(false)}>
          <form onSubmit={handleBulkCreate}>
            <Input label="Prefix (e.g. A, P, EV)" value={bulkData.prefix} onChange={(e) => setBulkData({ ...bulkData, prefix: e.target.value })} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
              <Input label="From Number" type="number" value={bulkData.from} onChange={(e) => setBulkData({ ...bulkData, from: Number(e.target.value) })} required min="1" />
              <Input label="To Number" type="number" value={bulkData.to} onChange={(e) => setBulkData({ ...bulkData, to: Number(e.target.value) })} required min="1" />
            </div>
            <Select label="Vehicle Type" value={bulkData.type} onChange={(e) => setBulkData({ ...bulkData, type: e.target.value })} options={[{ value: 'car', label: 'Car' }, { value: 'bike', label: 'Bike' }, { value: 'ev', label: 'EV Station' }]} />
            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end', marginTop: spacing[4] }}>
              <Button type="button" variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={bulkLoading}>Create Slots</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Allocate Slot Modal */}
      {allocateSlot && (
        <Modal title={`Allocate Slot ${allocateSlot.slotNumber}`} onClose={() => setAllocateSlot(null)}>
          <form onSubmit={handleAllocateSubmit}>
            <Select
              label="Assigned Flat *"
              value={allocData.flatId}
              onChange={(e) => setAllocData({ ...allocData, flatId: e.target.value })}
              required
              options={[
                { value: '', label: 'Select Flat...' },
                ...flats.map((f) => ({
                  value: f._id,
                  label: `${f.building} - ${f.flatNumber} ${f.wing ? `(${f.wing})` : ''}`,
                })),
              ]}
            />
            <Input label="Vehicle Registration Number" placeholder="e.g. CAI-9876" value={allocData.vehicleNumber} onChange={(e) => setAllocData({ ...allocData, vehicleNumber: e.target.value })} />
            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end', marginTop: spacing[4] }}>
              <Button type="button" variant="secondary" onClick={() => setAllocateSlot(null)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={allocLoading}>Allocate Slot</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
