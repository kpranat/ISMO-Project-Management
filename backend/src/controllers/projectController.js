import { z } from 'zod';
import prisma from '../db.js';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Project description is required'),
  status: z.enum(['Not Started', 'In Progress', 'Completed']).default('Not Started'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export const updateProjectSchema = createProjectSchema.partial();

export const getProjects = async (req, res, next) => {
  try {
    const { search, status } = req.query;

    const where = {
      userId: req.user.id,
      ...(search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(status && status !== 'All' ? { status } : {}),
    };

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const enriched = projects.map((project) => {
      const taskCount = project.tasks.length;
      const completedTaskCount = project.tasks.filter((t) => t.status === 'Completed').length;
      const { tasks, ...rest } = project;
      return {
        ...rest,
        taskCount,
        completedTaskCount,
      };
    });

    return res.status(200).json(enriched);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    const taskCount = project.tasks.length;
    const completedTaskCount = project.tasks.filter((t) => t.status === 'Completed').length;

    return res.status(200).json({
      ...project,
      taskCount,
      completedTaskCount,
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description, status, startDate, endDate } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'Not Started',
        startDate,
        endDate,
        userId: req.user.id,
      },
    });

    return res.status(201).json({
      ...project,
      taskCount: 0,
      completedTaskCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.project.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: req.body,
    });

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.project.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    await prisma.project.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Project and associated tasks deleted successfully' });
  } catch (error) {
    next(error);
  }
};

