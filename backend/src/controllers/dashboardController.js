import prisma from '../db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      totalProjects,
      projectsInProgress,
      totalTasks,
      pendingTasks,
      completedTasks,
    ] = await Promise.all([
      // Total projects owned by user
      prisma.project.count({
        where: { userId },
      }),
      // Projects in progress owned by user
      prisma.project.count({
        where: { userId, status: 'In Progress' },
      }),
      // Total tasks in user's projects
      prisma.task.count({
        where: {
          project: { userId },
        },
      }),
      // Pending tasks
      prisma.task.count({
        where: {
          project: { userId },
          status: 'Pending',
        },
      }),
      // Completed tasks
      prisma.task.count({
        where: {
          project: { userId },
          status: 'Completed',
        },
      }),
    ]);

    return res.status(200).json({
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
    });
  } catch (error) {
    next(error);
  }
};

