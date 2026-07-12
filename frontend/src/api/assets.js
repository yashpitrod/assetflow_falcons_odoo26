import { client } from './client';
import { unwrapData, normalizeAssets } from '../utils/apiMappers';

export async function getAssets(filters = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/assets?${queryString}` : '/assets';
  const data = unwrapData(await client.get(endpoint));
  return normalizeAssets(Array.isArray(data) ? data : []);
}

export async function getAssetById(id) {
  return unwrapData(await client.get(`/assets/${id}`));
}

export async function createAsset(data) {
  return unwrapData(await client.post('/assets', data));
}

export async function updateAsset(id, data) {
  return unwrapData(await client.put(`/assets/${id}`, data));
}
