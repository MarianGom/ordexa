module.exports = (sequelize, DataTypes) => {
  const OrdenTrabajo = sequelize.define("OrdenTrabajo", {
    num_orden: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    num_tramite: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    nom_tramite: { type: DataTypes.STRING(120), allowNull: false },
    solicitante: { type: DataTypes.STRING(120), allowNull: false },
    correo_solicitante: { type: DataTypes.STRING(180), allowNull: false },
    fecha_carga: { type: DataTypes.DATEONLY, allowNull: false },
    prioridad: { type: DataTypes.ENUM("Alta", "Media", "Baja"), allowNull: false },
    estado_actual: {
      type: DataTypes.ENUM(
        "En espera","En evaluación","En ejecución","Espera de materiales",
        "Retrasado","Pausado","Finalizado","Cancelado","Fuera de término"
      ),
      allowNull: false,
      defaultValue: "En espera"
    },

    // ✅ ahora sí, bien nombrado
    id_operario_creador: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    // Responsable
    id_responsable: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

    descripcion: { type: DataTypes.TEXT, allowNull: true },
    archivo_principal: { type: DataTypes.STRING(255), allowNull: true },
    activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    tableName: "orden_trabajo",

    // si querés usar creado_en y actualizado_en:
    timestamps: true,
    createdAt: "creado_en",
    updatedAt: "actualizado_en"
  });

  OrdenTrabajo.associate = (models) => {
    // Operario creador (usuario)
    OrdenTrabajo.belongsTo(models.Usuario, { foreignKey: "id_operario_creador", as: "operario" });

    // Responsable (usuario)
    OrdenTrabajo.belongsTo(models.Usuario, { foreignKey: "id_responsable", as: "responsable" });

    // ✅ OT tiene muchas tareas
    OrdenTrabajo.hasMany(models.Tarea, { foreignKey: "num_orden", as: "tareas" });

    OrdenTrabajo.hasMany(models.EstadoHistorial, { foreignKey: "num_orden", as: "historial" });
    OrdenTrabajo.hasMany(models.OrdenArchivo, { foreignKey: "num_orden", as: "archivos" });
  };

  return OrdenTrabajo;
};
