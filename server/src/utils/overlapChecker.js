// src/utils/overlapChecker.js

/**
 * Validates booking slots mathematically to ensure back-to-back bookings (e.g., 9-10 and 10-11) do not trigger false conflicts.
 * @param {Date|string} newStart
 * @param {Date|string} newEnd
 * @param {Date|string} existingStart
 * @param {Date|string} existingEnd
 * @returns {boolean} - true if overlaps, false if safe
 */
export const isOverlapping = (newStart, newEnd, existingStart, existingEnd) => {
  const nStart = new Date(newStart).getTime();
  const nEnd = new Date(newEnd).getTime();
  const eStart = new Date(existingStart).getTime();
  const eEnd = new Date(existingEnd).getTime();

  // Strict inequality (< and >) guarantees that if one slot ends exactly when another begins, it is NOT flagged as an overlap
  return nStart < eEnd && nEnd > eStart;
};