import { client } from './client';

export async function getMaintenanceRequests() {
  return await client.get('/maintenance-requests');
}

export async function createMaintenanceRequest(data) {
  return await client.post('/maintenance-requests', data);
}

export async function approveMaintenanceRequest(requestId) {
  return await client.post(`/maintenance-requests/${requestId}/approve`, {});
}

export async function rejectMaintenanceRequest(requestId) {
  return await client.post(`/maintenance-requests/${requestId}/reject`, {});
}

export async function assignTechnician(requestId, technicianName) {
  return await client.post(`/maintenance-requests/${requestId}/assign-technician`, { technicianName });
}

export async function resolveMaintenanceRequest(requestId, data) {
  return await client.post(`/maintenance-requests/${requestId}/resolve`, data);
}
