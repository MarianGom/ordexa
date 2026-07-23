const nodemailer = require("nodemailer");

const configurada = () => [
  "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM",
].every((nombre) => Boolean(process.env[nombre]));

const enviarAltaOrden = async (orden) => {
  if (!configurada()) {
    return { enviada: false, motivo: "SMTP no configurado" };
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const baseUrl = String(process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const consultaUrl = `${baseUrl}/consulta?q=${encodeURIComponent(orden.num_orden)}`;

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: orden.correo_solicitante,
    subject: `ORDEXA - Orden de trabajo #${orden.num_orden}`,
    text: [
      `Sr./Sra. ${orden.solicitante}:`,
      "",
      `Su solicitud fue registrada con la orden de trabajo #${orden.num_orden}.`,
      `Número de trámite: ${orden.num_tramite}.`,
      `Puede consultar su estado en: ${consultaUrl}`,
    ].join("\n"),
  });

  return { enviada: true };
};

module.exports = { enviarAltaOrden };
