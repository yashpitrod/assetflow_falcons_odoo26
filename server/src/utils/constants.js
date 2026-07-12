// src/utils/constants.js

export const ROLES = {
  ADMIN: 'Admin',
  ASSET_MANAGER: 'AssetManager',
  DEPARTMENT_HEAD: 'DepartmentHead',
  EMPLOYEE: 'Employee',
};

export const ASSET_STATUS = {
  AVAILABLE: 'Available',
  ALLOCATED: 'Allocated',
  RESERVED: 'Reserved',
  UNDER_MAINTENANCE: 'UnderMaintenance',
  LOST: 'Lost',
  RETIRED: 'Retired',
  DISPOSED: 'Disposed',
};

export const ALLOCATION_STATUS = {
  ACTIVE: 'Active',
  RETURNED: 'Returned',
};

export const TRANSFER_STATUS = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REALLOCATED: 'Reallocated',
};

export const BOOKING_STATUS = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const MAINTENANCE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  TECHNICIAN_ASSIGNED: 'TechnicianAssigned',
  IN_PROGRESS: 'InProgress',
  RESOLVED: 'Resolved',
};

export const NOTIFICATION_TYPES = {
  ASSET_ASSIGNED: 'AssetAssigned',
  MAINTENANCE_APPROVED: 'MaintenanceApproved',
  MAINTENANCE_REJECTED: 'MaintenanceRejected',
  BOOKING_CONFIRMED: 'BookingConfirmed',
  BOOKING_CANCELLED: 'BookingCancelled',
  TRANSFER_APPROVED: 'TransferApproved',
  OVERDUE_RETURN: 'OverdueReturn',
  AUDIT_DISCREPANCY: 'AuditDiscrepancy',
};