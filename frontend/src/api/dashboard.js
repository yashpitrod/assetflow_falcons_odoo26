import { client } from './client';

export async function getDashboardKpis() {
  return await client.get('/dashboard/kpis');
}

export async function getRecentActivity() {
  return await client.get('/activity-logs'); // Architecture.md has /activity-logs
}

export async function getOverdueReturns() {
  return await client.get('/dashboard/overdue-returns');
}
