import { client } from './client';
import { unwrapData, normalizeKpis, normalizeActivityLogs, normalizeOverdueReturns } from '../utils/apiMappers';

export async function getDashboardKpis() {
  return normalizeKpis(unwrapData(await client.get('/dashboard/kpis')));
}

export async function getRecentActivity() {
  const data = unwrapData(await client.get('/activity-logs'));
  return normalizeActivityLogs(Array.isArray(data) ? data : []);
}

export async function getOverdueReturns() {
  const data = unwrapData(await client.get('/dashboard/overdue-returns'));
  return normalizeOverdueReturns(Array.isArray(data) ? data : []);
}
