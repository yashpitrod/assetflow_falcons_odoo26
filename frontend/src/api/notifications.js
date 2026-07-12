import { client } from './client';
import { unwrapData, normalizeActivityLogs } from '../utils/apiMappers';

export async function getNotifications(filter = 'all') {
  const query = filter !== 'all' ? `?filter=${filter}` : '';
  const data = unwrapData(await client.get(`/notifications${query}`));
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(id) {
  return unwrapData(await client.patch(`/notifications/${id}/read`, {}));
}

export async function markAllNotificationsRead() {
  return unwrapData(await client.patch('/notifications/read-all', {}));
}

export async function getActivityLogs({ page = 1, limit = 20 } = {}) {
  const data = unwrapData(await client.get(`/activity-logs?page=${page}&limit=${limit}`));
  return normalizeActivityLogs(Array.isArray(data) ? data : []);
}
