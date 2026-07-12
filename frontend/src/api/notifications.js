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

export async function getActivityLogs() {
  return await client.get('/activity-logs');
}
