import { client } from './client';

export async function getUtilizationReport() {
  return await client.get('/reports/utilization');
}

export async function getMaintenanceFrequency() {
  return await client.get('/reports/maintenance-frequency');
}

export async function getIdleAssets() {
  return await client.get('/reports/idle-assets');
}

export async function getMostUsedAssets() {
  return await client.get('/reports/most-used-assets'); // Assuming this endpoint exists based on component usage
}

export async function exportReport(reportType, format = 'csv') {
  return await client.get(`/reports/export?type=${reportType}&format=${format}`);
}
