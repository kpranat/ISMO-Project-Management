import { z } from 'zod';
import prisma from '../db.js';

export const updateRoleSchema = z.object({
  roleName: z.enum(['ADMIN', 'PROJECT_LEADER', 'MEMBER']),
});

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const getRoles = async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(roles);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleName } = req.body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return res.status(400).json({ message: `Role "${roleName}" does not exist.` });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { roleId: role.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Record activity log for role change
    await prisma.activityLog.create({
      data: {
        action: 'ROLE_CHANGED',
        message: `${req.user.name} changed role of ${updatedUser.name} to ${role.name}.`,
        entityType: 'USER',
        entityId: updatedUser.id,
        entityName: updatedUser.name,
        userId: req.user.id,
        targetUserId: updatedUser.id,
      },
    });

    return res.status(200).json({
      message: `User role updated successfully to ${roleName}`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

