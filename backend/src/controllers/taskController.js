import { z } from 'zod';
import prisma from '../db.js';

export const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Task name is required'),
  description: z.string().min(1, 'Task description is required'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  status: z.enum(['Pending', 'In Progress', 'Completed']).default('Pending'),
  dueDate: z.string().min(1, 'Due date is required'),
  assignedToId: z.string().nullable().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, search } = req.query;
    const roleName = req.user.role?.name;
    const userId = req.user.id;

    // Scoped visibility:
    // ADMIN: all tasks
    // PROJECT_LEADER: tasks in projects they created/lead OR tasks assigned to them
    // MEMBER: strictly tasks assigned to them
    let roleScope = {};
    if (roleName === 'ADMIN') {
      roleScope = {};
    } else if (roleName === 'PROJECT_LEADER') {
      roleScope = {
        OR: [
          { project: { userId: userId } },
          { assignedToId: userId },
        ],
      };
    } else {
      // MEMBER: strictly tasks assigned to this user
      roleScope = { assignedToId: userId };
    }

    const where = {
      ...roleScope,
      ...(projectId ? { projectId } : {}),
      ...(status && status !== 'All' ? { status } : {}),
      ...(priority && priority !== 'All' ? { priority } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const enriched = tasks.map((task) => ({
      ...task,
      projectName: task.project?.name || '',
    }));

    return res.status(200).json(enriched);
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roleName = req.user.role?.name;
    const userId = req.user.id;

    let roleScope = {};
    if (roleName === 'ADMIN') {
      roleScope = { id };
    } else if (roleName === 'PROJECT_LEADER') {
      roleScope = {
        id,
        OR: [
          { project: { userId: userId } },
          { assignedToId: userId },
        ],
      };
    } else {
      roleScope = { id, assignedToId: userId };
    }

    const task = await prisma.task.findFirst({
      where: roleScope,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    return res.status(200).json({
      ...task,
      projectName: task.project?.name || '',
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { projectId, name, description, priority, status, dueDate, assignedToId } = req.body;
    const roleName = req.user.role?.name;

    // Verify project exists and user is authorized (Admin or Leader owning the project)
    const project = await prisma.project.findFirst({
      where: roleName === 'ADMIN' ? { id: projectId } : { id: projectId, userId: req.user.id },
    });

    if (!project) {
      return res.status(404).json({ message: 'Target project not found or you are not authorized to add tasks to it.' });
    }

    let assignedUser = null;
    if (assignedToId) {
      assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, name: true },
      });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        name,
        description,
        priority: priority || 'Medium',
        status: status || 'Pending',
        dueDate,
        creatorId: req.user.id,
        assignedToId: assignedToId || null,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Record activity log for the assigned user
    await prisma.activityLog.create({
      data: {
        action: 'ASSIGNED',
        message: `${req.user.name} created task "${task.name}"${task.assignedTo ? ` and assigned it to ${task.assignedTo.name}` : ''}.`,
        entityType: 'TASK',
        entityId: task.id,
        entityName: task.name,
        userId: req.user.id,
        targetUserId: task.assignedToId || null,
        projectId: task.projectId,
      },
    });

    return res.status(201).json({
      ...task,
      projectName: project.name,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roleName = req.user.role?.name;
    const userId = req.user.id;

    const existing = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, userId: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Role-specific permission check
    if (roleName === 'MEMBER') {
      // Member can ONLY update their own assigned task, and ONLY the "status" field!
      if (existing.assignedToId !== userId) {
        return res.status(403).json({ message: 'Forbidden. You can only update tasks assigned to you.' });
      }

      const allowedKeys = ['status'];
      const attemptedKeys = Object.keys(req.body);
      const invalidKeys = attemptedKeys.filter((k) => !allowedKeys.includes(k));
      if (invalidKeys.length > 0) {
        return res.status(403).json({
          message: 'Members can only update task completion status, not title, assignment, or project.',
        });
      }
    } else if (roleName === 'PROJECT_LEADER') {
      // Project Leader must either own the parent project or be the task assignee
      const isProjectOwner = existing.project?.userId === userId;
      const isAssignee = existing.assignedToId === userId;
      if (!isProjectOwner && !isAssignee) {
        return res.status(403).json({ message: 'Forbidden. You can only edit tasks in projects you lead.' });
      }
    }

    // If changing project, ensure target project exists and is authorized
    if (req.body.projectId && req.body.projectId !== existing.projectId) {
      const newProject = await prisma.project.findFirst({
        where: roleName === 'ADMIN' ? { id: req.body.projectId } : { id: req.body.projectId, userId: req.user.id },
      });
      if (!newProject) {
        return res.status(404).json({ message: 'New target project not found or unauthorized.' });
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: req.body,
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Record activity logs
    if (req.body.status && req.body.status !== existing.status) {
      await prisma.activityLog.create({
        data: {
          action: 'UPDATED_STATUS',
          message: `${req.user.name} marked task "${updated.name}" as ${updated.status}.`,
          entityType: 'TASK',
          entityId: updated.id,
          entityName: updated.name,
          userId: req.user.id,
          targetUserId: updated.assignedToId || existing.project?.userId,
          projectId: updated.projectId,
        },
      });
    }

    if (req.body.assignedToId && req.body.assignedToId !== existing.assignedToId) {
      await prisma.activityLog.create({
        data: {
          action: 'ASSIGNED',
          message: `${req.user.name} assigned task "${updated.name}" to ${updated.assignedTo?.name || 'a team member'}.`,
          entityType: 'TASK',
          entityId: updated.id,
          entityName: updated.name,
          userId: req.user.id,
          targetUserId: updated.assignedToId,
          projectId: updated.projectId,
        },
      });
    }

    return res.status(200).json({
      ...updated,
      projectName: updated.project?.name || '',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roleName = req.user.role?.name;
    const userId = req.user.id;

    const existing = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (roleName === 'PROJECT_LEADER' && existing.project?.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden. You can only delete tasks in projects you lead.' });
    }

    await prisma.task.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
