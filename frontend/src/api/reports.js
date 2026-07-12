import { client } from './client';
import { unwrapData } from '../utils/apiMappers';

export async function getUtilizationReport() {
  return unwrapData(await client.get('/reports/utilization'));
}

export async function getMaintenanceFrequency() {
  return unwrapData(await client.get('/reports/maintenance-frequency'));
}

export async function getIdleAssets() {
  return unwrapData(await client.get('/reports/idle-assets'));
}

export async function getMostUsedAssets() {
  return unwrapData(await client.get('/reports/most-used-assets'));
}

export async function exportReport(reportType, format = 'csv') {
  return unwrapData(await client.get(`/reports/export?type=${reportType}&format=${format}`));
}
