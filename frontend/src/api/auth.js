import { client } from './client';

export async function login({ email, password }) {
  return await client.post('/auth/login', { email, password });
}

export async function signup({ name, email, password, departmentId }) {
  return await client.post('/auth/signup', { name, email, password, departmentId });
}

export async function forgotPassword({ email }) {
  return await client.post('/auth/forgot-password', { email });
}
