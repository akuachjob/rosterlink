export function isEligibleForShift(worker, shift) {
  // Worker must have an active or expiring_soon license
  if (worker.license_status === 'expired') {
    return false;
  }

  // Worker's role must match what the shift needs
  // For MVP, we assume all nurses match 'nurse' shifts
  // This will expand when worker roles are added
  if (shift.role_needed === 'nurse' && worker.license_number.startsWith('NCK')) {
    return true;
  }

  return false;
}