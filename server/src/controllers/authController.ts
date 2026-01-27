import { Request, Response } from 'express';
import * as bcryptModule from 'bcryptjs';
import * as jwtModule from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { RegisterInput, LoginInput } from '../schemas/auth';
import { AuthRequest } from '../middleware/auth';

// Handle both ESM and CommonJS module formats
const bcrypt = (bcryptModule as any).default || bcryptModule;
const jwt = (jwtModule as any).default || jwtModule;

// Admin-only user creation endpoint
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, password, role, managerId } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate role
    const validRoles = ['USER', 'MANAGER', 'SUPER_ADMIN'];
    const userRole = validRoles.includes(role) ? role : 'USER';

    // If user role and managerId provided, validate manager exists
    if (userRole === 'USER' && managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager || manager.role !== 'MANAGER') {
        return res.status(400).json({ error: 'Invalid manager selected' });
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: userRole,
        managerId: userRole === 'USER' ? managerId : null
      },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        managerId: true,
        manager: {
          select: { id: true, name: true, email: true }
        },
        createdAt: true 
      }
    });

    return res.status(201).json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginInput;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbError: any) {
      console.error('Database error during login:', dbError);
      return res.status(500).json({ error: 'Database error', details: dbError.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active (safely handle if column doesn't exist)
    const isActive = (user as any).isActive;
    if (isActive === false) {
      return res.status(401).json({ error: 'Your account has been deactivated. Please contact administrator.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Handle case where role might not exist yet in database
    const userRole = (user as any).role || 'USER';

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: userRole },
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login', details: error.message });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    return res.json({ user: req.user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get user' });
  }
};

export const logout = async (req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
};

// Admin-only: List all users
export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Map users with isActive field (default true if not exists)
    const usersWithStatus = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive ?? true,
      managerId: user.managerId,
      createdAt: user.createdAt
    }));

    // Get manager info and counts separately
    const usersWithDetails = await Promise.all(usersWithStatus.map(async (user: any) => {
      const details = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          manager: { select: { id: true, name: true, email: true } },
          _count: { select: { documents: true, managedUsers: true } }
        }
      });
      return { ...user, manager: details?.manager, _count: details?._count };
    }));

    return res.json({ users: usersWithDetails });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ error: 'Failed to list users' });
  }
};

// Get all managers (for dropdown when creating users)
export const getManagers = async (req: AuthRequest, res: Response) => {
  try {
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: {
        id: true,
        email: true,
        name: true,
        _count: { select: { managedUsers: true } }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({ managers });
  } catch (error) {
    console.error('Get managers error:', error);
    return res.status(500).json({ error: 'Failed to get managers' });
  }
};

// Update user (for changing profile, role, status, etc.)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, email, password, role, managerId, isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(400).json({ error: 'Cannot modify super admin' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Validate manager if provided
    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager || manager.role !== 'MANAGER') {
        return res.status(400).json({ error: 'Invalid manager selected' });
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) {
      updateData.managerId = role === 'USER' ? (managerId || null) : null;
    } else if (managerId !== undefined) {
      updateData.managerId = managerId || null;
    }

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        managerId: true,
        manager: {
          select: { id: true, name: true, email: true }
        },
        createdAt: true
      }
    });

    // Add isActive to response (may not exist in older schema)
    (updatedUser as any).isActive = (await prisma.user.findUnique({
      where: { id: userId }
    }) as any)?.isActive ?? true;

    return res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};

// Admin-only: Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(400).json({ error: 'Cannot delete super admin' });
    }

    // Delete all user's documents first (this will cascade to recipients, fields, audit logs)
    await prisma.document.deleteMany({ where: { userId } });

    // Now delete the user
    await prisma.user.delete({ where: { id: userId } });

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};
