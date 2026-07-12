import { client } from './client';

export async function getDepartments() {
  return await client.get('/departments');
}

export async function createDepartment(data) {
  return await client.post('/departments', data);
}

export async function updateDepartment(id, data) {
  return await client.put(`/departments/${id}`, data);
}

export async function getCategories() {
  return await client.get('/categories');
}

export async function createCategory(data) {
  return await client.post('/categories', data);
}

export async function updateCategory(id, data) {
  return await client.put(`/categories/${id}`, data);
}

export async function getEmployees() {
  return await client.get('/employees');
}

export async function promoteEmployee(id, { role }) {
  return await client.patch(`/employees/${id}/promote`, { role });
}
