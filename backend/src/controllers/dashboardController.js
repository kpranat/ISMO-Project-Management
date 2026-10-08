import prisma from '../db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const roleName = req.user.role?.name;
    const userId = req.user.id;

    let projectWhere = {};
    let taskWhere = {};

    if (roleName === 'ADMIN') {
      projectWhere = {};
      taskWhere = {};
    } else if (roleName === 'PROJECT_LEADER') {
      projectWhere = {
        OR: [{ userId }, { assignedToId: userId }],
      };
      taskWhere = {
        OR: [{ project: { userId } }, { project: { assignedToId: userId } }, { assignedToId: userId }],
      };
    } else {
      // MEMBER: strictly assigned to them
      projectWhere = { assignedToId: userId };
      taskWhere = { assignedToId: userId };
    }

    const [
      totalProjects,
      projectsInProgress,
      totalTasks,
      pendingTasks,
      completedTasks,
    ] = await Promise.all([
      prisma.project.count({
        where: projectWhere,
      }),
      prisma.project.count({
        where: { ...projectWhere, status: 'In Progress' },
      }),
      prisma.task.count({
        where: taskWhere,
      }),
      prisma.task.count({
        where: { ...taskWhere, status: 'Pending' },
      }),
      prisma.task.count({
        where: { ...taskWhere, status: 'Completed' },
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
