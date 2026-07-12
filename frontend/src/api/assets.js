import { client } from './client';

export async function getAssets(filters = {}) {
  // Convert filters object into query string
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/assets?${queryString}` : '/assets';
  
  return await client.get(endpoint);
}

export async function getAssetById(id) {
  return await client.get(`/assets/${id}`);
}

export async function createAsset(data) {
  return await client.post('/assets', data);
}

export async function updateAsset(id, data) {
  return await client.put(`/assets/${id}`, data);
}
