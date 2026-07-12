import { client } from './client';

export async function getAssetBookings(assetId) {
  return await client.get(`/assets/${assetId}/bookings`);
}

export async function getAllBookings() {
  return await client.get('/bookings');
}

export async function createBooking(data) {
  return await client.post('/bookings', data);
}

export async function cancelBooking(bookingId) {
  return await client.post(`/bookings/${bookingId}/cancel`, {});
}
