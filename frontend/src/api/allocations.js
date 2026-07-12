import { client } from './client';
import { unwrapData, normalizeAllocations, normalizeTransfers } from '../utils/apiMappers';

export async function getAllocations() {
  const data = unwrapData(await client.get('/allocations'));
  return normalizeAllocations(Array.isArray(data) ? data : []);
}

export async function allocateAsset(data) {
  return unwrapData(await client.post('/allocations', data));
}

export async function returnAsset(allocationId, data) {
  return unwrapData(await client.post(`/allocations/${allocationId}/return`, data));
}

export async function getTransferRequests() {
  const data = unwrapData(await client.get('/transfer-requests'));
  return normalizeTransfers(Array.isArray(data) ? data : []);
}

export async function createTransferRequest(data) {
  return unwrapData(await client.post('/transfer-requests', data));
}

export async function approveTransfer(requestId) {
  return unwrapData(await client.post(`/transfer-requests/${requestId}/approve`, {}));
}

export async function rejectTransfer(requestId) {
  return unwrapData(await client.post(`/transfer-requests/${requestId}/reject`, {}));
}
