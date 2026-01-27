module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define("Rol", {
    id_rol: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(30), allowNull: false, unique: true }
  }, {
    tableName: "rol",
    timestamps: false
  });

  Rol.associate = (models) => {
    Rol.hasMany(models.Usuario, { foreignKey: "id_rol", as: "usuarios" });
  };

  return Rol;
};
