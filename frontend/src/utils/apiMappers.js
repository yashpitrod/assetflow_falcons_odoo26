// Normalizes backend Prisma shapes into the field names the UI expects.
// Backend returns nested relations (e.g. category.name); pages use flat aliases.

export function unwrapData(response) {
  if (response == null) return null;
  if (response.success === false) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data ?? response;
}

export function normalizeAsset(asset) {
  if (!asset) return asset;
  return {
    ...asset,
    categoryName: asset.categoryName ?? asset.category?.name ?? null,
    departmentName: asset.departmentName ?? asset.department?.name ?? null,
  };
}

export function normalizeAssets(assets) {
  return (assets ?? []).map(normalizeAsset);
}

export function normalizeBooking(booking) {
  if (!booking) return booking;
  return {
    ...booking,
    asset: booking.asset ?? booking.resourceAsset ?? null,
    bookedByEmployeeName:
      booking.bookedByEmployeeName ?? booking.bookedByEmployee?.name ?? '—',
  };
}

export function normalizeBookings(bookings) {
  return (bookings ?? []).map(normalizeBooking);
}

export function normalizeTransfer(transfer) {
  if (!transfer) return transfer;
  return {
    ...transfer,
    fromEmployeeName: transfer.fromEmployeeName ?? transfer.fromEmployee?.name ?? '—',
    toEmployeeName: transfer.toEmployeeName ?? transfer.toEmployee?.name ?? '—',
  };
}

export function normalizeTransfers(transfers) {
  return (transfers ?? []).map(normalizeTransfer);
}

export function normalizeAllocation(allocation) {
  if (!allocation) return allocation;
  const expectedReturn = allocation.expectedReturnDate ?? allocation.expected_return_date;
  const isActive = allocation.status === 'Active';
  return {
    ...allocation,
    employeeName: allocation.employeeName ?? allocation.employee?.name ?? '—',
    departmentName: allocation.departmentName ?? allocation.department?.name ?? null,
    allocatedDate: allocation.allocatedDate ?? allocation.allocated_date,
    expectedReturnDate: expectedReturn,
    isOverdue:
      allocation.isOverdue ??
      Boolean(expectedReturn && isActive && new Date(expectedReturn) < new Date()),
  };
}

export function normalizeAllocations(allocations) {
  return (allocations ?? []).map(normalizeAllocation);
}

export function normalizeKpis(raw) {
  const k = raw ?? {};
  return {
    utilizationPercent: Number(k.utilizationPercent ?? k.utilization_percent ?? 0),
    totalAssets: Number(k.totalAssets ?? k.total_assets ?? 0),
    availableAssets: Number(k.availableAssets ?? k.available_assets ?? 0),
    allocatedAssets: Number(k.allocatedAssets ?? k.allocated_assets ?? 0),
    activeBookingsToday: Number(k.activeBookingsToday ?? k.active_bookings_today ?? 0),
    pendingTransfers: Number(k.pendingTransfers ?? k.pending_transfers ?? 0),
    underMaintenance: Number(k.underMaintenance ?? k.under_maintenance ?? 0),
    pendingMaintenance: Number(k.pendingMaintenance ?? k.pending_maintenance ?? 0),
    openAuditCycles: Number(k.openAuditCycles ?? k.open_audit_cycles ?? 0),
    overdueReturns: Number(k.overdueReturns ?? k.overdue_returns ?? 0),
  };
}

export function normalizeActivityLog(log) {
  if (!log) return log;
  return {
    ...log,
    actorName:
      log.actorName ??
      log.actor?.name ??
      log.actorEmployee?.name ??
      'System',
  };
}

export function normalizeActivityLogs(logs) {
  return (logs ?? []).map(normalizeActivityLog);
}

export function normalizeOverdueReturn(item) {
  if (!item) return item;
  return {
    ...item,
    employeeName: item.employeeName ?? item.employee?.name ?? '—',
    expectedReturnDate: item.expectedReturnDate ?? item.expected_return_date,
    daysOverdue: item.daysOverdue ?? item.days_overdue ?? 0,
  };
}

export function normalizeOverdueReturns(items) {
  return (items ?? []).map(normalizeOverdueReturn);
}
