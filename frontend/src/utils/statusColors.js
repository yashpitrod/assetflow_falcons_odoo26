// Status → color mapping. Single source of truth used by StatusPill and anywhere
// status-based coloring is needed. Colors reference the design system tokens.

import {
  AssetStatus, AllocationStatus, TransferStatus,
  BookingStatus, MaintenanceStatus, AuditCycleStatus,
  VerificationStatus, MaintenancePriority,
} from './constants';

// Maps a status string to a Tailwind-compatible color key
const STATUS_COLOR_MAP = {
  // Asset statuses
  [AssetStatus.Available]: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', border: 'rgba(34,197,94,0.3)' },
  [AssetStatus.Allocated]: { bg: 'rgba(99,102,241,0.15)', text: '#818CF8', border: 'rgba(99,102,241,0.3)' },
  [AssetStatus.Reserved]: { bg: 'rgba(250,204,21,0.15)', text: '#FACC15', border: 'rgba(250,204,21,0.3)' },
  [AssetStatus.UnderMaintenance]: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
  [AssetStatus.Lost]: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', border: 'rgba(239,68,68,0.3)' },
  [AssetStatus.Retired]: { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF', border: 'rgba(107,114,128,0.3)' },
  [AssetStatus.Disposed]: { bg: 'rgba(75,85,99,0.15)', text: '#6B7280', border: 'rgba(75,85,99,0.3)' },

  // Allocation
  [AllocationStatus.Active]: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', border: 'rgba(34,197,94,0.3)' },
  [AllocationStatus.Returned]: { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF', border: 'rgba(107,114,128,0.3)' },

  // Transfer
  [TransferStatus.Requested]: { bg: 'rgba(250,204,21,0.15)', text: '#FACC15', border: 'rgba(250,204,21,0.3)' },
  [TransferStatus.Approved]: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', border: 'rgba(34,197,94,0.3)' },
  [TransferStatus.Rejected]: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', border: 'rgba(239,68,68,0.3)' },
  [TransferStatus.Reallocated]: { bg: 'rgba(99,102,241,0.15)', text: '#818CF8', border: 'rgba(99,102,241,0.3)' },

  // Booking
  [BookingStatus.Upcoming]: { bg: 'rgba(99,102,241,0.15)', text: '#818CF8', border: 'rgba(99,102,241,0.3)' },
  [BookingStatus.Ongoing]: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', border: 'rgba(34,197,94,0.3)' },
  [BookingStatus.Completed]: { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF', border: 'rgba(107,114,128,0.3)' },
  [BookingStatus.Cancelled]: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', border: 'rgba(239,68,68,0.3)' },

  // Maintenance
  [MaintenanceStatus.Pending]: { bg: 'rgba(250,204,21,0.15)', text: '#FACC15', border: 'rgba(250,204,21,0.3)' },
  // Approved reuses the same key as TransferStatus.Approved — works fine since same color
  [MaintenanceStatus.TechnicianAssigned]: { bg: 'rgba(99,102,241,0.15)', text: '#818CF8', border: 'rgba(99,102,241,0.3)' },
  [MaintenanceStatus.InProgress]: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
  [MaintenanceStatus.Resolved]: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', border: 'rgba(34,197,94,0.3)' },

  // Audit
  [AuditCycleStatus.Open]: { bg: 'rgba(250,204,21,0.15)', text: '#FACC15', border: 'rgba(250,204,21,0.3)' },
  [AuditCycleStatus.Closed]: { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF', border: 'rgba(107,114,128,0.3)' },

  // Verification
  [VerificationStatus.Verified]: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', border: 'rgba(34,197,94,0.3)' },
  [VerificationStatus.Missing]: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', border: 'rgba(239,68,68,0.3)' },
  [VerificationStatus.Damaged]: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)' },

  // Priority (used in maintenance kanban cards)
  [MaintenancePriority.Low]: { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF', border: 'rgba(107,114,128,0.3)' },
  [MaintenancePriority.Medium]: { bg: 'rgba(67,56,202,0.15)', text: '#818CF8', border: 'rgba(67,56,202,0.3)' },
  [MaintenancePriority.High]: { bg: 'rgba(192,38,211,0.15)', text: '#C026D3', border: 'rgba(192,38,211,0.3)' },

  // Generic statuses for Department/Employee
  Active: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', border: 'rgba(34,197,94,0.3)' },
  Inactive: { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF', border: 'rgba(107,114,128,0.3)' },
};

// Returns color object for any status string, with a safe fallback
export function getStatusColor(status) {
  return STATUS_COLOR_MAP[status] || { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF', border: 'rgba(107,114,128,0.3)' };
}

export default STATUS_COLOR_MAP;
