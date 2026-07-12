import { client } from './client';
import { unwrapData } from '../utils/apiMappers';

export async function getAuditCycles() {
  const data = unwrapData(await client.get('/audit-cycles'));
  return Array.isArray(data) ? data : [];
}

export async function createAuditCycle(data) {
  return unwrapData(await client.post('/audit-cycles', data));
}

export async function addAuditors(cycleId, { auditorIds }) {
  return unwrapData(await client.post(`/audit-cycles/${cycleId}/auditors`, { auditorIds }));
}

export async function createAuditFinding(data) {
  return unwrapData(await client.post('/audit-findings', data));
}

export async function closeAuditCycle(cycleId) {
  return unwrapData(await client.post(`/audit-cycles/${cycleId}/close`, {}));
}
