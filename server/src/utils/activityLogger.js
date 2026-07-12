// src/utils/activityLogger.js
import prisma from '../prismaClient.js';

/**
 * Decouples logging logic from core business transactions to prevent UI failures if audit logging drops.
 * @param {string} actorId - ID of the employee performing the action
 * @param {string} action - Action performed (e.g., 'APPROVED_MAINTENANCE')
 * @param {string} entityType - Type of entity affected (e.g., 'MaintenanceRequest')
 * @param {string} entityId - ID of the affected entity
 * @param {Object} [details] - Optional JSON object with additional context
 */
export const logActivity = async (actorId, action, entityType, entityId, details = null) => {
  try {
    await prisma.activityLog.create({
      data: {
        actor_employee_id: actorId,
        action: action,
        entity_type: entityType,
        entity_id: entityId,
        details: details,
      },
    });
  } catch (error) {
    // We log to console so developers see it, but we don't throw an error because 
    // a failed log shouldn't crash the user's successful core action (like a booking)
    console.error('Failed to log activity to DB:', error);
  }
};