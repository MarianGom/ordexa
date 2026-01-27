const estadosFinales = ["Finalizado", "Cancelado"];

const puedeCambiarEstado = (estadoActual, nuevoEstado) => {
  if (estadosFinales.includes(estadoActual)) return false;
  if (estadoActual === "Finalizado" && nuevoEstado !== "Finalizado") return false;
  return true;
};

const estaCerrada = (estado) => estadosFinales.includes(estado);

module.exports = {
  estadosFinales,
  puedeCambiarEstado,
  estaCerrada
};
