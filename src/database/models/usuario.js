module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define("Usuario", {
    id_usuario: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    cuil: { type: DataTypes.CHAR(11), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false },
    apellido: { type: DataTypes.STRING(80), allowNull: false },
    id_rol: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    correo: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    telefono: { type: DataTypes.STRING(30), allowNull: true }, // ✅ varchar realista
    domicilio: { type: DataTypes.STRING(180), allowNull: true },
    observaciones: { type: DataTypes.STRING(255), allowNull: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    tableName: "usuario",
    timestamps: false
  });

  Usuario.associate = (models) => {
    Usuario.belongsTo(models.Rol, { foreignKey: "id_rol", as: "rol" });
  };

  return Usuario;
};
