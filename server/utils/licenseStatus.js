export function calculateLicenseStatus(expiryDate) {
  const today = new Date();
  const expiry = new Date(expiryDate);

  const daysUntilExpiry = Math.floor(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return 'expired';
  } else if (daysUntilExpiry <= 30) {
    return 'expiring_soon';
  } else {
    return 'active';
  }
}