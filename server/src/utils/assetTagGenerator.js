// src/utils/assetTagGenerator.js

/**
 * Ensures a consistent tag format by incrementing the numerical portion of the highest existing tag.
 * @param {string|null} lastTag - The highest existing tag in the DB (e.g., 'AF-0042')
 * @returns {string} - The newly generated tag (e.g., 'AF-0043')
 */
export const generateAssetTag = (lastTag) => {
  if (!lastTag) return 'AF-0001';
  
  // Strip the prefix, parse the number, increment, and pad back to 4 digits
  const numberPart = parseInt(lastTag.replace('AF-', ''), 10);
  const nextNumber = numberPart + 1;
  
  return `AF-${nextNumber.toString().padStart(4, '0')}`;
};