import { client } from './client';
import { unwrapData } from '../utils/apiMappers';

export async function login({ email, password }) {
  return unwrapData(await client.post('/auth/login', { email, password }));
}

export async function signup({ name, email, password }) {
  return unwrapData(await client.post('/auth/signup', { name, email, password }));
}

export async function forgotPassword({ email }) {
  return unwrapData(await client.post('/auth/forgot-password', { email }));
}
