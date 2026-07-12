import { client } from './client';

export async function getAllocations() {
  return await client.get('/allocations');
}

export async function allocateAsset(data) {
  return await client.post('/allocations', data);
}

export async function returnAsset(allocationId, data) {
  return await client.post(`/allocations/${allocationId}/return`, data);
}

export async function getTransferRequests() {
  return await client.get('/transfer-requests');
}

export async function createTransferRequest(data) {
  return await client.post('/transfer-requests', data);
}

export async function approveTransfer(requestId) {
  return await client.post(`/transfer-requests/${requestId}/approve`, {});
}

export async function rejectTransfer(requestId) {
  return await client.post(`/transfer-requests/${requestId}/reject`, {});
}
