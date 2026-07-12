import { client } from './client';
import { unwrapData } from '../utils/apiMappers';

export async function getMaintenanceRequests() {
  const data = unwrapData(await client.get('/maintenance-requests'));
  return Array.isArray(data) ? data : [];
}

export async function createMaintenanceRequest(data) {
  return unwrapData(await client.post('/maintenance-requests', data));
}

export async function approveMaintenanceRequest(requestId) {
  return unwrapData(await client.post(`/maintenance-requests/${requestId}/approve`, {}));
}

export async function rejectMaintenanceRequest(requestId) {
  return unwrapData(await client.post(`/maintenance-requests/${requestId}/reject`, {}));
}

export async function assignTechnician(requestId, technicianName) {
  return unwrapData(
    await client.post(`/maintenance-requests/${requestId}/assign-technician`, { technicianName })
  );
}

export async function startMaintenanceWork(requestId) {
  return unwrapData(await client.post(`/maintenance-requests/${requestId}/start`, {}));
}

export async function resolveMaintenanceRequest(requestId, data = {}) {
  return unwrapData(await client.post(`/maintenance-requests/${requestId}/resolve`, data));
}
