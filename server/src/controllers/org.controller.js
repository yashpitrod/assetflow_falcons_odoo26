// src/controllers/org.controller.js
import prisma from '../prismaClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { logActivity } from '../utils/activityLogger.js';
import { ROLES } from '../utils/constants.js';

export const createDepartment = async (req, res, next) => {
  try {
    const department = await prisma.department.create({ data: req.body });
    return successResponse(res, 201, department);
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: { head: { select: { id: true, name: true, email: true } } },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, 200, departments);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Update only provided fields — don't overwrite unset optional fields
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    return successResponse(res, 200, department);
  } catch (error) {
    if (error.code === 'P2025') return errorResponse(res, 404, 'Department not found');
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await prisma.category.create({ data: req.body });
    return successResponse(res, 201, category);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return successResponse(res, 200, categories);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    return successResponse(res, 200, category);
  } catch (error) {
    if (error.code === 'P2025') return errorResponse(res, 404, 'Category not found');
    next(error);
  }
};

export const getEmployees = async (req, res, next) => {
  try {
    // Return all employees with their department for the Employee Directory screen
    const employees = await prisma.employee.findMany({
      select: {
        id: true, name: true, email: true, role: true, status: true, createdAt: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, 200, employees);
  } catch (error) {
    next(error);
  }
};

export const promoteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const employee = await prisma.employee.update({
      where: { id },
      data: { role },
    });

    await logActivity(req.user.id, 'PROMOTED_EMPLOYEE', 'Employee', id, { newRole: role });

    const { passwordHash, ...safeEmployee } = employee;
    return successResponse(res, 200, safeEmployee);
  } catch (error) {
    next(error);
  }
};