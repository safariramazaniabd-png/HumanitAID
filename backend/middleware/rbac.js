const { ROLES } = require('../../shared/constants');

const ROLE_HIERARCHY = {
  [ROLES.VIEWER]: 0,
  [ROLES.FINANCE]: 1,
  [ROLES.EDITOR]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.SUPER_ADMIN]: 4,
};

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès interdit' });
    }
    next();
  };
}

function requireMinRole(minimum) {
  const minLevel = ROLE_HIERARCHY[minimum] ?? 0;
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    const userLevel = ROLE_HIERARCHY[req.user.role] ?? -1;
    if (userLevel < minLevel) {
      return res.status(403).json({ error: 'Accès interdit — rôle insuffisant' });
    }
    next();
  };
}

module.exports = { requireRole, requireMinRole };
