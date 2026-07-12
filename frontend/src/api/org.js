import { client } from './client';
import { unwrapData } from '../utils/apiMappers';

// Org routes are mounted at /api/org on the Express server
export async function getDepartments() {
  return unwrapData(await client.get('/org/departments'));
}

export async function createDepartment(data) {
  return unwrapData(await client.post('/org/departments', data));
}

export async function updateDepartment(id, data) {
  return unwrapData(await client.put(`/org/departments/${id}`, data));
}

export async function getCategories() {
  return unwrapData(await client.get('/org/categories'));
}

export async function createCategory(data) {
  const payload = {
    name: data.name,
    ...(data.warrantyPeriod != null && data.warrantyPeriod !== ''
      ? { warranty_period: Number(data.warrantyPeriod) }
      : {}),
  };
  return unwrapData(await client.post('/org/categories', payload));
}

export async function updateCategory(id, data) {
  return unwrapData(await client.put(`/org/categories/${id}`, data));
}

export async function getEmployees() {
  return unwrapData(await client.get('/org/employees'));
}

export async function promoteEmployee(id, { role }) {
  return unwrapData(await client.patch(`/org/employees/${id}/promote`, { role }));
}
