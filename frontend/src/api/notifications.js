import { client } from './client';

export async function getNotifications(filter = 'all') {
  const query = filter !== 'all' ? `?filter=${filter}` : '';
  return await client.get(`/notifications${query}`);
}

export async function markNotificationRead(id) {
  return await client.patch(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead() {
  return await client.patch('/notifications/read-all', {});
}

// Paginated activity logs — backend may ignore page/limit initially, but we send them
export async function getActivityLogs({ page = 1, limit = 20 } = {}) {
  return await client.get(`/activity-logs?page=${page}&limit=${limit}`);
}
