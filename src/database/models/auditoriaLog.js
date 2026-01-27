module.exports = (sequelize, DataTypes) => {
  const AuditoriaLog = sequelize.define("AuditoriaLog", {
    id_log: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    evento: { type: DataTypes.ENUM("ELIMINACION","CAMBIO_ESTADO","ASIGNACION_TECNICO","MODIFICACION"), allowNull: false },
    tabla_afectada: { type: DataTypes.STRING(50), allowNull: false },
    id_registro: { type: DataTypes.STRING(50), allowNull: false },
    id_usuario: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    detalle: { type: DataTypes.STRING(500), allowNull: true },
    creado_en: { type: DataTypes.DATE(3), allowNull: false }
  }, {
    tableName: "auditoria_log",
    timestamps: false
  });

  AuditoriaLog.associate = (models) => {
    AuditoriaLog.belongsTo(models.Usuario, { foreignKey: "id_usuario", as: "usuario" });
  };

  return AuditoriaLog;
};
