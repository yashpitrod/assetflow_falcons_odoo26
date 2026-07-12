// src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { ROLES } from '../utils/constants.js';

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.employee.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 409, 'Email is already registered');
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Creates user as Employee by default
    const newUser = await prisma.employee.create({
      data: { name, email, password_hash, role: ROLES.EMPLOYEE },
    });

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return successResponse(res, 201, { user: userWithoutPassword, token });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user
    const user = await prisma.employee.findUnique({ where: { email } });
    
    if (!user || user.status === 'Inactive') {
      return errorResponse(res, 401, 'Invalid credentials or inactive account');
    }

    // 2. Use Prisma's camelCase JS field name for passwordHash
    const dbPasswordHash = user.passwordHash;

    if (!dbPasswordHash) {
      // Don't expose DB internals — forward to central error handler
      return next(new Error('User account is missing credentials. Contact administrator.'));
    }

    // 3. Compare the passwords safely
    const isMatch = await bcrypt.compare(password, dbPasswordHash);
    
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // 4. Generate Token and send success
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // 5. Safely remove the password from the response object using the correct name
    const safeUser = { ...user };
    delete safeUser.passwordHash; 

    return successResponse(res, 200, { user: safeUser, token });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    // Intentionally returns success regardless of whether email exists —
    // prevents user enumeration attacks. Email service is out of scope for hackathon.
    return successResponse(res, 200, {
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};