export const COMPLAINT_STATUSES = {
  RAISED: 'raised',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const ALLOWED_TRANSITIONS = {
  [COMPLAINT_STATUSES.RAISED]: [COMPLAINT_STATUSES.ASSIGNED],
  [COMPLAINT_STATUSES.ASSIGNED]: [COMPLAINT_STATUSES.IN_PROGRESS],
  [COMPLAINT_STATUSES.IN_PROGRESS]: [COMPLAINT_STATUSES.RESOLVED],
  [COMPLAINT_STATUSES.RESOLVED]: [COMPLAINT_STATUSES.CLOSED],
  [COMPLAINT_STATUSES.CLOSED]: [],
};

export function getAllowedNextStates(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

export function canTransition(currentStatus, nextStatus) {
  const allowed = getAllowedNextStates(currentStatus);
  return allowed.includes(nextStatus);
}

export function validateTransition(currentStatus, nextStatus) {
  if (!canTransition(currentStatus, nextStatus)) {
    const validStates = getAllowedNextStates(currentStatus);
    const validList = validStates.length > 0 ? validStates.join(', ') : 'none (terminal state)';
    throw new Error(
      `Invalid status transition from "${currentStatus}" to "${nextStatus}". Allowed next status: [${validList}]`
    );
  }
}
