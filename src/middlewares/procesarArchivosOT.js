const fs = require("fs/promises");
const db = require("../database/models");
const uploadOT = require("./uploadOT");

module.exports = (req, res, next) => {
  uploadOT.array("archivos", 5)(req, res, async (error) => {
    if (!error) {
      const numOrden = Number(req.params.id);
      if (numOrden && req.files?.length) {
        try {
          const existentes = await db.OrdenArchivo.count({ where: { num_orden: numOrden } });
          if (existentes + req.files.length > 5) {
            await Promise.all(
              req.files.map((archivo) => fs.unlink(archivo.path).catch(() => undefined))
            );
            req.session.flash = {
              type: "warning",
              message: `La orden ya tiene ${existentes} archivo${existentes === 1 ? "" : "s"}. El máximo permitido es 5.`,
            };
            return res.redirect(`/ordenes/${numOrden}/editar`);
          }
        } catch (countError) {
          await Promise.all(
            req.files.map((archivo) => fs.unlink(archivo.path).catch(() => undefined))
          );
          return next(countError);
        }
      }
      return next();
    }

    await Promise.all(
      (req.files || []).map((archivo) =>
        fs.unlink(archivo.path).catch(() => undefined)
      )
    );

    const limiteExcedido = error.code === "LIMIT_UNEXPECTED_FILE";
    const archivoMuyGrande = error.code === "LIMIT_FILE_SIZE";
    req.session.flash = {
      type: "error",
      message: limiteExcedido
        ? "Solo se permiten hasta 5 archivos adjuntos por orden."
        : archivoMuyGrande
          ? "Cada archivo adjunto puede pesar como máximo 8 MB."
          : "No se pudieron procesar los archivos adjuntos.",
    };

    const numOrden = Number(req.params.id);
    return res.redirect(numOrden ? `/ordenes/${numOrden}/editar` : "/ordenes");
  });
};
