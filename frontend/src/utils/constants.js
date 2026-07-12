// Status enums — copied byte-for-byte from architecture.md sections 5-6.
// Prisma schema (feature/db-schema) uses the same names; no translation layer needed at merge.

export const AssetStatus = {
  Available: 'Available',
  Allocated: 'Allocated',
  Reserved: 'Reserved',
  UnderMaintenance: 'UnderMaintenance',
  Lost: 'Lost',
  Retired: 'Retired',
  Disposed: 'Disposed',
};

export const AssetCondition = {
  New: 'New',
  Good: 'Good',
  Fair: 'Fair',
  Poor: 'Poor',
  Damaged: 'Damaged',
};

export const AllocationStatus = {
  Active: 'Active',
  Returned: 'Returned',
};

export const TransferStatus = {
  Requested: 'Requested',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Reallocated: 'Reallocated',
};

export const BookingStatus = {
  Upcoming: 'Upcoming',
  Ongoing: 'Ongoing',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
};

export const MaintenanceStatus = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
  TechnicianAssigned: 'TechnicianAssigned',
  InProgress: 'InProgress',
  Resolved: 'Resolved',
};

export const AuditCycleStatus = {
  Open: 'Open',
  Closed: 'Closed',
};

export const VerificationStatus = {
  Verified: 'Verified',
  Missing: 'Missing',
  Damaged: 'Damaged',
};

export const EmployeeRole = {
  Admin: 'Admin',
  AssetManager: 'AssetManager',
  DepartmentHead: 'DepartmentHead',
  Employee: 'Employee',
};

export const MaintenancePriority = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
};

export const NotificationType = {
  AssetAssigned: 'AssetAssigned',
  MaintenanceApproved: 'MaintenanceApproved',
  MaintenanceRejected: 'MaintenanceRejected',
  BookingConfirmed: 'BookingConfirmed',
  BookingCancelled: 'BookingCancelled',
  BookingReminder: 'BookingReminder',
  TransferApproved: 'TransferApproved',
  OverdueReturn: 'OverdueReturn',
  AuditDiscrepancy: 'AuditDiscrepancy',
};

// Sidebar nav items — RBAC-filtered by role
export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: null },
  { path: '/org-setup', label: 'Organization', icon: 'Building2', roles: ['Admin'] },
  { path: '/assets', label: 'Assets', icon: 'Package', roles: null },
  { path: '/allocation', label: 'Allocation', icon: 'ArrowLeftRight', roles: null },
  { path: '/booking', label: 'Booking', icon: 'CalendarClock', roles: null },
  { path: '/maintenance', label: 'Maintenance', icon: 'Wrench', roles: null },
  { path: '/audit', label: 'Audit', icon: 'ClipboardCheck', roles: ['Admin', 'AssetManager'] },
  { path: '/reports', label: 'Reports', icon: 'BarChart3', roles: ['Admin', 'AssetManager'] },
  { path: '/notifications', label: 'Activity', icon: 'Bell', roles: null },
];
