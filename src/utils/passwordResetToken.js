const crypto = require("crypto");

const TOKEN_TTL_MS = 30 * 60 * 1000;
const getSecret = () => process.env.SESSION_SECRET || "ordexa_secret";
const nonceFromHash = (hash) => crypto.createHash("sha256")
  .update(String(hash)).digest("base64url").slice(0, 22);
const sign = (payload) => crypto.createHmac("sha256", getSecret())
  .update(payload).digest("base64url");

const createPasswordResetToken = (usuario) => {
  const payload = Buffer.from(JSON.stringify({
    uid: usuario.id_usuario,
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: nonceFromHash(usuario.password_hash),
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

const verifyPasswordResetToken = (token, usuario) => {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(data.uid) === Number(usuario.id_usuario)
      && Number(data.exp) > Date.now()
      && data.nonce === nonceFromHash(usuario.password_hash);
  } catch {
    return false;
  }
};

const getUserIdFromToken = (token) => {
  try {
    const [payload] = String(token || "").split(".");
    return Number(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).uid) || null;
  } catch {
    return null;
  }
};

module.exports = { createPasswordResetToken, verifyPasswordResetToken, getUserIdFromToken };
