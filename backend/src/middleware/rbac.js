export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role?.name !== 'ADMIN') {
    return res.status(403).json({
      message: 'Access denied. Only Administrators can perform this action.',
    });
  }
  next();
};

export const requireLeaderOrAdmin = (req, res, next) => {
  const roleName = req.user?.role?.name;
  if (!req.user || (roleName !== 'ADMIN' && roleName !== 'PROJECT_LEADER')) {
    return res.status(403).json({
      message:
        'Access denied. Only Project Leaders and Administrators can create projects or assign tasks.',
    });
  }
  next();
};

