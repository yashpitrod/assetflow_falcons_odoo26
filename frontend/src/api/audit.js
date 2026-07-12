import { client } from './client';

export async function getAuditCycles() {
  return await client.get('/audit-cycles');
}

export async function createAuditCycle(data) {
  return await client.post('/audit-cycles', data);
}

export async function addAuditors(cycleId, { auditorIds }) {
  return await client.post(`/audit-cycles/${cycleId}/auditors`, { auditorIds });
}

export async function createAuditFinding(data) {
  return await client.post('/audit-findings', data);
}

export async function closeAuditCycle(cycleId) {
  return await client.post(`/audit-cycles/${cycleId}/close`, {});
}
