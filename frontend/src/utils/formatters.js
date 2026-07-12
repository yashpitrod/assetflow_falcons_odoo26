// Formatting utilities for display values across the app

// Formats a date string or Date to a readable short format
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Formats a date to include time for timestamps (activity logs, notifications)
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Returns relative time string like "2 hours ago" for notification timestamps
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// Formats a number as currency (USD)
export function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// Formats large numbers with commas
export function formatNumber(num) {
  if (num == null) return '—';
  return new Intl.NumberFormat('en-US').format(num);
}

// Generates an asset tag in the AF-XXXX pattern
export function generateAssetTag(num) {
  return `AF-${String(num).padStart(4, '0')}`;
}

// Truncates text to maxLen characters with ellipsis
export function truncate(text, maxLen = 50) {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen) + '…';
}

// Formats a time range for booking display
export function formatTimeRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const timeOpts = { hour: '2-digit', minute: '2-digit' };
  return `${s.toLocaleTimeString('en-US', timeOpts)} – ${e.toLocaleTimeString('en-US', timeOpts)}`;
}
