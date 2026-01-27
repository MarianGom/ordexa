module.exports = (sequelize, DataTypes) => {
  const Tecnico = sequelize.define("Tecnico", {
    id_tecnico: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false },
    apellido: { type: DataTypes.STRING(80), allowNull: false },
    telefono: { type: DataTypes.STRING(30), allowNull: true },
    correo: { type: DataTypes.STRING(180), allowNull: false, unique: true }
  }, {
    tableName: "tecnico",
    timestamps: false
  });

 Tecnico.associate = (models) => {
    Tecnico.hasMany(models.Tarea, {
      foreignKey: "id_tecnico",
      as: "tareas"
    });
  };

  return Tecnico;
};
