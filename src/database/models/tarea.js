module.exports = (sequelize, DataTypes) => {
  const Tarea = sequelize.define("Tarea", {
    id_tarea: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    num_orden: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false},
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
    materiales: { type: DataTypes.TEXT, allowNull: true },
    tiempo_necesario: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    id_tecnico: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
  }, {
    tableName: "tarea",
    timestamps: false
  });

  Tarea.associate = (models) => {
    Tarea.belongsTo(models.OrdenTrabajo, { foreignKey: "num_orden", as: "orden" });
    Tarea.belongsTo(models.Tecnico, { foreignKey: "id_tecnico", as: "tecnico" });
  };

  return Tarea;
};
