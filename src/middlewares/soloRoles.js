const ROLE_IDS = {
  admin: 1,
  operario: 2,
  responsable: 3
};

module.exports = (...allowed) => {
  return (req, res, next) => {
    const user = req.session?.user;

    if (!user) {
      return res.status(401).send("Sesión inválida");
    }

    const userRoleId = Number(user.id_rol ?? user.rol);

    const allowedIds = allowed
      .map((role) => ROLE_IDS[role])
      .filter(Boolean);

    if (!allowedIds.includes(userRoleId)) {
      return res.status(403).send("No autorizado");
    }

    next();
  };
};