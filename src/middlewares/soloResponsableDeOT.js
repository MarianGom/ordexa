// middlewares/soloResponsableDeOT.js
module.exports = (req, res, next) => {
  const user = req.session?.user;
  if (!user) return res.status(401).send("Sesión inválida");

  const esAdmin = Number(user.id_rol ?? user.rol) === 1;
  const esResponsableDeEsaOT = String(req.orden?.id_responsable) === String(user.id_usuario);

  if (!esAdmin && !esResponsableDeEsaOT) {
    return res.status(403).send("No sos el responsable asignado de esta OT.");
  }

  next();
};
