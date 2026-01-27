module.exports = (sequelize, DataTypes) => {
  const OrdenArchivo = sequelize.define("OrdenArchivo", {
    id_archivo: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    num_orden: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    nombre: { type: DataTypes.STRING(255), allowNull: false },
    ruta: { type: DataTypes.STRING(500), allowNull: false },
    mime_type: { type: DataTypes.STRING(120), allowNull: true },
    subido_en: { type: DataTypes.DATE(3), allowNull: false }
  }, {
    tableName: "orden_archivo",
    timestamps: false
  });

  OrdenArchivo.associate = (models) => {
    OrdenArchivo.belongsTo(models.OrdenTrabajo, { foreignKey: "num_orden", as: "orden" });
  };

  return OrdenArchivo;
};
