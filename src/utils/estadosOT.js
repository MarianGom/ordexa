const ESTADOS_OT = [
  "En espera",
  "En evaluación",
  "En ejecución",
  "Pausado",
  "Finalizado",
  "Cancelado",
];

const esEstadoOTValido = (estado) => ESTADOS_OT.includes(estado);

module.exports = { ESTADOS_OT, esEstadoOTValido };
