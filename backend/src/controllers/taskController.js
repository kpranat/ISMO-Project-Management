import { z } from 'zod';
import prisma from '../db.js';

export const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Task name is required'),
  description: z.string().min(1, 'Task description is required'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  status: z.enum(['Pending', 'In Progress', 'Completed']).default('Pending'),
  dueDate: z.string().min(1, 'Due date is required'),
});

export const updateTaskSchema = createTaskSchema.partial();

export const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, search } = req.query;

    const where = {
      project: {
        userId: req.user.id,
      },
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

    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
          userId: req.user.id,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
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
    const { projectId, name, description, priority, status, dueDate } = req.body;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user.id,
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Target project not found or unauthorized' });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        name,
        description,
        priority: priority || 'Medium',
        status: status || 'Pending',
        dueDate,
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

    const existing = await prisma.task.findFirst({
      where: {
        id,
        project: {
          userId: req.user.id,
        },
      },
      include: {
        project: { select: { name: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    if (req.body.projectId && req.body.projectId !== existing.projectId) {
      const newProject = await prisma.project.findFirst({
        where: { id: req.body.projectId, userId: req.user.id },
      });
      if (!newProject) {
        return res.status(404).json({ message: 'New target project not found or unauthorized' });
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: req.body,
      include: {
        project: { select: { name: true } },
      },
    });

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

    const existing = await prisma.task.findFirst({
      where: {
        id,
        project: {
          userId: req.user.id,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    await prisma.task.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

