import { z } from 'zod';
import prisma from '../db.js';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Project description is required'),
  status: z.enum(['Not Started', 'In Progress', 'Completed']).default('Not Started'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  assignedToId: z.string().nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const getProjects = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const roleName = req.user.role?.name;
    const userId = req.user.id;

    // Scoped visibility:
    // ADMIN: all projects
    // PROJECT_LEADER: projects they created OR are assigned to
    // MEMBER: strictly projects assigned to them
    let roleScope = {};
    if (roleName === 'ADMIN') {
      roleScope = {};
    } else if (roleName === 'PROJECT_LEADER') {
      roleScope = {
        OR: [{ userId: userId }, { assignedToId: userId }],
      };
    } else {
      // MEMBER
      roleScope = { assignedToId: userId };
    }

    const where = {
      ...roleScope,
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
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        tasks: {
          select: {
            id: true,
            status: true,
            assignedToId: true,
          },
        },
      },
    });

    const enriched = projects.map((project) => {
      // For tasks count:
      // If MEMBER, only count tasks assigned to that member
      let relevantTasks = project.tasks;
      if (roleName === 'MEMBER') {
        relevantTasks = project.tasks.filter((t) => t.assignedToId === userId);
      }
      const taskCount = relevantTasks.length;
      const completedTaskCount = relevantTasks.filter((t) => t.status === 'Completed').length;
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
    const roleName = req.user.role?.name;
    const userId = req.user.id;

    let roleScope = {};
    if (roleName === 'ADMIN') {
      roleScope = { id };
    } else if (roleName === 'PROJECT_LEADER') {
      roleScope = {
        id,
        OR: [{ userId: userId }, { assignedToId: userId }],
      };
    } else {
      // MEMBER: strictly assigned to them
      roleScope = { id, assignedToId: userId };
    }

    const project = await prisma.project.findFirst({
      where: roleScope,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        tasks: {
          where: roleName === 'MEMBER' ? { assignedToId: userId } : {},
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
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
    const { name, description, status, startDate, endDate, assignedToId } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'Not Started',
        startDate,
        endDate,
        userId: req.user.id,
        assignedToId: assignedToId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Record activity log
    await prisma.activityLog.create({
      data: {
        action: 'CREATED',
        message: `${req.user.name} created project "${project.name}"${project.assignedTo ? ` and assigned it to ${project.assignedTo.name}` : ''}.`,
        entityType: 'PROJECT',
        entityId: project.id,
        entityName: project.name,
        userId: req.user.id,
        targetUserId: project.assignedToId || null,
        projectId: project.id,
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
    const roleName = req.user.role?.name;

    const existing = await prisma.project.findFirst({
      where: roleName === 'ADMIN' ? { id } : { id, userId: req.user.id },
      include: { assignedTo: true },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: req.body,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Log activity if assignedTo changed or status changed
    if (req.body.assignedToId && req.body.assignedToId !== existing.assignedToId) {
      await prisma.activityLog.create({
        data: {
          action: 'ASSIGNED',
          message: `${req.user.name} reassigned project "${updated.name}" to ${updated.assignedTo?.name || 'a team member'}.`,
          entityType: 'PROJECT',
          entityId: updated.id,
          entityName: updated.name,
          userId: req.user.id,
          targetUserId: updated.assignedToId,
          projectId: updated.id,
        },
      });
    } else if (req.body.status && req.body.status !== existing.status) {
      await prisma.activityLog.create({
        data: {
          action: 'UPDATED_STATUS',
          message: `Project "${updated.name}" status changed to ${updated.status}.`,
          entityType: 'PROJECT',
          entityId: updated.id,
          entityName: updated.name,
          userId: req.user.id,
          targetUserId: updated.assignedToId,
          projectId: updated.id,
        },
      });
    }

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roleName = req.user.role?.name;

    const existing = await prisma.project.findFirst({
      where: roleName === 'ADMIN' ? { id } : { id, userId: req.user.id },
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
