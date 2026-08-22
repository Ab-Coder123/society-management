import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function allocate(slot, flatId, vehicleNumber) {
  if (slot.isAllocated) {
    throw new Error(`Slot "${slot.slotNumber}" is already allocated.`);
  }
  return {
    ...slot,
    isAllocated: true,
    allocatedToFlatId: flatId,
    vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase() : null,
  };
}

function deallocate(slot) {
  if (!slot.isAllocated) {
    throw new Error(`Slot "${slot.slotNumber}" is not currently allocated.`);
  }
  return {
    ...slot,
    isAllocated: false,
    allocatedToFlatId: null,
    vehicleNumber: null,
  };
}

describe('Tier 7: Parking Allocation Unit Tests', () => {
  it('1. allocating an unallocated slot sets isAllocated, flatId, and uppercase vehicleNumber', () => {
    const slot = { slotNumber: 'A1', isAllocated: false, allocatedToFlatId: null, vehicleNumber: null };
    const result = allocate(slot, 'flat_123', 'abc 1234');

    assert.equal(result.isAllocated, true);
    assert.equal(result.allocatedToFlatId, 'flat_123');
    assert.equal(result.vehicleNumber, 'ABC 1234');
  });

  it('2. allocating an already-allocated slot throws error', () => {
    const slot = { slotNumber: 'A1', isAllocated: true, allocatedToFlatId: 'flat_123', vehicleNumber: 'ABC' };
    assert.throws(
      () => allocate(slot, 'flat_456', 'XYZ'),
      /already allocated/
    );
  });

  it('3. deallocating clears isAllocated, allocatedToFlatId, and vehicleNumber', () => {
    const slot = { slotNumber: 'A1', isAllocated: true, allocatedToFlatId: 'flat_123', vehicleNumber: 'ABC 1234' };
    const result = deallocate(slot);

    assert.equal(result.isAllocated, false);
    assert.equal(result.allocatedToFlatId, null);
    assert.equal(result.vehicleNumber, null);
  });
});
