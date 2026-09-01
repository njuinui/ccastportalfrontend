/**
 * src/components/ui/fomatter.js
 * Format a number as XAF currency
 */
export function xaf(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Extract initials from a name string
 */
export function initials(name = '') {
  if (!name) return '?';
  const parts = name.replace(/\s+/g, ' ').trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}