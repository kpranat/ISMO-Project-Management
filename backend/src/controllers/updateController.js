import prisma from '../db.js';

export const getUpdates = async (req, res, next) => {
  try {
    const roleName = req.user.role?.name;
    const userId = req.user.id;

    // Admin sees all updates; Leaders and Members see updates where they are author or target
    const where =
      roleName === 'ADMIN'
        ? {}
        : {
            OR: [
              { targetUserId: userId },
              { userId: userId },
            ],
          };

    const updates = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json(updates);
  } catch (error) {
    next(error);
  }
};

