import { client } from './client';
import { unwrapData, normalizeBookings } from '../utils/apiMappers';

export async function getAssetBookings(assetId) {
  const data = unwrapData(await client.get(`/assets/${assetId}/bookings`));
  return normalizeBookings(Array.isArray(data) ? data : []);
}

export async function getAllBookings() {
  const data = unwrapData(await client.get('/bookings'));
  return normalizeBookings(Array.isArray(data) ? data : []);
}

export async function createBooking(data) {
  return unwrapData(await client.post('/bookings', data));
}

export async function cancelBooking(bookingId) {
  return unwrapData(await client.post(`/bookings/${bookingId}/cancel`, {}));
}
