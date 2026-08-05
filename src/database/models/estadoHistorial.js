const { ESTADOS_OT } = require("../../utils/estadosOT");

module.exports = (sequelize, DataTypes) => {
  const EstadoHistorial = sequelize.define("EstadoHistorial", {
    id_estado: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    num_orden: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    estado_actual: {
      type: DataTypes.ENUM(...ESTADOS_OT),
      allowNull: false
    },
    fecha_cambio: { type: DataTypes.DATE, allowNull: false,    defaultValue: DataTypes.NOW},
    id_usuario_cambio: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    nota: { type: DataTypes.STRING(255), allowNull: true },
  
  }, {
    tableName: "estado_historial",
    timestamps: false
  });

  EstadoHistorial.associate = (models) => {
    EstadoHistorial.belongsTo(models.OrdenTrabajo, { foreignKey: "num_orden", as: "orden" });
    EstadoHistorial.belongsTo(models.Usuario, { foreignKey: "id_usuario_cambio", as: "usuarioCambio" });
  };

  return EstadoHistorial;
};
